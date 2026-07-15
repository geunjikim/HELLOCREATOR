// Vercel Serverless Function
// The OpenAI API key lives ONLY here, as an environment variable on Vercel.
// It is never sent to the browser or included in the HTML/JS.
//
// Setup:
//   1. In your Vercel project settings -> Environment Variables,
//      add OPENAI_API_KEY = sk-... (your real key)
//   2. Deploy. This file is automatically served at /api/generate

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: '서버에 OPENAI_API_KEY가 설정되어 있지 않습니다. Vercel 환경변수를 확인해주세요.' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'prompt가 필요합니다.' });
    return;
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        size: '1024x1024',
        n: 1,
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.json().catch(() => null);
      const msg = errBody?.error?.message || `OpenAI API error (HTTP ${openaiRes.status})`;
      res.status(openaiRes.status).json({ error: msg });
      return;
    }

    const data = await openaiRes.json();
    const item = data?.data?.[0];
    let image = null;
    if (item?.b64_json) {
      image = `data:image/png;base64,${item.b64_json}`;
    } else if (item?.url) {
      image = item.url;
    }

    if (!image) {
      res.status(502).json({ error: 'OpenAI로부터 이미지를 받지 못했습니다.' });
      return;
    }

    res.status(200).json({ image });
  } catch (err) {
    res.status(500).json({ error: err.message || '이미지 생성 중 오류가 발생했습니다.' });
  }
}
