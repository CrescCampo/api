import PasswordResetTokenRepository from 'domain/application/repositories/PasswordResetTokenRepository';
import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';

export default class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  items: PasswordResetToken[] = [];

  save(passwordResetToken: PasswordResetToken): Promise<void> {
    this.items.push(passwordResetToken);
    return Promise.resolve();
  }
}
