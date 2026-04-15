export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, code } = req.body;

  try {
    const response = await fetch('[https://api.anthropic.com/v1/messages](https://api.anthropic.com/v1/messages)', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // 确保 Vercel 后台变量名完全一致
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: system,
        messages: [{ role: 'user', content: `用户提交的 VEX 代码：\n${code}` }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // 这样能让你在前端直接看到 Anthropic 返回的具体报错
      return res.status(500).json({ error: 'Anthropic API 报错', detail: data.error?.message || '未知错误' });
    }

    let text = data.content[0].text;
    
    // 核心修复：更强的 JSON 提取逻辑，防止 Claude 返回 Markdown 标签导致崩溃
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.status(200).json(parsed);
    } else {
      throw new Error("Claude 返回的内容不包含有效的 JSON 格式");
    }

  } catch (err) {
    return res.status(500).json({
      result: 'wrong',
      short: '服务器崩溃',
      explanation: err.message
    });
  }
}
