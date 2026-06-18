import { useEffect } from 'react';

const ROBOTS_CONTENT = 'noindex, nofollow';

export function useAdminNoIndex() {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = meta === null;

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }

    const previous = meta.getAttribute('content');
    meta.setAttribute('content', ROBOTS_CONTENT);

    return () => {
      if (created) {
        meta?.remove();
        return;
      }

      if (previous !== null) {
        meta?.setAttribute('content', previous);
      } else {
        meta?.removeAttribute('content');
      }
    };
  }, []);
}
