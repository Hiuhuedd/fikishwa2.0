interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  subtitle?: string;
  accentClass?: string;
}

export default function StatCard({ title, value, icon, subtitle, accentClass = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-textSecondary">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className={`text-2xl font-bold font-mono tracking-tight ${accentClass}`}>{value}</p>
      {subtitle && <p className="text-xs text-textMuted">{subtitle}</p>}
    </div>
  );
}
