import PasswordResetToken from 'domain/enterprise/entities/PasswordResetToken';

export default abstract class PasswordResetTokenRepository {
  abstract save(passwordResetToken: PasswordResetToken): Promise<void>;
}
