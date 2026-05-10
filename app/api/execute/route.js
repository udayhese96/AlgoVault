import { NextResponse } from 'next/server'

const JUDGE0_LANGUAGE_IDS = {
  'python': 113,     // Python 3.14.0
  'javascript': 102, // Node.js 22.08.0
  'java': 91,        // JDK 17
  'cpp': 105,        // C++ GCC 14.1.0
  'c': 103,          // C GCC 14.1.0
  'go': 107,         // Go 1.23.5
  'rust': 108,       // Rust 1.85.0
  'ruby': 72,        // Ruby 2.7.0
  'php': 98          // PHP 8.3.11
}

export async function POST(request) {
  try {
    const { code, language, input } = await request.json()

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language are required' }, { status: 400 })
    }

    // Fallback logic for unsupported languages, defaulting to Python for safety if something goes wrong
    let normalizedLanguage = language.toLowerCase();
    if (normalizedLanguage === 'c++') normalizedLanguage = 'cpp';
    
    const languageId = JUDGE0_LANGUAGE_IDS[normalizedLanguage]
    
    if (!languageId) {
      return NextResponse.json({ error: `Language '${language}' is not supported by Judge0` }, { status: 400 })
    }

    // Using the free Judge0 Community Edition API (No API key required)
    const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input || ""
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to execute code' }, { status: response.status })
    }

    // Format any execution errors to be visible in the console output
    const hasError = data.status?.id !== 3; // 3 means "Accepted" (Success)
    const errorOutput = data.compile_output || data.stderr || (hasError ? data.status?.description : null);

    return NextResponse.json({
      output: data.stdout || errorOutput || 'No output',
      error: errorOutput,
      memory: data.memory,
      time: data.time
    })

  } catch (error) {
    console.error('Execution API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
