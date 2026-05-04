import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, itinerary } = await req.json();

    if (!message || !itinerary) {
      return NextResponse.json({ error: 'Missing message or itinerary' }, { status: 400 });
    }

    const systemPrompt = `You are Eva, a hardcore, no-nonsense trip replanning AI.
Take the user's disruption or message and the itinerary as context.
Return a JSON object with exactly four keys:
- "message": A short, punchy conversational reply as Eva addressing the user. If they just say hi, say hi back.
- "removed": array of strings (names of events removed). Empty if no change.
- "added": array of strings (names of events added). Empty if no change.
- "shifted": array of strings describing time changes. Empty if no change.
Return nothing else — no preamble, no markdown outside of the JSON block. Raw JSON only.

Itinerary:
${JSON.stringify(itinerary, null, 2)}
`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        max_tokens: 1024,
        temperature: 0.1,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json({ error: 'Couldn\'t reach replanning engine, try again' }, { status: 502 });
    }

    const data = await response.json();
    let replyText = data.choices[0].message.content.trim();
    
    // Clean up potential markdown formatting
    if (replyText.startsWith('```json')) {
      replyText = replyText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    } else if (replyText.startsWith('```')) {
      replyText = replyText.replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(replyText);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', replyText);
      return NextResponse.json({ error: 'Received an unexpected response' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Replan Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
