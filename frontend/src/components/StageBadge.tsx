interface Props {
  status: string;
}

const colors: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  SCREENING: 'bg-yellow-100 text-yellow-700',
  SCREEN_SELECTED: 'bg-emerald-100 text-emerald-700',
  SCREEN_REJECTED: 'bg-red-100 text-red-700',
  TECH_SELECTED: 'bg-emerald-100 text-emerald-700',
  TECH_REJECTED: 'bg-red-100 text-red-700',
  IDENTIFIED: 'bg-green-100 text-green-700',
  YET_TO_JOIN: 'bg-amber-100 text-amber-700',
  OPS_SELECTED: 'bg-green-100 text-green-700',
  OPS_REJECTED: 'bg-red-100 text-red-700',
  SELECTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ONBOARDED: 'bg-emerald-100 text-emerald-700',
  DROPPED: 'bg-red-100 text-red-700',
};

export default function StageBadge({ status }: Props) {
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full font-medium ${
        colors[status] || 'bg-gray-200'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
