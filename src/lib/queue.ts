export type QueueOption = {
  url: string;
  name: string;
};

export type GroupedQueueOptions = {
  sourceQueueOptions: QueueOption[];
  otherQueueOptions: QueueOption[];
};

export function getQueueNameFromUrl(queueUrl: string): string {
  const queueName = queueUrl.split('/').filter(Boolean).pop();
  return queueName || queueUrl;
}

export function groupQueuesByDeadLetterSources(
  availableQueueUrls: string[],
  deadLetterSourceQueues: string[],
): GroupedQueueOptions {
  const uniqueQueueUrls = Array.from(new Set(availableQueueUrls));
  const deadLetterSourceQueueSet = new Set(deadLetterSourceQueues);

  return {
    sourceQueueOptions: uniqueQueueUrls
      .filter((url) => deadLetterSourceQueueSet.has(url))
      .map((url) => ({
        url,
        name: getQueueNameFromUrl(url),
      })),
    otherQueueOptions: uniqueQueueUrls
      .filter((url) => !deadLetterSourceQueueSet.has(url))
      .map((url) => ({
        url,
        name: getQueueNameFromUrl(url),
      })),
  };
}
