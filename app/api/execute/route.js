import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { code, language, input } = await request.json()

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language are required' }, { status: 400 })
    }

    const API_KEY = process.env.ONLINE_COMPILER_API_KEY

    if (!API_KEY) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 })
    }

    // Map local simple names to compiler identifiers
    let compilerId = language
    if (language === 'python') compilerId = 'python-3.14' // Or 'python-3.x'
    else if (language === 'java') compilerId = 'java-21'

    const response = await fetch('https://api.onlinecompiler.io/api/run-code-sync/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        compiler: compilerId,
        code: code,
        input: input || ""
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error || data.message || 'Failed to execute code' }, { status: response.status })
    }

    return NextResponse.json({
      output: data.stdout || data.stderr || 'No output',
      error: data.stderr || null,
      memory: data.memory,
      time: data.time
    })

  } catch (error) {
    console.error('Execution API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
