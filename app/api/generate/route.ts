import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { representative } = await request.json();

    const prompt = `Write a professional and compelling email to ${representative} about stopping the genocide in Palestine. The email should:
1. Be respectful but urgent in tone
2. Include specific calls to action
3. Reference the humanitarian crisis
4. Request concrete steps to help stop the violence
5. Be around 200 words
6. Include a clear subject line`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const generatedEmail = completion.choices[0].message.content;
    
    // Split into subject and body
    const [subject, ...bodyParts] = generatedEmail.split('\n');
    const body = bodyParts.join('\n').trim();

    return NextResponse.json({ subject, body });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    );
  }
} 