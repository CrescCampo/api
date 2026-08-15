import Invite from 'domain/enterprise/entities/Invite';

const AMBIGUOUS = /[0O1IL]/;

describe('Invite', () => {
  describe('generateCode', () => {
    it('should follow the CRESC-XXXX shape', () => {
      expect(Invite.generateCode()).toMatch(
        /^CRESC-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/,
      );
    });

    it('should never emit a character that is ambiguous over the phone', () => {
      for (let i = 0; i < 5000; i += 1) {
        expect(Invite.generateCode().slice(6)).not.toMatch(AMBIGUOUS);
      }
    });
  });

  describe('normalizeCode', () => {
    it('should uppercase and trim', () => {
      expect(Invite.normalizeCode('  cresc-4f2k  ')).toBe('CRESC-4F2K');
    });

    it('should be applied by the factory', () => {
      expect(Invite.create({ code: ' cresc-4f2k ' }).code).toBe('CRESC-4F2K');
    });
  });

  describe('defaults', () => {
    it('should create a single-use, usable invite', () => {
      const invite = Invite.create({ code: 'CRESC-4F2K' });

      expect(invite.maxUses).toBe(1);
      expect(invite.usedCount).toBe(0);
      expect(invite.expiresAt).toBeNull();
      expect(invite.revokedAt).toBeNull();
      expect(invite.note).toBeNull();
      expect(invite.isUsable).toBe(true);
      expect(invite.remainingUses).toBe(1);
    });
  });

  describe('usability', () => {
    it('should stop being usable once exhausted', () => {
      const invite = Invite.create({ code: 'CRESC-4F2K' });

      invite.redeem();

      expect(invite.usedCount).toBe(1);
      expect(invite.isExhausted).toBe(true);
      expect(invite.isUsable).toBe(false);
      expect(invite.remainingUses).toBe(0);
    });

    it('should allow as many redemptions as maxUses', () => {
      const invite = Invite.create({ code: 'CRESC-COOP', maxUses: 3 });

      invite.redeem();
      invite.redeem();

      expect(invite.isUsable).toBe(true);
      expect(invite.remainingUses).toBe(1);

      invite.redeem();

      expect(invite.isUsable).toBe(false);
    });

    it('should not be usable when expired', () => {
      const invite = Invite.create({
        code: 'CRESC-4F2K',
        expiresAt: new Date(Date.now() - 1000),
      });

      expect(invite.isExpired).toBe(true);
      expect(invite.isUsable).toBe(false);
    });

    it('should still be usable when the expiry is in the future', () => {
      const invite = Invite.create({
        code: 'CRESC-4F2K',
        expiresAt: new Date(Date.now() + 60_000),
      });

      expect(invite.isExpired).toBe(false);
      expect(invite.isUsable).toBe(true);
    });

    it('should not be usable when revoked', () => {
      const invite = Invite.create({ code: 'CRESC-4F2K' });

      invite.revoke();

      expect(invite.isRevoked).toBe(true);
      expect(invite.isUsable).toBe(false);
    });
  });

  describe('revoke', () => {
    it('should be idempotent', () => {
      const invite = Invite.create({ code: 'CRESC-4F2K' });

      invite.revoke();
      const firstRevocation = invite.revokedAt;
      invite.revoke();

      expect(invite.revokedAt).toBe(firstRevocation);
    });
  });
});
