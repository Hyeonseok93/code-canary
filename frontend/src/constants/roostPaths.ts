const DEFAULT_ADMIN_BASE = '/roost';
const DEFAULT_ADMIN_HATCH = 'hatch';
const DEFAULT_ADMIN_FORAGE = 'forage';

function normalizeAdminBase(raw: string | undefined): string {
  const trimmed = (raw ?? DEFAULT_ADMIN_BASE).trim();
  if (!trimmed || trimmed === '/') {
    return DEFAULT_ADMIN_BASE;
  }

  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailing = withLeading.replace(/\/+$/, '');
  return withoutTrailing || DEFAULT_ADMIN_BASE;
}

function normalizeSubpath(raw: string | undefined, fallback: string): string {
  const trimmed = (raw ?? fallback).trim().replace(/^\/+|\/+$/g, '');
  return trimmed || fallback;
}

/** Operator console URL prefix — set via VITE_ADMIN_BASE at build time. */
export const ROOST_BASE = normalizeAdminBase(import.meta.env.VITE_ADMIN_BASE);

export const ROOST_HATCH = `${ROOST_BASE}/${normalizeSubpath(import.meta.env.VITE_ADMIN_HATCH, DEFAULT_ADMIN_HATCH)}`;
export const ROOST_FORAGE = `${ROOST_BASE}/${normalizeSubpath(import.meta.env.VITE_ADMIN_FORAGE, DEFAULT_ADMIN_FORAGE)}`;

export function isRoostHatchPath(pathname: string): boolean {
  return pathname === ROOST_HATCH || pathname.startsWith(`${ROOST_HATCH}/`);
}
