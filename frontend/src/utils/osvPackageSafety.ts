const SAFE_PACKAGE_TOKEN = /^[A-Za-z0-9@/._:+-]+$/;
const SAFE_VERSION_TOKEN = /^[A-Za-z0-9._:+-]+$/;

export function sanitizePackageIdentifier(
  value: string | null | undefined,
  fallback = 'package'
): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || !SAFE_PACKAGE_TOKEN.test(trimmed) || trimmed.length > 200) {
    return fallback;
  }
  return trimmed;
}

export function sanitizeVersionIdentifier(
  value: string | null | undefined,
  fallback = '0.0.0'
): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || !SAFE_VERSION_TOKEN.test(trimmed) || trimmed.length > 100) {
    return fallback;
  }
  return trimmed;
}
