import { sanitizeOperatorMessage } from './operatorMessage';

export const resolvePipelineActionError = (error: unknown, fallback: string): string => {
  const raw =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
  return sanitizeOperatorMessage(raw) ?? fallback;
};
