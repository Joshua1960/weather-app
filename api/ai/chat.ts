import { GoogleGenAI } from '@google/genai';
import { generateOfflineChatReply } from '../../src/utils/aiFallback';

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
    const { messages, weatherContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const lastUserMsg = messages[messages.length - 1]?.content || '';

    if (!apiKey) {
      return res.status(200).json({
        reply: generateOfflineChatReply(lastUserMsg, weatherContext),
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    const recentMessages = messages.slice(-6);
    const contents = recentMessages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    });

    return res.status(200).json({ reply: response.text || generateOfflineChatReply(lastUserMsg, weatherContext) });
  } catch (error: any) {
    console.error('Vercel API Chat Error:', error?.message || error);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const lastUserMsg = body?.messages?.[body?.messages?.length - 1]?.content || '';
    return res.status(200).json({
      reply: generateOfflineChatReply(lastUserMsg, body?.weatherContext),
    });
  }
}
