import { isRateLimited, resolveRateLimitMessage } from '../api/errors';

interface ExplorerErrorCopy {
  title: string;
  message: string;
}

const rateLimitError = (): ExplorerErrorCopy => ({
  title: 'Request Limit Reached',
  message: resolveRateLimitMessage(),
});

export const resolveExplorerListError = (status?: number): ExplorerErrorCopy => {
  if (isRateLimited(status)) {
    return rateLimitError();
  }

  return {
    title: 'Inventory Sync Failed',
    message: "We couldn't retrieve the global vulnerability catalog. Please verify your connection.",
  };
};

export const resolveExplorerDetailError = (status?: number): ExplorerErrorCopy => {
  if (isRateLimited(status)) {
    return rateLimitError();
  }

  if (status !== undefined && status >= 500) {
    return {
      title: 'System Sync Failure',
      message: 'The intelligence service is temporarily unavailable. Please try again in a moment.',
    };
  }

  return {
    title: 'System Sync Failure',
    message: 'Could not load this vulnerability record. Please verify your connection and try again.',
  };
};
