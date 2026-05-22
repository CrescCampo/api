import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { containerDetector } from '@opentelemetry/resource-detector-container';
import {
  envDetector,
  hostDetector,
  osDetector,
  processDetector,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const dotenv = require('dotenv');

dotenv.config();

if (process.env.APP_ENV !== 'prod') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({}),

  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
      exportIntervalMillis: 30000,
    }),
  ],

  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'API',
    [ATTR_SERVICE_VERSION]: '0.0.1',
    'service.namespace': 'CrescCampo',
    'deployment.environment': process.env.APP_ENV || 'dev',
  }),

  logRecordProcessors: [new BatchLogRecordProcessor(new OTLPLogExporter())],

  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: req => {
          const url = req.url || '';
          return (
            url.includes('/health') ||
            url.includes('/metrics') ||
            url.includes('/favicon')
          );
        },
      },
      '@opentelemetry/instrumentation-pg': {
        enhancedDatabaseReporting: true,
        requireParentSpan: false,
      },
      '@opentelemetry/instrumentation-nestjs-core': {
        enabled: true,
      },
    }),
  ],

  resourceDetectors: [
    envDetector,
    hostDetector,
    osDetector,
    processDetector,
    containerDetector,
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('OpenTelemetry encerrado'))
    .catch(error => console.error('Erro ao encerrar OTel', error))
    .finally(() => process.exit(0));
});
