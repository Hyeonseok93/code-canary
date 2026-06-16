export type CvssVersion = '2.0' | '3.0' | '3.1' | '4.0' | string;

export function normalizeCvssVersion(raw: string | null | undefined): CvssVersion | null {
  if (!raw) return null;
  const ver = String(raw).trim();
  if (ver === '40' || ver === '4.0') return '4.0';
  if (ver === '31' || ver === '3.1') return '3.1';
  if (ver === '30' || ver === '3.0') return '3.0';
  if (ver === '20' || ver === '2.0') return '2.0';
  return ver;
}

/** Parse CVSS vector into key → value (e.g. VC → H). */
export function parseCvssVectorParts(vector: string | null | undefined): Record<string, string> {
  if (!vector) return {};
  const parts: Record<string, string> = {};
  for (const segment of vector.split('/')) {
    const colon = segment.indexOf(':');
    if (colon <= 0) continue;
    const key = segment.slice(0, colon).trim();
    const value = segment.slice(colon + 1).trim();
    if (key && value) parts[key] = value;
  }
  return parts;
}
