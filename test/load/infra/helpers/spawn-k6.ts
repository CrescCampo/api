import { spawn } from 'node:child_process';

interface SpawnK6Options {
  scriptPath: string;
  baseUrl: string;
  testEmail: string;
  testPassword: string;
}

export function spawnK6(options: SpawnK6Options): Promise<number> {
  const { scriptPath, baseUrl, testEmail, testPassword } = options;

  return new Promise((resolve, reject) => {
    const k6 = spawn('k6', ['run', scriptPath], {
      env: {
        ...process.env,
        BASE_URL: baseUrl,
        TEST_EMAIL: testEmail,
        TEST_PASSWORD: testPassword,
      },
      stdio: 'inherit',
    });

    k6.on('close', (code) => resolve(code ?? 1));
    k6.on('error', reject);
  });
}
