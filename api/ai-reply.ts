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
    const isLt = replyLanguage === 'lt';

    const lengthGuide = maxLength === 'short'
      ? '2-3 sentences max. Extremely brief.'
      : maxLength === 'long'
        ? '4-6 sentences. Include next steps. Still no filler.'
        : '2-5 sentences. Default length.';

    const toneGuide = tone === 'friendly'
      ? 'Slightly warm, approachable. Still professional. Not casual.'
      : tone === 'formal'
        ? 'Respectful and structured. No slang. Still human.'
        : tone === 'concise'
          ? 'Absolute minimum words. No greeting. No closing. Just the answer.'
          : 'Professional but natural. Like a competent colleague writing quickly.';

    const systemPrompt = `You are a fast, competent Customer Success Manager writing a reply to a client.

LANGUAGE: Reply ONLY in ${langName}. ${isLt ? 'Lithuanian must sound native — not translated from English. Use natural Lithuanian phrasing.' : 'English must be simple and clean.'}

TONE: ${toneGuide}

LENGTH: ${lengthGuide}

STYLE RULES (MANDATORY):
- Short sentences. No unnecessary words.
- Sound like a real human, not a bot or a script.
- Be direct: answer first, explain second.
- Structure: direct answer → short clarification if needed → optional next step.
- No subject lines, no email headers, no signature blocks.
- No filler phrases. No corporate language.

NEVER USE these phrases or anything similar:
- "Hope this message finds you well"
- "We would like to inform you"
- "Please do not hesitate to contact us"
- "Thank you for reaching out"
- "I hope you are doing well"
- "Please be informed that"
- "We appreciate your patience"
- "At your earliest convenience"

GOOD EXAMPLE:
"Thanks for letting us know.

The issue is on our side — we're fixing it now. Should be resolved by end of day.

I'll update you once it's done."

BAD EXAMPLE (never write like this):
"Dear client, thank you for your message. We would like to inform you that we have received your inquiry and our team is currently looking into the matter. We will get back to you as soon as possible. Please do not hesitate to contact us if you have any further questions."

BUSINESS BEHAVIOR:
- Solve the problem. Guide the client. Keep things moving.
- When natural, lightly suggest a next step (follow-up, improvement, upgrade).
- Never push aggressively. Keep suggestions natural.
${context ? `\nTEMPLATE TO ADAPT:\n${context}\n\nUse this template as a starting point but rewrite it naturally for this specific client message. Do not copy it word for word.` : ''}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n---\nCLIENT MESSAGE:\n${clientMessage}` }] },
        ],
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: maxLength === 'short' ? 200 : maxLength === 'long' ? 600 : 350,
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
