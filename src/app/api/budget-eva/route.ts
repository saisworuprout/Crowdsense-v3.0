import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { destination, duration, members, style, budget } = await req.json();

    if (!destination || !duration || !members || !style || !budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = `You are a travel budget assistant. 
The trip is to ${destination} for ${duration} days with ${members} people. 
Travel style is ${style}. 
Return a JSON object with category names exactly as keys ("Stay", "Flights", "Food", "Fun", "Other") and objects as values containing:
- "percentage": number (must sum to exactly 100)
- "amount": number (based on total budget ${budget})
- "reasoning": one sentence string, specific to the destination and group size.
Return only valid JSON, no markdown.`;

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
          { role: 'user', content: 'Generate the budget split.' }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json({ error: 'Couldn\'t reach AI engine, try again' }, { status: 502 });
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
      console.error('Failed to parse AI response:', replyText);
      return NextResponse.json({ error: 'Received an unexpected response format' }, { status: 500 });
    }
  } catch (error) {
    console.error('API Budget Eva Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
