export default async function handler(req, res) {
  try {
    // 1. 立即检查环境变量（防止 fetch 崩溃）
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey.trim() === "") {
      return res.status(200).json({
        result: 'wrong',
        short: '配置缺失',
        explanation: 'Vercel 后台找不到 ANTHROPIC_API_KEY，请检查 Environment Variables 并在保存后 Redeploy。'
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { system, code } = req.body;

    // 2. 使用更稳健的 fetch 调用
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: system,
        messages: [{ role: 'user', content: `代码：\n${code}` }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        result: 'wrong',
        short: 'API 报错',
        explanation: data.error?.message || 'Anthropic 返回了错误'
      });
    }

    const rawText = data.content[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return res.status(200).json(JSON.parse(jsonMatch[0]));
    } else {
      return res.status(200).json({ result: 'wrong', short: '格式错误', explanation: '模型未返回 JSON' });
    }

  } catch (err) {
    // 捕获所有错误并返回 200，这样你能直接在网页弹窗看到报错文字
    return res.status(200).json({
      result: 'wrong',
      short: '运行时错误',
      explanation: err.message
    });
  }
}
