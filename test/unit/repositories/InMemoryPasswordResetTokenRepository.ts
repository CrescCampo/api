import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';

export default class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  items: PasswordResetToken[] = [];

  save(passwordResetToken: PasswordResetToken): Promise<void> {
    const existingIndex = this.items.findIndex(
      item => item.id === passwordResetToken.id,
    );

    if (existingIndex >= 0) {
      this.items[existingIndex] = passwordResetToken;
      return Promise.resolve();
    }

    this.items.push(passwordResetToken);
    return Promise.resolve();
  }

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const token = this.items.find(item => item.tokenHash === tokenHash);

    return Promise.resolve(token ?? null);
  }
}
