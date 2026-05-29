import RefreshToken from 'domain/enterprise/entities/RefreshToken';

export default abstract class RefreshTokenRepository {
  abstract save(refreshToken: RefreshToken): Promise<void>;

  abstract findById(id: string): Promise<RefreshToken | null>;
}
