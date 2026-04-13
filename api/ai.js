export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system } = req.body;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 300,
        messages: [
          { role: 'system', content: system || 'You are Vestigia AI, a helpful study assistant.' },
          ...messages.slice(-6)
        ],
      }),
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Keep going!';
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ reply: "Stay consistent — that's where breakthroughs happen!" });
  }
}
