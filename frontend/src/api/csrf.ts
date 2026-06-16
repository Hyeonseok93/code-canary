type CsrfResponse = {
  headerName: string;
  token: string;
};

type CsrfTokenPayload = {
  token: string | null;
  headerName: string;
};

let csrfFetchPromise: Promise<CsrfTokenPayload> | null = null;

async function fetchCsrfToken(): Promise<CsrfTokenPayload> {
  try {
    const response = await fetch('/api/auth/csrf', {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return { token: null, headerName: 'X-XSRF-TOKEN' };
    }

    const data = (await response.json()) as CsrfResponse;
    return {
      token: data.token || null,
      headerName: data.headerName || 'X-XSRF-TOKEN',
    };
  } catch {
    return { token: null, headerName: 'X-XSRF-TOKEN' };
  }
}

/** Fetches a CSRF token on every call so it stays in sync with the HttpOnly cookie. */
export async function resolveCsrfToken(): Promise<CsrfTokenPayload> {
  if (!csrfFetchPromise) {
    csrfFetchPromise = fetchCsrfToken().finally(() => {
      csrfFetchPromise = null;
    });
  }

  return csrfFetchPromise;
}

export function clearCsrfTokenCache(): void {
  csrfFetchPromise = null;
}
