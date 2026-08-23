export default function parseBooleanEnv(
  value: unknown,
  fallback: boolean,
): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  return normalized === 'true' || normalized === '1';
}
