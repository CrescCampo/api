export type SpanAttributeValue = string | number | boolean;

export interface SpanContext {
  setAttribute(key: string, value: SpanAttributeValue): void;
  setAttributes(attributes: Record<string, SpanAttributeValue>): void;
}

export default abstract class Tracer {
  abstract startActiveSpan<T>(
    name: string,
    fn: (span: SpanContext) => Promise<T>,
  ): Promise<T>;
}
