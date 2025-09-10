// llm.js (ESM)
import { InferenceClient } from '@huggingface/inference';

export async function chatWithLLM(messages) {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN missing');

  const provider = process.env.LLM_PROVIDER || 'groq';
  const model = process.env.LLM_MODEL || 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B';

  const client = new InferenceClient(token);
  const res = await client.chatCompletion({
    provider,
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: 0.2,
    max_tokens: 512
  });

  return res?.choices?.[0]?.message?.content ?? JSON.stringify(res);
}

// Ask LLM to emit STRICT JSON only for tool routing.
// Returns parsed JSON or null.
export async function decideTool(systemPrompt, userText) {
    console.log('Deciding tool with prompt:', systemPrompt, userText);
  const raw = await chatWithLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText }
  ]);

  console.log('LLM raw response:', JSON.stringify(raw));
  const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
  const match = s.match(/\{[\s\S]*\}/m);
  try {
    return JSON.parse(match ? match[0] : s);
  } catch {
    return null;
  }
}
