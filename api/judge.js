export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, code } = req.body;

  if (!code || !system) {
    return res.status(400).json({ error: 'Missing code or system prompt' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: system,
        messages: [
          { role: 'user', content: `用户提交的 VEX 代码：\n\`\`\`\n${code}\n\`\`\`` }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ result: 'wrong', short: 'API 错误', explanation: data.error?.message || '未知错误' });
    }

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({
      result: 'wrong',
      short: '服务错误',
      explanation: '判断服务出现错误：' + err.message
    });
  }
}
