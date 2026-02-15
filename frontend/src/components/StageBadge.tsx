interface Props {
  status: string;
}

const colors: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  TECH_SELECTED: 'bg-green-100 text-green-700',
  OPS_SELECTED: 'bg-green-200 text-green-800',
  TECH_REJECTED: 'bg-red-100 text-red-700',
  OPS_REJECTED: 'bg-red-200 text-red-800',
};

export default function StageBadge({ status }: Props) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded ${
        colors[status] || 'bg-gray-200'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
