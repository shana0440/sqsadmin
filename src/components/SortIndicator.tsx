import ChevronUpDownIcon from './icons/ChevronUpDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

type SortDirection = false | 'asc' | 'desc';

export default function SortIndicator({
  direction,
}: {
  direction: SortDirection;
}) {
  if (direction === false) {
    return <ChevronUpDownIcon />;
  }

  if (direction === 'asc') {
    return <ChevronUpIcon />;
  }

  return (
    <span className="rotate-180">
      <ChevronUpIcon />
    </span>
  );
}
