const MAX_OPERATOR_MESSAGE_LENGTH = 240;

/** Normalize and truncate operator-facing pipeline messages (text nodes only). */
export function sanitizeOperatorMessage(message: string | null | undefined): string | null {
  if (message == null) {
    return null;
  }

  const normalized = message.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length <= MAX_OPERATOR_MESSAGE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_OPERATOR_MESSAGE_LENGTH - 1)}…`;
}
