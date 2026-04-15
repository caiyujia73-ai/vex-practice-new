const VEX_LIBRARY = `
=== VEX BUILT-IN FUNCTION REFERENCE (SideFX Official) ===

MATH: abs(x), ceil(x), floor(x), round(x), clamp(val,min,max),
fit(val,omin,omax,nmin,nmax), fit01(val,nmin,nmax), min(a,b), max(a,b),
pow(base,exp), sqrt(x), log(x), exp(x), sin/cos/tan(x) [radians],
degrees(x), radians(x), sign(x), frac(x), mod(x,y), lerp(a,b,t),
smoothstep(edge0,edge1,x), dot(a,b), cross(a,b), length(v),
normalize(v), distance(p1,p2)

NOISE: noise(pos)→float 0~1, vnoise(pos)→vector, snoise(pos)→-1~1,
turbulence(pos,oct,rough,atten), fbm(pos,oct,rough,atten), curlnoise(pos)→vector

RANDOM: rand(seed)→0~1 (seed: int/float/vector), nrandom()

WRANGLE ATTRIBUTES:
@ptnum=point index(int), @numpt=total points(int), @P=position(vector),
@Cd=color(vector default {1,1,1}), @N=normal(vector), @v=velocity(vector),
@pscale=scale(float), @id=id(int), @primnum=prim index, @vtxnum=vertex index
v@attr / f@attr / i@attr / s@attr = typed attribute read/write

GEOMETRY: point(geo,attrib,pt), setpointattrib(geo,name,pt,val),
addpoint(geo,pos)→ptnum, removepoint(geo,pt), addprim(geo,type,...),
removeprim(geo,prim,del_pts), npoints(geo), nearpoint(geo,pos),
nearpoints(geo,pos,radius)→array. geo=0 means current input.

TYPES: int(x), float(x), string(x), set(x,y,z) or {x,y,z} for vector literals

ARRAY: len(a), append(a,v), push(a,v), pop(a), a[i]

CONTROL: if/else, for(init;cond;step), while(cond), foreach(item;array), break/continue

COMMON PATTERNS:
  @Cd = {1,0,0};                          // red
  @Cd = set(rand(@ptnum),0,0);            // random red channel
  @P += noise(@P*2)*0.5;                  // noise displacement
  if(@ptnum%2==0) removepoint(0,@ptnum); // remove even points
  float t = fit(@P.y, 0, 5, 0, 1);       // normalize Y
  @Cd = lerp({1,0,0},{0,0,1},t);         // red-to-blue gradient
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { questionContext, code } = req.body;

  if (!code || !questionContext) {
    return res.status(400).json({ error: 'Missing code or questionContext' });
  }

  const systemPrompt = `你是一个 Houdini VEX 代码评判专家，熟悉 SideFX 官方 VEX 语言规范。

官方 VEX 函数参考（用于辅助判断）：
${VEX_LIBRARY}

当前题目：
${questionContext}

根据官方文档和题目要求判断用户代码。只回复 JSON，不要任何其他文字：
{
  "result": "correct" | "wrong" | "partial",
  "short": "一句话判断（15字以内）",
  "explanation": "详细中文解释：哪里对、哪里错、正确写法是什么。如用了错误函数，参照文档指出正确用法。"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `用户提交的 VEX 代码：\n${code}` }]
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
    return res.status(500).json({ result: 'wrong', short: '服务错误', explanation: '判断服务出现错误：' + err.message });
  }
}
