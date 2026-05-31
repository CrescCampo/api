import RefreshTokenRepository from 'domain/application/repositories/RefreshTokenRepository';
import RefreshToken from 'domain/enterprise/entities/RefreshToken';

export default class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  items: RefreshToken[] = [];

  save(refreshToken: RefreshToken): Promise<void> {
    const existingIndex = this.items.findIndex(
      item => item.id === refreshToken.id,
    );

    if (existingIndex >= 0) {
      this.items[existingIndex] = refreshToken;
      return Promise.resolve();
    }

    this.items.push(refreshToken);
    return Promise.resolve();
  }

  findById(id: string): Promise<RefreshToken | null> {
    return Promise.resolve(this.items.find(item => item.id === id) ?? null);
  }

  findByHash(hash: string): Promise<RefreshToken | null> {
    return Promise.resolve(this.items.find(item => item.hash === hash) ?? null);
  }

  revokeFamily(familyId: string): Promise<void> {
    for (const item of this.items) {
      if (item.familyId === familyId) {
        item.revoke();
      }
    }

    return Promise.resolve();
  }
}
