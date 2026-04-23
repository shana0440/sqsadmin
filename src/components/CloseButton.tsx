export default function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
      onClick={onClose}
    >
      <span className="sr-only">Close</span>
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
