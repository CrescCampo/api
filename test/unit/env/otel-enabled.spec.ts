import config from 'infra/config';

describe('config.otel.enabled', () => {
  it('should read OTEL_ENABLED from the environment as a real boolean', () => {
    expect(process.env.OTEL_ENABLED).toBe('false');
    expect(config.otel.enabled).toBe(false);
  });
});
