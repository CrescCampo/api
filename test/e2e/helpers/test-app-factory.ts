import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import AppModule from 'infra/app.module';
import EmailIpThrottlerGuard from 'infra/auth/email-ip-throttler.guard';

export default class TestAppFactory {
  static async create(): Promise<INestApplication> {
    const allowAll = { canActivate: () => true };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ThrottlerGuard)
      .useValue(allowAll)
      .overrideGuard(EmailIpThrottlerGuard)
      .useValue(allowAll)
      .compile();

    const app = moduleFixture.createNestApplication();
    app.useLogger(false);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    return app;
  }
}
