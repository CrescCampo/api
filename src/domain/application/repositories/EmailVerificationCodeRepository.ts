import EmailVerificationCode from 'domain/enterprise/entities/EmailVerificationCode';

export default abstract class EmailVerificationCodeRepository {
  abstract save(emailVerificationCode: EmailVerificationCode): Promise<void>;

  abstract findActiveByFarmerId(
    farmerId: string,
  ): Promise<EmailVerificationCode | null>;

  abstract findActiveByFarmerIdForUpdate(
    farmerId: string,
  ): Promise<EmailVerificationCode | null>;
}
