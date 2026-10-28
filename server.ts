import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { generateHeuristicAdvisory, generateOfflineChatReply } from './src/utils/aiFallback';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const geminiApiKey =
  process.env.GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY;

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
  const lat = req.query.lat;
  const lon = req.query.lon;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  const parsedLat = parseFloat(lat as string);
  const parsedLon = parseFloat(lon as string);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=18&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GCIWeatherPlatform/2.0 (weather@gciweather.org)',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      const pinpoint =
        data.name ||
        addr.amenity ||
        addr.building ||
        addr.road ||
        addr.pedestrian ||
        addr.neighbourhood ||
        addr.suburb;

      const subDistrict =
        (addr.neighbourhood && addr.neighbourhood !== pinpoint ? addr.neighbourhood : '') ||
        (addr.suburb && addr.suburb !== pinpoint ? addr.suburb : '') ||
        addr.quarter ||
        addr.residential ||
        addr.borough ||
        addr.city_district ||
        addr.county;

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.state;

      let displayName = '';
      if (pinpoint && subDistrict && pinpoint.toLowerCase() !== subDistrict.toLowerCase()) {
        displayName = `${pinpoint}, ${subDistrict}`;
      } else if (pinpoint && city && pinpoint.toLowerCase() !== city.toLowerCase()) {
        displayName = `${pinpoint}, ${city}`;
      } else if (pinpoint) {
        displayName = pinpoint;
      } else if (subDistrict && city) {
        displayName = `${subDistrict}, ${city}`;
      } else if (city) {
        displayName = city;
      } else {
        displayName = addr.state || addr.country || 'Local Area';
      }

      const admin1 = [
        addr.county || addr.city_district,
        addr.state || addr.province || addr.region,
      ]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', ');

      return res.json({
        name: displayName,
        country: addr.country || '',
        admin1: admin1,
        latitude: parsedLat,
        longitude: parsedLon,
        timezone: 'auto',
      });
    }
  } catch (error: any) {
    console.warn('Reverse Geocode Nominatim Error:', error);
  }

  // Fallback to BigDataCloud
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const locality = bdcData.locality || bdcData.city || bdcData.principalSubdivision;
      const district = bdcData.localityInfo?.administrative?.[3]?.name || bdcData.localityInfo?.administrative?.[2]?.name;

      let name = locality;
      if (district && locality && district.toLowerCase() !== locality.toLowerCase()) {
        name = `${locality}, ${district}`;
      }

      return res.json({
        name: name || 'Local Area',
        country: bdcData.countryName || '',
        admin1: bdcData.principalSubdivision || '',
        latitude: parsedLat,
        longitude: parsedLon,
        timezone: 'auto',
      });
    }
  } catch (err) {
    console.warn('BigDataCloud fallback failed:', err);
  }

  return res.json({
    name: 'Local Area',
    country: '',
    admin1: '',
    latitude: parsedLat,
    longitude: parsedLon,
    timezone: 'auto',
  });
});

// Server-Side Geocode Search Proxy
app.get('/api/geocode/search', async (req, res) => {
  const q = req.query.q;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json([]);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q.trim()
    )}&format=json&addressdetails=1&limit=8`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GCIWeatherPlatform/2.0 (weather@gciweather.org)',
      },
    });

    if (!response.ok) {
      return res.json([]);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return res.json([]);

    const results = data.map((item: any) => {
      const addr = item.address || {};
      const title = item.name || item.display_name.split(',')[0];
      const admin = [
        addr.suburb || addr.neighbourhood || addr.city_district || addr.road,
        addr.city || addr.town || addr.county,
        addr.state,
      ]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(', ');

      return {
        name: title,
        country: addr.country || '',
        admin1: admin || addr.state || '',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        timezone: 'auto',
      };
    });

    return res.json(results);
  } catch (error: any) {
    console.warn('Geocode Search Proxy Error:', error);
    return res.json([]);
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

    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const client = ai || (process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null);

    if (!client) {
      return res.json({
        reply: generateOfflineChatReply(lastUserMsg, weatherContext, true),
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

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let generatedReply: string | null = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        });

        if (response?.text) {
          generatedReply = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Local Server Chat API] Model ${model} failed:`, err?.message || err);
      }
    }

    if (generatedReply) {
      return res.json({ reply: generatedReply });
    }

    return res.json({
      reply: generateOfflineChatReply(lastUserMsg, req.body?.weatherContext, true),
    });
  } catch (error: any) {
    console.error('AI Chat Error DETAILS:', error?.message || error);
    const lastUserMsg = req.body?.messages?.[req.body?.messages?.length - 1]?.content || '';
    return res.json({
      reply: generateOfflineChatReply(lastUserMsg, req.body?.weatherContext, true),
    });
  }
});

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
