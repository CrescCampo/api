import { Injectable } from '@nestjs/common';
import {
  SpanStatusCode,
  trace,
  Tracer as OtelApiTracer,
} from '@opentelemetry/api';
import Tracer, { SpanContext } from 'domain/application/tracing/tracer';

const TRACER_NAME = 'crescampo-api';

@Injectable()
export default class OtelTracer implements Tracer {
  private readonly tracer: OtelApiTracer = trace.getTracer(TRACER_NAME);

  startActiveSpan<T>(
    name: string,
    fn: (span: SpanContext) => Promise<T>,
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, async otelSpan => {
      const ctx: SpanContext = {
        setAttribute: (key, value) => {
          otelSpan.setAttribute(key, value);
        },
        setAttributes: attributes => {
          otelSpan.setAttributes(attributes);
        },
      };

      try {
        const result = await fn(ctx);
        otelSpan.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        otelSpan.recordException(err as Error);
        otelSpan.setStatus({
          code: SpanStatusCode.ERROR,
          message: (err as Error).message,
        });
        throw err;
      } finally {
        otelSpan.end();
      }
    });
  }
}
