const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export async function callGroq(apiKey, systemPrompt, userMessage) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey || GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message ?? `Groq API error ${response.status}`;
    console.error('Groq error:', JSON.stringify(err));
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';

  // Extract JSON from markdown code block or raw object
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('MALFORMED_JSON');
  }
}

export function buildSmartHomeSystemPrompt(rooms, currentTime) {
  return `You are the AI controller for NEXUS HOME smart home system. You receive natural language commands and must return a JSON action plan.

Current home state: ${JSON.stringify(rooms, null, 2)}
Current time: ${currentTime}

Respond ONLY with valid JSON in this exact schema (no extra text, no markdown outside the JSON block):
{
  "actions": [
    { "room": "livingRoom", "device": "lights", "state": true }
  ],
  "confirmation": "Natural language summary of what you did",
  "reasoning": "Why you made these specific choices",
  "unknowns": ["list of devices or rooms mentioned that don't exist"]
}

Valid rooms: livingRoom, bedroom, kitchen, bathroom
Valid devices per room:
  livingRoom: lights, fan, ac, tv
  bedroom: lights, fan, ac, tv
  kitchen: lights, fan, stove
  bathroom: lights, fan

If the command is ambiguous, make the most sensible inference and explain in reasoning.`;
}
