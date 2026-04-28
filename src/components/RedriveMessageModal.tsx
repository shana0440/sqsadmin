import { useEffect, useMemo, useState } from 'react';
import { Message } from '#/lib/sqs';
import { GroupedQueueOptions } from '#/lib/queue';
import AceEditor from './AceEditor';
import CloseButton from './CloseButton';

interface RedriveMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  groupedQueueOptions: GroupedQueueOptions;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (targetQueueUrl: string, messageBody: string) => void;
}

export default function RedriveMessageModal({
  isOpen,
  message,
  groupedQueueOptions,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: RedriveMessageModalProps) {
  const [selectedQueueUrl, setSelectedQueueUrl] = useState('');
  const [editablePayload, setEditablePayload] = useState('');

  const queueGroups = groupedQueueOptions;

  const formattedPayload = useMemo(() => {
    if (!message?.body) return '';

    try {
      return JSON.stringify(JSON.parse(message.body), null, 2);
    } catch {
      return message.body;
    }
  }, [message]);

  const payloadError = useMemo(() => {
    if (!editablePayload.trim()) {
      return 'Message body cannot be empty.';
    }

    try {
      JSON.parse(editablePayload);
    } catch (error) {
      return `Message body must be valid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return null;
  }, [editablePayload]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const defaultQueueUrl =
      queueGroups.sourceQueueOptions[0]?.url ||
      queueGroups.otherQueueOptions[0]?.url ||
      '';

    setSelectedQueueUrl(defaultQueueUrl);
    setEditablePayload(formattedPayload);
  }, [formattedPayload, isOpen, groupedQueueOptions]);

  if (!isOpen || !message) return null;

  const hasAnyQueueOption =
    queueGroups.sourceQueueOptions.length > 0 ||
    queueGroups.otherQueueOptions.length > 0;

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
              Redrive Message
            </h3>
            <CloseButton onClose={onClose} />
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Choose a target queue. DLQ source queues are grouped separately
              for convenience.
            </p>

            <div className="mb-4 p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Message ID
              </p>
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                {message.id}
              </p>
            </div>

            <div className="mb-4 p-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Message Payload
              </p>
              <div className="rounded overflow-hidden">
                <AceEditor
                  mode="json"
                  theme="dracula"
                  value={editablePayload}
                  onChange={setEditablePayload}
                  readOnly={false}
                  name="redrive-message-viewer"
                  editorProps={{ $blockScrolling: true }}
                  setOptions={{
                    showLineNumbers: true,
                    showGutter: true,
                    highlightActiveLine: true,
                    showPrintMargin: false,
                    tabSize: 2,
                    useWorker: false,
                  }}
                  width="100%"
                  height="auto"
                  minLines={5}
                  maxLines={16}
                  fontSize={12}
                  wrapEnabled={true}
                  style={{ borderRadius: '4px' }}
                />
              </div>
              {payloadError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {payloadError}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="targetQueueUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Target Queue
              </label>
              <select
                id="targetQueueUrl"
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

            {error && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                {error}
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
                onClick={() => onConfirm(selectedQueueUrl, editablePayload)}
                disabled={
                  isSubmitting ||
                  !selectedQueueUrl ||
                  !!payloadError ||
                  !hasAnyQueueOption
                }
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Redriving...' : 'Redrive Message'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
