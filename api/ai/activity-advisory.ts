import { GoogleGenAI } from '@google/genai';
import { generateHeuristicAdvisory } from '../../src/utils/aiFallback';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { location, current, hourlySummary, dailySummary, airQuality, activities, customActivity } = body;

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      console.warn('[Vercel Advisory API] No GEMINI_API_KEY found in process.env. Using heuristic advisory engine.');
      const fallback = generateHeuristicAdvisory(current, airQuality, activities || [], customActivity);
      return res.status(200).json(fallback);
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `
You are GCI Meteo's Living & Meteorological Advisory Intelligence, built by Government College Ibadan Byte Busters.
Evaluate local weather conditions for ${location?.name || 'this location'}:
- Current: ${current?.temperature}°C, Feels like: ${current?.apparentTemperature}°C, Condition: ${current?.conditionText}, Wind: ${current?.windSpeed} km/h, Humidity: ${current?.humidity}%, UV: ${current?.uvIndex}
- Air Quality: US AQI ${airQuality?.usAqi} (${airQuality?.statusText})
- Hourly Context: ${hourlySummary || 'Standard progression'}
- Daily Context: ${JSON.stringify(dailySummary || {})}
- Target Activities: ${JSON.stringify(activities || [])}
${customActivity ? `- Custom User Activity Query: "${customActivity}"` : ''}

Respond with strict JSON matching this structure:
{
  "weatherMeaning": "1 clear sentence explaining what today's weather feels like in plain English.",
  "clothingRecommendation": "1 practical sentence recommending exact everyday clothing and accessories to wear today.",
  "foodRecommendation": "1 clear sentence recommending healthy foods, drinks, or hydration matching the temperature and weather.",
  "overallSummary": "Concise combined summary",
  "advisories": [
    {
      "name": "Activity Name",
      "rating": "Optimal" | "Good" | "Fair" | "Caution" | "Avoid",
      "score": number between 0 and 100,
      "bestTimeWindow": "e.g. 09:00 - 11:30",
      "verdict": "Clear practical 1-sentence verdict",
      "keyFactor": "e.g. Low UV & 20°C"
    }
  ]
}
`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let parsedResult: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (response?.text) {
          try {
            parsedResult = JSON.parse(response.text.trim());
            break;
          } catch {
            const clean = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedResult = JSON.parse(clean);
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[Vercel Advisory API] Model ${model} failed:`, err?.message || err);
      }
    }

    if (parsedResult) {
      return res.status(200).json(parsedResult);
    }

    const fallback = generateHeuristicAdvisory(body.current, body.airQuality, body.activities || [], body.customActivity);
    return res.status(200).json(fallback);
  } catch (err: any) {
    console.error('Vercel Advisory Error:', err?.message || err);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const fallback = generateHeuristicAdvisory(body.current, body.airQuality, body.activities || [], body.customActivity);
    return res.status(200).json(fallback);
  }
}
