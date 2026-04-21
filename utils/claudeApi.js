const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(apiKey, systemPrompt, userMessage) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr);
  } catch {
    throw new Error('MALFORMED_JSON');
  }
}

export function buildSmartHomeSystemPrompt(rooms, currentTime) {
  return `You are the AI controller for NEXUS HOME. You receive natural language commands and must return a JSON action plan.

Current home state: ${JSON.stringify(rooms, null, 2)}
Current time: ${currentTime}

Respond ONLY with valid JSON in this exact schema:
{
  "actions": [
    { "room": "livingRoom", "device": "lights", "state": true, "value": 70 }
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
