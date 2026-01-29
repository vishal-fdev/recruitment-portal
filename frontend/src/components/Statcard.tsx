type Props = {
  title: string;
  value: number;
  subtitle?: string;
  highlight?: boolean;
};

export default function StatCard({
  title,
  value,
  subtitle,
  highlight,
}: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <p className="text-sm text-gray-500">{title}</p>

      <p className="text-3xl font-semibold mt-2">{value}</p>

      {subtitle && (
        <p
          className={`text-xs mt-2 ${
            highlight ? 'text-green-600' : 'text-gray-400'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
