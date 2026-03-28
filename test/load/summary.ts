import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';

interface SummaryData {
  metrics: Record<string, unknown>;
  [key: string]: unknown;
}

export function generateSummary(data: SummaryData): Record<string, string> {
  const reportName = __ENV.K6_REPORT_NAME || 'summary';
  const reportsDir = __ENV.K6_REPORTS_DIR || '.';

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`${reportsDir}/${reportName}.json`]: JSON.stringify(data, null, 2),
  };
}
