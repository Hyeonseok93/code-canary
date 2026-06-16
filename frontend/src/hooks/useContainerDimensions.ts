import { useEffect, useRef, useState } from 'react';

interface UseContainerDimensionsOptions {
  /** When false, ready state resets (e.g. while loading or no data). */
  dataReady?: boolean;
  /** Delay before isReady becomes true after size + data are available. */
  readyDelayMs?: number;
}

export function useContainerDimensions(options: UseContainerDimensionsOptions = {}) {
  const { dataReady = true, readyDelayMs = 0 } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hasSize, setHasSize] = useState(false);
  const [delayPassed, setDelayPassed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
        setHasSize(true);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dataReady || !hasSize) {
      return;
    }

    const timer = setTimeout(() => setDelayPassed(true), readyDelayMs);
    return () => {
      clearTimeout(timer);
      setDelayPassed(false);
    };
  }, [dataReady, hasSize, readyDelayMs]);

  const isReady = dataReady && hasSize && delayPassed;

  return { containerRef, dimensions, isReady };
}
