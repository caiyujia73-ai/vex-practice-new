export default async function handler(req, res) {
  // 1. 基础校验
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, code } = req.body;
  if (!code || !system) {
    return res.status(400).json({ error: 'Missing code or system prompt' });
  }

  try {
    // 2. 发起 API 请求 (手动输入 URL 确保无乱码)
    const apiUrl = '[https://api.anthropic.com/v1/messages](https://api.anthropic.com/v1/messages)';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        system: system,
        messages: [
          { role: 'user', content: `用户提交的 VEX 代码：\n${code}` }
        ]
      })
    });

    // 3. 处理 Anthropic 返回的错误 (比如 401, 404, 429)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(500).json({
        result: 'wrong',
        short: 'API 报错',
        explanation: `Anthropic 状态码 ${response.status}: ${errorData.error?.message || '未知错误'}`
      });
    }

    const data = await response.json();
    const rawText = data.content[0].text;

    // 4. 正则提取 JSON (防止 Claude 返回 Markdown 格式导致 JSON.parse 失败)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({
        result: 'wrong',
        short: '格式错误',
        explanation: '模型没有返回有效的 JSON 结构'
      });
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsedData);

  } catch (err) {
    // 5. 捕获运行时崩溃 (比如 URL 解析失败、网络超时等)
    return res.status(500).json({
      result: 'wrong',
      short: '服务器崩溃',
      explanation: `运行错误: ${err.message}`
    });
  }
}
