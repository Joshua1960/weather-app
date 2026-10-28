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

    const lastUserMsg = messages[messages.length - 1]?.content || '';

    // Check all standard Gemini API key environment variable names for Vercel & Node hosting
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      console.warn('[Vercel Chat API] No GEMINI_API_KEY found in process.env. Using enhanced synoptic offline intelligence.');
      return res.status(200).json({
        reply: generateOfflineChatReply(lastUserMsg, weatherContext, true),
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
You are "GCI Meteo", an exceptionally capable, knowledgeable, empathetic, and thoughtful AI meteorological and daily living advisor built by the Byte Busters Coding Club of Government College Ibadan.

CORE PRINCIPLE: REASONABLE, GENUINE, VIVID & UNDERSTANDABLE TO A LAYPERSON
- Always answer the user's question directly, reasonably, and with genuine real-world insight.
- Explain things in clear, warm everyday language so that an ordinary person, student, or family can immediately understand and act on it.
- Never use intimidating meteorological jargon without translating it into simple terms (e.g., explain humidity as whether the air feels sticky or dry and how that affects sweat evaporation, explain UV as sunburn risk, and explain air pressure as whether the weather is calm or stormy).
- NEVER give generic, vague, or one-size-fits-all 2-bullet answers. Give rich, thoughtful, multi-perspective advice.
- When asked about food, breakfast, running, attire, laundry, travel, or health, deeply personalize the recommendation to the exact time of day, location, temperature, humidity, and upcoming rain/sun windows.

METEOROLOGICAL & LIVING CONTEXT:
${weatherContext ? JSON.stringify(weatherContext, null, 2) : 'No weather context provided.'}

COMMUNICATION STYLE:
- Friendly, warm, articulate, and practical.
- Use clean formatting with clear paragraphs and bullet points where helpful.
- Never use robotic boilerplate like "As an AI model...", "Regarding your inquiry...", or "When connected with live AI...".
- Never use the word 'overcast'; describe clouds as 'cloudy' or 'cloud-covered'.
`;

    // Sanitize multi-turn conversation history for the Gemini API:
    // 1. Filter out empty or whitespace-only messages
    // 2. Strip leading 'model' messages (Gemini requires turn 0 to be 'user')
    // 3. Merge adjacent messages of the same role so roles strictly alternate (user -> model -> user)
    // 4. Ensure contents ends with the user's latest query
    const cleanedMessages: { role: 'user' | 'model'; text: string }[] = messages
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        text: m.content.trim(),
      }));

    // Discard leading model turns (e.g. initial greeting)
    while (cleanedMessages.length > 0 && cleanedMessages[0].role !== 'user') {
      cleanedMessages.shift();
    }

    // Merge adjacent identical roles to ensure strict user/model alternation
    const alternatingContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const item of cleanedMessages) {
      if (alternatingContents.length > 0 && alternatingContents[alternatingContents.length - 1].role === item.role) {
        alternatingContents[alternatingContents.length - 1].parts[0].text += `\n\n${item.text}`;
      } else {
        alternatingContents.push({
          role: item.role,
          parts: [{ text: item.text }],
        });
      }
    }

    // Ensure the conversation ends with the user's message
    if (alternatingContents.length === 0 || alternatingContents[alternatingContents.length - 1].role !== 'user') {
      alternatingContents.push({
        role: 'user',
        parts: [{ text: lastUserMsg || 'What are the current meteorological conditions and living recommendations?' }],
      });
    }

    // Take the most recent alternating turns (up to 6)
    let contents = alternatingContents.slice(-6);
    // Ensure the window still starts with user
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }
    if (contents.length === 0) {
      contents = [{ role: 'user', parts: [{ text: lastUserMsg }] }];
    }

    // Cascade through supported Gemini models: try gemini-3.8-flash first, then gemini-3.1-flash-lite
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let generatedReply: string | null = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
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
        console.warn(`[Vercel Chat API] Model ${model} call failed:`, err?.message || err);
      }
    }

    if (generatedReply) {
      return res.status(200).json({ reply: generatedReply });
    }

    console.error('[Vercel Chat API] All Gemini models failed, falling back to enhanced offline intelligence:', lastError?.message || lastError);
    return res.status(200).json({
      reply: generateOfflineChatReply(lastUserMsg, weatherContext, true),
    });
  } catch (error: any) {
    console.error('[Vercel Chat API] Handler error:', error?.message || error);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const lastUserMsg = body?.messages?.[body?.messages?.length - 1]?.content || '';
    return res.status(200).json({
      reply: generateOfflineChatReply(lastUserMsg, body?.weatherContext, true),
    });
  }
}
