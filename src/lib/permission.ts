import { getAllowedQueueNamePatternsByEmail } from './config';

export function doesQueueNameMatchPattern(
  queueName: string,
  pattern: string,
): boolean {
  const regex = new RegExp(`^${pattern.trim().replaceAll('*', '.*')}$`);
  return regex.test(queueName);
}

export function getQueueNameFromUrl(queueUrl: string): string {
  const parts = queueUrl.split('/');
  return parts[parts.length - 1];
}

export function canAccessQueue(queueUrl: string, email: string): boolean {
  const patterns = getAllowedQueueNamePatternsByEmail(email);
  if (patterns.length === 0) {
    return false;
  }
  const queueName = getQueueNameFromUrl(queueUrl);
  return patterns.some((pattern) =>
    doesQueueNameMatchPattern(queueName, pattern),
  );
}
