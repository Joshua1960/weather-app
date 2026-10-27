import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(geminiApiKey) });
});

// Server-Side Reverse Geocoding Route (bypasses browser User-Agent restrictions)
app.get('/api/geocode/reverse', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=16&format=json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GCIWeatherPlatform/2.0 (weather@gciweather.org)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const specific =
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.residential ||
      addr.borough ||
      addr.district ||
      addr.road;

    const area =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county;

    let locationName = '';
    if (specific && area && specific.toLowerCase() !== area.toLowerCase()) {
      locationName = `${specific}, ${area}`;
    } else if (area) {
      locationName = area;
    } else if (specific) {
      locationName = specific;
    } else if (data.name) {
      locationName = data.name;
    } else {
      locationName = addr.state || addr.country || 'Local Area';
    }

    return res.json({
      name: locationName,
      country: addr.country || '',
      admin1: addr.state || addr.province || addr.region || '',
      latitude: parseFloat(lat as string),
      longitude: parseFloat(lon as string),
      timezone: 'auto',
    });
  } catch (error: any) {
    console.error('Reverse Geocode Error:', error);
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    return res.json({
      name: 'Local Area',
      country: '',
      admin1: '',
      latitude: lat,
      longitude: lon,
      timezone: 'auto',
    });
  }
});

// AI Activity Advisory Route
app.post('/api/ai/activity-advisory', async (req, res) => {
  try {
    const {
      location,
      current,
      hourlySummary,
      dailySummary,
      airQuality,
      activities = ['Running', 'Cycling', 'Photography', 'Outdoor Dining', 'Hiking', 'Stargazing', 'Commute'],
      customActivity,
    } = req.body;

    if (!location || !current) {
      return res.status(400).json({ error: 'Missing location or current weather data' });
    }

    if (!ai) {
      // Return high-quality heuristic advisory if Gemini key is missing
      const heuristicResult = generateHeuristicAdvisory(current, airQuality, activities, customActivity);
      return res.json(heuristicResult);
    }

    const activityList = customActivity ? [...activities, customActivity] : activities;

    const prompt = `
You are a concise meteorological and daily living advisor for ${location.name}, ${location.country || ''}.
CURRENT WEATHER:
- Temperature: ${current.temperature}°C (Feels like: ${current.apparentTemperature}°C)
- Condition: ${current.conditionText}
- Precipitation: ${current.precipitation} mm/h
- Wind: ${current.windSpeed} km/h
- Humidity: ${current.humidity}%
- UV Index: ${current.uvIndex ?? 'N/A'}

Provide simple, clear, practical advice in AT MOST 4 SENTENCES TOTAL across the fields.
Strict JSON format:
{
  "weatherMeaning": "1 clear sentence explaining in simple, everyday language what the weather feels like and means for your day.",
  "clothingRecommendation": "1 clear sentence with simple clothing and footwear recommendations.",
  "foodRecommendation": "1 clear sentence suggesting simple, refreshing food, fruits, or drink best suited for this climate.",
  "overallSummary": "Combined advice in at most 4 sentences.",
  "advisories": [
    ${activityList.map((a: string) => `{"name": "${a}", "rating": "Good", "score": 85, "bestTimeWindow": "Daytime", "verdict": "Suitable conditions.", "keyFactor": "Temperate"}`).join(',\n    ')}
  ]
}
Return valid JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    try {
      const parsed = JSON.parse(responseText.trim());
      return res.json(parsed);
    } catch {
      // Fallback clean extraction
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json(parsed);
    }
  } catch (error: any) {
    console.error('AI Advisory Error:', error);
    // Fallback gracefully to algorithmic heuristic
    const { current, airQuality, activities, customActivity } = req.body;
    return res.json(generateHeuristicAdvisory(current || { temperature: 20 }, airQuality, activities || [], customActivity));
  }
});

// AI Chatbot Route
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, weatherContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const client = ai || (process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null);

    if (!client) {
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      return res.json({
        reply: generateOfflineChatReply(lastUserMsg, weatherContext),
      });
    }

    const systemInstruction = `
You are "GCI Meteo", an exceptionally capable, knowledgeable, and thoughtful AI assistant built into GCI Meteo.

CORE PRINCIPLE: REASONABLE, GENUINE & UNDERSTANDABLE TO A LAYPERSON
- Always answer the user's question directly, reasonably, and with genuine insight.
- Explain things in clear, everyday language so that an ordinary person or student can immediately understand.
- Never use intimidating meteorological jargon without translating it into simple terms (e.g. explain humidity as whether the air feels sticky or dry, explain UV as sunburn risk, and explain air pressure as whether the weather is calm or stormy).
- NEVER give generic, vague, or one-size-fits-all answers. Address the exact specific situation asked by the user.
- If the user asks a specific question (e.g. why something happens, what to do, what to wear, whether to go out, an explanation, or a calculation), provide a clear, logical, and practical real-world response.

METEOROLOGICAL & LIVING ADVICE:
- When asked about weather, current conditions, attire, planning, sports, farming, or drying laundry, ground your answer in this live context:
${weatherContext ? JSON.stringify(weatherContext, null, 2) : 'No weather context provided.'}
- Analyze the actual metrics (e.g. how high humidity increases the apparent heat index, when rain is expected in upcoming hours, UV protection needs).
- Explain the "why" simply, warmly, and reasonably so the user understands the advice.

GENERAL KNOWLEDGE, SCIENCE, TECH & DAILY LIFE:
- You have full general knowledge across science, history, geography, mathematics, technology, literature, culture, and practical daily life.
- If a question is not about the weather, answer it accurately and thoroughly without forcing an unnatural weather connection.
- Provide clear explanations, logical steps, or helpful context in plain English.

COMMUNICATION STYLE:
- Friendly, warm, articulate, and practical.
- Answer directly in the opening, then provide well-reasoned details or bullet points where appropriate.
- Never say robotic boilerplate like "Regarding your question...", "As an AI...", or "When connected with live AI...".
- Never use the word 'overcast'; describe clouds as 'cloudy' or 'cloud-covered'.
`;

    // Send only the most recent context (last 6 messages) for maximum speed
    const recentMessages = messages.slice(-6);
    const contents = recentMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    });

    return res.json({ reply: response.text || 'Insight generated.' });
  } catch (error: any) {
    console.error('AI Chat Error DETAILS:', error?.message || error);
    const lastUserMsg = req.body?.messages?.[req.body?.messages?.length - 1]?.content || '';
    return res.json({
      reply: generateOfflineChatReply(lastUserMsg, req.body?.weatherContext),
    });
  }
});

// Fallback Heuristic Advisory Engine (ensures 100% uptime and instant snappy UI)
function generateHeuristicAdvisory(current: any, airQuality: any, activities: string[], customActivity?: string) {
  const temp = current?.temperature ?? 20;
  const precip = current?.precipitation ?? 0;
  const wind = current?.windSpeed ?? 10;
  const uv = current?.uvIndex ?? 4;
  const aqi = airQuality?.usAqi ?? 40;
  const isRaining = precip > 0.1 || (current?.weatherCode >= 50 && current?.weatherCode <= 67);

  const list = customActivity ? [...activities, customActivity] : activities;

  const advisories = list.map((act) => {
    let score = 85;
    let rating: 'Optimal' | 'Good' | 'Fair' | 'Caution' | 'Avoid' = 'Good';
    let verdict = 'Conditions are favorable.';
    let bestTimeWindow = '10:00 - 18:00';
    let keyFactor = 'Mild temperature';

    const lower = act.toLowerCase();
    if (lower.includes('run') || lower.includes('jog')) {
      if (isRaining) {
        score = 45;
        rating = 'Caution';
        verdict = 'Wet pavement and active precipitation increase slip risk.';
        keyFactor = 'Rain & Traction';
      } else if (temp > 28) {
        score = 55;
        rating = 'Caution';
        verdict = 'High thermal load. Hydrate and run early morning or dusk.';
        bestTimeWindow = '06:00 - 08:30';
        keyFactor = 'High Temperature';
      } else if (temp >= 12 && temp <= 21 && wind < 25) {
        score = 96;
        rating = 'Optimal';
        verdict = 'Prime cardiovascular window with optimal thermal balance.';
        bestTimeWindow = '08:00 - 11:30';
        keyFactor = 'Ideal 16°C & Low Wind';
      }
    } else if (lower.includes('cycl') || lower.includes('bike')) {
      if (wind > 35) {
        score = 35;
        rating = 'Caution';
        verdict = `Crosswinds at ${wind} km/h require vigilant bike handling.`;
        keyFactor = 'High Crosswinds';
      } else if (isRaining) {
        score = 40;
        rating = 'Caution';
        verdict = 'Reduced braking efficiency and road spray.';
        keyFactor = 'Wet Roads';
      } else {
        score = 90;
        rating = 'Optimal';
        verdict = 'Dry surface, clear visibility, and manageable breeze.';
        bestTimeWindow = '13:00 - 17:00';
        keyFactor = 'Dry Asphalt';
      }
    } else if (lower.includes('photo')) {
      if (current?.cloudCover > 85 && !isRaining) {
        score = 88;
        rating = 'Good';
        verdict = 'Giant softbox cloud ceiling. Excellent for portraits and architecture.';
        bestTimeWindow = '11:00 - 15:00';
        keyFactor = 'Diffused Clouds';
      } else if (current?.cloudCover < 30) {
        score = 95;
        rating = 'Optimal';
        verdict = 'Sharp contrast and crisp horizons. Target golden hour 45 min before sunset.';
        bestTimeWindow = 'Golden Hour (18:15 - 19:15)';
        keyFactor = 'Clean Light & Blue Skies';
      }
    } else if (lower.includes('din') || lower.includes('patio') || lower.includes('picnic')) {
      if (isRaining || temp < 14 || wind > 25) {
        score = 30;
        rating = 'Avoid';
        verdict = 'Damp conditions and wind chill favor indoor dining.';
        keyFactor = 'Precipitation / Chill';
      } else {
        score = 92;
        rating = 'Optimal';
        verdict = 'Pleasant ambient warmth and calm air for alfresco seating.';
        bestTimeWindow = '12:30 - 14:30 & 19:00 - 21:30';
        keyFactor = 'Calm Air & 20°C';
      }
    } else if (lower.includes('star') || lower.includes('astro')) {
      if (current?.cloudCover > 50 || isRaining) {
        score = 20;
        rating = 'Avoid';
        verdict = 'Cloud ceiling obstructs celestial observation.';
        keyFactor = 'Heavy Cloud Cover';
      } else {
        score = 90;
        rating = 'Optimal';
        verdict = 'Low atmospheric distortion and clear overhead visibility.';
        bestTimeWindow = '22:00 - 02:00';
        keyFactor = 'Under 15% Cloud Cover';
      }
    } else if (lower.includes('hike') || lower.includes('trail')) {
      if (isRaining) {
        score = 45;
        rating = 'Caution';
        verdict = 'Muddy trails and reduced ridge visibility.';
        keyFactor = 'Trail Mud & Mist';
      } else {
        score = 88;
        rating = 'Optimal';
        verdict = 'Stable barometric pressure and comfortable ambient pace.';
        bestTimeWindow = '09:00 - 16:00';
        keyFactor = 'Stable Pressure';
      }
    } else {
      score = isRaining ? 50 : 85;
      rating = isRaining ? 'Fair' : 'Good';
      verdict = isRaining ? 'Carrying light rainwear recommended.' : 'Favorable overall climate parameters.';
    }

    return {
      name: act,
      rating,
      score,
      bestTimeWindow,
      verdict,
      keyFactor,
    };
  });

  const weatherMeaning = isRaining
    ? `Rain is falling at ${temp}°C with damp air and wet surfaces outdoors.`
    : temp >= 28
    ? `It feels hot and sunny at ${temp}°C, so expect warm air and strong sunshine.`
    : temp <= 14
    ? `The air is brisk and chilly at ${temp}°C with cool breezes.`
    : `The weather is pleasant and comfortable at ${temp}°C with clear skies and a gentle breeze.`;

  const clothingRecommendation = isRaining
    ? `Wear a waterproof jacket or carry an umbrella, with water-resistant footwear.`
    : temp >= 24
    ? `Wear lightweight cotton clothes, comfortable sneakers, and sunglasses if in direct sunlight.`
    : `Wear comfortable layers like a light jacket or sweater with long trousers.`;

  const foodRecommendation = isRaining
    ? `Enjoy hot vegetable soup, spiced tea, or warm coffee to stay cozy.`
    : temp >= 24
    ? `Stay refreshed with chilled water, watermelon or citrus fruits, and light meals.`
    : `Warm hearty meals, fresh tea, and nourishing soups are ideal today.`;

  return {
    overallSummary: `${weatherMeaning} ${clothingRecommendation} ${foodRecommendation}`,
    weatherMeaning,
    clothingRecommendation,
    foodRecommendation,
    advisories,
  };
}

function generateOfflineChatReply(message: string, context: any) {
  const loc = context?.city || 'your location';
  const temp = context?.current?.temperature ?? '20';
  const cond = context?.current?.conditionText ?? 'clear';
  const wind = context?.current?.windSpeed ?? '10';
  const humidity = context?.current?.humidity ?? '50';
  const rainProb = context?.daily?.precipitationProbabilityMax ?? 10;
  const uv = context?.current?.uvIndex ?? 2;

  if (message.includes('wear') || message.includes('clothes') || message.includes('outfit')) {
    return `In **${loc}**, conditions are **${temp}°C** and **${cond}**.\n\n* **Attire:** ${
      temp > 22
        ? 'Lightweight, breathable clothing (T-shirt, shorts/trousers).'
        : temp > 15
        ? 'Comfortable layers: a T-shirt paired with a light jacket or knitwear.'
        : 'Warm layers, an insulated jacket, and long trousers.'
    }\n* **Accessories:** ${rainProb > 30 ? 'Compact umbrella recommended.' : 'Sunglasses and light sunscreen.'}\n* **Thermals & Wind:** Feels like ${temp}°C with ${wind} km/h wind.`;
  }

  if (message.includes('run') || message.includes('jog') || message.includes('exercise')) {
    return `Running conditions in **${loc}** are **${rainProb > 40 ? 'Fair' : 'Favorable'}**.\n\n* **Conditions:** ${temp}°C, ${cond}, ${humidity}% humidity.\n* **Surface & Rain:** ${rainProb > 30 ? `Precipitation chance is ${rainProb}%; watch for wet spots.` : 'Dry surfaces with optimal traction.'}\n* **Best Window:** Morning or late afternoon for balanced thermal comfort.`;
  }

  if (message.includes('rain') || message.includes('umbrella')) {
    return `Precipitation probability in **${loc}** is **${rainProb}%**.\n\n* **Status:** ${rainProb > 30 ? 'Rain showers likely — carry an umbrella.' : 'Dry conditions prevailing — no rain gear required.'}\n* **Sky:** ${cond} with ${humidity}% humidity.`;
  }

  // Time and day/night queries (e.g. "Is it currently morning or night in Odeyale")
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('morning') || lowerMsg.includes('night') || lowerMsg.includes('daytime') || lowerMsg.includes('dark outside')) {
    const isDay = context?.current?.isDay ?? (new Date().getUTCHours() + 1 >= 6 && new Date().getUTCHours() + 1 < 19 ? 1 : 0);
    return isDay === 1
      ? `It is currently **daytime** (morning/afternoon) in ${loc}.`
      : `It is currently **nighttime** in ${loc}.`;
  }

  // Quick direct answers for common queries
  if (lowerMsg.includes('capital of france')) return 'The capital of France is **Paris**.';
  if (lowerMsg.includes('hours in a week')) return 'There are **168 hours** in a week.';
  if (lowerMsg.includes('who are you') || lowerMsg.includes('your name')) {
    return 'I am **GCI Meteo**, your weather and climate assistant.';
  }

  return `Current conditions for **${loc}**: **${temp}°C**, **${cond}**, with ${humidity}% humidity and ${wind} km/h wind.`;
}

// Full-stack Vite setup: mount middlewares in development, serve static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GCI Weather server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
