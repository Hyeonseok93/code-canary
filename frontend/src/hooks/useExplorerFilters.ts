import { useCallback, useState } from 'react';
import type { ExplorerFilters } from '../types/explorer';

export const useExplorerFilterUpdater = (initial: ExplorerFilters | (() => ExplorerFilters)) => {
  const [filters, setFilters] = useState(initial);

  const updateFilter = useCallback((key: keyof ExplorerFilters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { filters, setFilters, updateFilter };
};
