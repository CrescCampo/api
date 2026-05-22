import Tracer, {
  SpanAttributeValue,
  SpanContext,
} from 'domain/application/tracing/tracer';

export default class NoopTracer implements Tracer {
  public spans: Array<{
    name: string;
    attributes: Record<string, SpanAttributeValue>;
  }> = [];

  async startActiveSpan<T>(
    name: string,
    fn: (span: SpanContext) => Promise<T>,
  ): Promise<T> {
    const attributes: Record<string, SpanAttributeValue> = {};
    const span: SpanContext = {
      setAttribute: (key, value) => {
        attributes[key] = value;
      },
      setAttributes: attrs => {
        Object.assign(attributes, attrs);
      },
    };

    try {
      return await fn(span);
    } finally {
      this.spans.push({ name, attributes });
    }
  }
}
