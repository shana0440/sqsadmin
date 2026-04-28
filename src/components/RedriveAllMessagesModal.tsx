import { useEffect, useMemo, useState } from 'react';
import { GroupedQueueOptions } from '#/lib/queue';
import CloseButton from './CloseButton';

interface RedriveAllMessagesModalProps {
  isOpen: boolean;
  groupedQueueOptions: GroupedQueueOptions;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (
    targetQueueUrl: string,
    maxNumberOfMessagesPerSecond?: number,
  ) => void;
}

export default function RedriveAllMessagesModal({
  isOpen,
  groupedQueueOptions,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: RedriveAllMessagesModalProps) {
  const [selectedQueueUrl, setSelectedQueueUrl] = useState('');
  const [velocityMode, setVelocityMode] = useState<'system' | 'custom'>(
    'system',
  );
  const [maxMessagesPerSecond, setMaxMessagesPerSecond] = useState('100');

  const queueGroups = groupedQueueOptions;

  const hasAnyQueueOption =
    queueGroups.sourceQueueOptions.length > 0 ||
    queueGroups.otherQueueOptions.length > 0;

  useEffect(() => {
    if (isOpen) {
      setSelectedQueueUrl(
        queueGroups.sourceQueueOptions[0]?.url ||
          queueGroups.otherQueueOptions[0]?.url ||
          '',
      );
      setVelocityMode('system');
      setMaxMessagesPerSecond('100');
    }
  }, [isOpen, groupedQueueOptions]);

  const validationError = useMemo(() => {
    if (!selectedQueueUrl) {
      return 'Target queue is required.';
    }

    if (velocityMode === 'system') {
      return null;
    }

    if (!maxMessagesPerSecond.trim()) {
      return 'Max messages per second is required when not optimizing by AWS.';
    }

    const parsedValue = Number(maxMessagesPerSecond);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      return 'Max messages per second must be a positive integer.';
    }

    if (parsedValue > 500) {
      return 'Max messages per second must be 500 or less.';
    }

    return null;
  }, [selectedQueueUrl, velocityMode, maxMessagesPerSecond]);

  const handleConfirm = () => {
    if (validationError) {
      return;
    }

    onConfirm(
      selectedQueueUrl,
      velocityMode === 'system' ? undefined : Number(maxMessagesPerSecond),
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div
          className="fixed inset-0 bg-gray-500 opacity-75 dark:bg-gray-800 dark:opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle bg-white dark:bg-gray-900 rounded-lg shadow-xl transform transition-all relative z-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Redrive All Messages
            </h3>
            <CloseButton onClose={onClose} />
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Start an SQS message move task for this DLQ.
            </p>

            <div>
              <label
                htmlFor="redrive-all-target-queue"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Target Queue
              </label>
              <select
                id="redrive-all-target-queue"
                value={selectedQueueUrl}
                onChange={(e) => setSelectedQueueUrl(e.target.value)}
                className="mt-1 block w-full border dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!hasAnyQueueOption}
              >
                {!hasAnyQueueOption && (
                  <option value="">No accessible queues available</option>
                )}
                {queueGroups.sourceQueueOptions.length > 0 && (
                  <optgroup label="DLQ Source Queues">
                    {queueGroups.sourceQueueOptions.map((queue) => (
                      <option key={queue.url} value={queue.url}>
                        {queue.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {queueGroups.otherQueueOptions.length > 0 && (
                  <optgroup label="Other Accessible Queues">
                    {queueGroups.otherQueueOptions.map((queue) => (
                      <option key={queue.url} value={queue.url}>
                        {queue.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Velocity Control Settings
              </p>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="velocity-system"
                    name="velocity-mode"
                    type="radio"
                    checked={velocityMode === 'system'}
                    onChange={() => setVelocityMode('system')}
                    className="h-4 w-4 mt-0.5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="velocity-system"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="font-medium">System optimized</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      Redrive messages with SQS optimized maximum number of
                      messages per second.
                    </span>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="velocity-custom"
                    name="velocity-mode"
                    type="radio"
                    checked={velocityMode === 'custom'}
                    onChange={() => setVelocityMode('custom')}
                    className="h-4 w-4 mt-0.5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="velocity-custom"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="font-medium">Custom max velocity</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      Redrive messages with a custom maximum rate of messages
                      per second (up to 500).
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="max-messages-per-second"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Max Messages Per Second
              </label>
              <input
                id="max-messages-per-second"
                type="number"
                min={1}
                max={500}
                value={maxMessagesPerSecond}
                onChange={(e) => setMaxMessagesPerSecond(e.target.value)}
                disabled={velocityMode !== 'custom'}
                className="mt-1 block w-full border dark:bg-gray-800 dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            {(validationError || error) && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {validationError || error}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  isSubmitting || !!validationError || !hasAnyQueueOption
                }
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Starting...' : 'Start Redrive'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
