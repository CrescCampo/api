import { Module } from '@nestjs/common';
import Tracer from 'domain/application/tracing/tracer';
import OtelTracer from './otel-tracer';

@Module({
  providers: [{ provide: Tracer, useClass: OtelTracer }],
  exports: [Tracer],
})
export default class TracingModule {}
