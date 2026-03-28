import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve as pathResolve } from 'node:path';

interface SpawnK6Options {
  scriptPath: string;
  baseUrl: string;
  testEmail: string;
  testPassword: string;
  scriptName: string;
  scenario: string;
}

export function spawnK6(options: SpawnK6Options): Promise<number> {
  const { scriptPath, baseUrl, testEmail, testPassword, scriptName, scenario } = options;

  const reportsDir = pathResolve(process.cwd(), 'test', 'load', 'reports');
  mkdirSync(reportsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportName = `${scriptName}_${scenario}_${timestamp}`;
  const htmlReport = pathResolve(reportsDir, `${reportName}.html`);
  const jsonReport = pathResolve(reportsDir, `${reportName}.json`);

  return new Promise((resolve, reject) => {
    const k6 = spawn('k6', ['run', scriptPath], {
      env: {
        ...process.env,
        BASE_URL: baseUrl,
        TEST_EMAIL: testEmail,
        TEST_PASSWORD: testPassword,
        K6_WEB_DASHBOARD: 'true',
        K6_WEB_DASHBOARD_EXPORT: htmlReport,
        K6_REPORT_NAME: reportName,
        K6_REPORTS_DIR: reportsDir,
      },
      stdio: 'inherit',
    });

    k6.on('close', (code) => {
      if (code === 0 || code === 99) {
        console.log(`\nReports saved to:`);
        console.log(`  HTML: ${htmlReport}`);
        console.log(`  JSON: ${jsonReport}`);
      }
      resolve(code ?? 1);
    });
    k6.on('error', reject);
  });
}
