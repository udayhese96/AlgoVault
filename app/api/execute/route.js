import { NextResponse } from 'next/server';
import { executeCode } from '@/lib/jdoodle';

export async function POST(request) {
  try {
    const { sourceCode, language, stdin } = await request.json();

    if (!sourceCode || !language) {
      return NextResponse.json({ error: 'Source code and language are required' }, { status: 400 });
    }

    const result = await executeCode(sourceCode, language, stdin);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
