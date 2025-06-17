interface DashboardCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

export default function DashboardCard({
  title,
  value,
  change,
  trend,
}: DashboardCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <span
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {change}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-semibold text-white">{value}</p>
      </div>
      <div className="mt-4">
        <div className="h-2 bg-[#2a2a2a] rounded-full">
          <div
            className={`h-2 rounded-full ${
              trend === 'up' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: '70%' }}
          ></div>
        </div>
      </div>
    </div>
  );
} 