import CloseButton from './CloseButton';

interface CancelMoveTaskModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelMoveTaskModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: CancelMoveTaskModalProps) {
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
              Cancel Move Task
            </h3>
            <CloseButton onClose={onClose} />
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to cancel the running message move task?
            </p>

            {error && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Keep Running
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Cancel Task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
