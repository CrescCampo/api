import EmailVerificationCodeRepository from 'domain/application/repositories/EmailVerificationCodeRepository';
import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';

export default class InMemoryEmailVerificationCodeRepository implements EmailVerificationCodeRepository {
  items: EmailVerificationCode[] = [];

  save(emailVerificationCode: EmailVerificationCode): Promise<void> {
    const existingIndex = this.items.findIndex(
      item => item.id === emailVerificationCode.id,
    );

    if (existingIndex >= 0) {
      this.items[existingIndex] = emailVerificationCode;
      return Promise.resolve();
    }

    this.items.push(emailVerificationCode);
    return Promise.resolve();
  }

  findActiveByFarmerId(
    farmerId: string,
  ): Promise<EmailVerificationCode | null> {
    const active = this.items
      .filter(
        item =>
          item.farmerId === farmerId &&
          item.usedAt === null &&
          item.invalidatedAt === null,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return Promise.resolve(active[0] ?? null);
  }
}
