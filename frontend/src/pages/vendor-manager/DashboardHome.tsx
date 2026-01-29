import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const stats = {
  totalVendors: 12,
  activeJobs: 53,
  totalCandidates: 812,
};

const stageData = [
  { name: 'Screening', value: 128 },
  { name: 'Interviewing', value: 94 },
  { name: 'On Hold', value: 22 },
  { name: 'Onboarded', value: 47 },
  { name: 'Rejected', value: 521 },
];

const stageColors = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#22c55e',
  '#64748b',
];

const weeklySubmissions = [
  { day: 'Mon', count: 18 },
  { day: 'Tue', count: 22 },
  { day: 'Wed', count: 16 },
  { day: 'Thu', count: 9 },
  { day: 'Fri', count: 14 },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Vendor Manager Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Overview of vendors, jobs, and candidate pipeline
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Vendors"
          value={stats.totalVendors}
        />
        <StatCard
          label="Active Jobs"
          value={stats.activeJobs}
        />
        <StatCard
          label="Total Candidates"
          value={stats.totalCandidates}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidate Stage Summary */}
        <Card title="Candidate Stage Summary">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {stageData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={stageColors[index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            {stageData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      stageColors[index],
                  }}
                />
                <span className="text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Weekly Submissions */}
        <Card title="Weekly Profile Submissions">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySubmissions}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Total submissions this week:{' '}
            {weeklySubmissions.reduce(
              (sum, d) => sum + d.count,
              0
            )}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;

/* ---------------- UI Helpers ---------------- */

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-semibold mt-2">
      {value}
    </p>
  </div>
);

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-sm font-medium mb-4">
      {title}
    </h2>
    {children}
  </div>
);
