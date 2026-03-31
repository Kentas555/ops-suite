export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 503, headers: corsHeaders });
    }

    const body = await req.json();
    const { clientMessage, tone, context, maxLength, replyLanguage } = body as Record<string, string>;

    if (!clientMessage || clientMessage.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Client message is required' }), { status: 400, headers: corsHeaders });
    }

    const langName = replyLanguage === 'lt' ? 'Lithuanian' : 'English';

    const lengthGuide = maxLength === 'short'
      ? 'Keep the reply brief — 2-4 sentences maximum.'
      : maxLength === 'long'
        ? 'Provide a thorough reply with full detail and clear next steps.'
        : 'Write a medium-length reply — clear and complete but not overly long.';

    const toneGuide = tone === 'friendly'
      ? 'Use a warm, approachable tone while remaining professional.'
      : tone === 'formal'
        ? 'Use a formal, respectful business tone.'
        : tone === 'concise'
          ? 'Be very direct and to the point. No pleasantries.'
          : 'Use a professional, balanced tone.';

    const systemPrompt = `You are an experienced customer success / account manager replying to a client message.

RULES:
- Reply ONLY in ${langName}. This is mandatory.
- ${toneGuide}
- ${lengthGuide}
- Structure: acknowledge the client's point → address it → provide solution or next steps → close politely.
- Be specific and actionable. Avoid generic filler phrases.
- Do not use overly robotic or templated language.
- The reply should sound natural, as if written by a real person.
- Do not include subject lines or email headers.
${context ? `\nCONTEXT/TEMPLATE TO ADAPT:\n${context}\n\nUse this as a base but adapt it naturally to the client's specific message.` : ''}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n---\nCLIENT MESSAGE:\n${clientMessage}` }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxLength === 'short' ? 256 : maxLength === 'long' ? 1024 : 512,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      console.error('[ai-reply] Gemini error:', geminiRes.status, errText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 502, headers: corsHeaders });
    }

    const geminiData = await geminiRes.json();
    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return new Response(JSON.stringify({ error: 'AI returned empty response' }), { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ reply: reply.trim() }), { status: 200, headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
}
