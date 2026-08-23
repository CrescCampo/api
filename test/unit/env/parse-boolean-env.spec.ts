import parseBooleanEnv from 'infra/env/parse-boolean-env';

describe('parseBooleanEnv', () => {
  it('should fall back when the variable is unset', () => {
    expect(parseBooleanEnv(undefined, true)).toBe(true);
    expect(parseBooleanEnv(undefined, false)).toBe(false);
  });

  it('should fall back when the variable is blank', () => {
    expect(parseBooleanEnv('', true)).toBe(true);
    expect(parseBooleanEnv('   ', false)).toBe(false);
  });

  it('should accept true and 1 as truthy, ignoring case and padding', () => {
    expect(parseBooleanEnv('true', false)).toBe(true);
    expect(parseBooleanEnv(' TRUE ', false)).toBe(true);
    expect(parseBooleanEnv('1', false)).toBe(true);
  });

  it('should fall back when the value is not a string', () => {
    expect(parseBooleanEnv(true, false)).toBe(false);
    expect(parseBooleanEnv(0, true)).toBe(true);
  });

  it('should treat every other value as false', () => {
    expect(parseBooleanEnv('false', true)).toBe(false);
    expect(parseBooleanEnv('FALSE', true)).toBe(false);
    expect(parseBooleanEnv('0', true)).toBe(false);
    expect(parseBooleanEnv('yes', true)).toBe(false);
  });
});
