import axios from 'axios';

export const LANGUAGE_MAPPING = {
  java: { language: 'java', versionIndex: '4' }, // JDK 17
  python: { language: 'python3', versionIndex: '4' }, // Python 3.10
};

export async function executeCode(sourceCode, languageKey, stdin = '') {
  const mapping = LANGUAGE_MAPPING[languageKey];
  
  if (!mapping) {
    throw new Error(`Unsupported language: ${languageKey}`);
  }

  const options = {
    method: 'POST',
    url: 'https://api.jdoodle.com/v1/execute',
    data: {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: sourceCode,
      stdin: stdin,
      language: mapping.language,
      versionIndex: mapping.versionIndex,
    },
  };

  try {
    const response = await axios.request(options);
    const result = response.data;

    // JDoodle returns 'output' which contains everything (stdout + stderr)
    // It also returns 'statusCode' and 'memory', 'cpuTime'
    return {
      stdout: result.output || '',
      stderr: result.statusCode !== 200 ? result.output : '', // JDoodle often combines them
      compile_output: '', 
      message: '',
      status: { id: result.statusCode === 200 ? 3 : 11, description: result.statusCode === 200 ? 'Accepted' : 'Runtime Error' },
      time: result.cpuTime,
      memory: result.memory,
    };
  } catch (error) {
    console.error('JDoodle Error:', error.response?.data || error.message);
    throw new Error('Failed to execute code via JDoodle');
  }
}
