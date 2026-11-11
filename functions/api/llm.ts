interface Env {
  DEEPSEEK_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ACCESS_PASSCODE?: string;
}

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-worldpilot-passcode, Authorization',
    },
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const requiredPasscode = context.env.ACCESS_PASSCODE;
    if (!requiredPasscode) {
      return new Response(JSON.stringify({ error: 'Server authentication unconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    
    const body: any = await context.request.json().catch(() => null);
    const providedPasscode = 
      context.request.headers.get('x-worldpilot-passcode') ||
      (context.request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') ||
      body?.passcode;

    if (!providedPasscode || providedPasscode.trim() !== requiredPasscode.trim()) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid access passcode' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Quick verification ping
    if (body?.action === 'verify_passcode') {
      return new Response(JSON.stringify({ status: 'ok', authenticated: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const key = context.env.DEEPSEEK_API_KEY;
    if (!key) {
      return new Response(JSON.stringify({ error: 'LLM API key not configured on server' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!body || !body.userPrompt) {
      return new Response(JSON.stringify({ error: 'Missing userPrompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { systemPrompt, userPrompt } = body;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt || '' },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_object',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `DeepSeek API returned ${response.status}: ${errText}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
