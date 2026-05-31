'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/auth';
import StatCard from '@/components/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/ui/EmptyState';
import type { PayoutStatistics } from '@/types/payout';
import type { RideStatistics } from '@/types/ride';
import { Car, Users, MapPin, CreditCard, Tag, Gift } from 'lucide-react';

const quickActions = [
  { label: 'Manage Rides', href: '/rides', icon: MapPin, color: 'bg-blue-50 text-info' },
  { label: 'Manage Drivers', href: '/drivers', icon: Car, color: 'bg-primary/5 text-primary' },
  { label: 'View Customers', href: '/customers', icon: Users, color: 'bg-emerald-50 text-success' },
  { label: 'Payouts', href: '/payouts', icon: CreditCard, color: 'bg-amber-50 text-warning' },
  { label: 'Promotions', href: '/promotions', icon: Gift, color: 'bg-purple-50 text-purple-600' },
  { label: 'Categories', href: '/categories', icon: Tag, color: 'bg-slate-50 text-slate-600' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [payoutStats, setPayoutStats] = useState<PayoutStatistics | null>(null);
  const [rideStats, setRideStats] = useState<RideStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [pRes, rRes] = await Promise.all([
        api.get('/admin/payout/statistics'),
        api.get('/admin/rides/stats'),
      ]);
      setPayoutStats(pRes.data.stats || pRes.data);
      setRideStats(rRes.data.stats || rRes.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner fullScreen message="Loading dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Platform overview at a glance" />

      {/* Financial KPIs */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-textMuted mb-4">Financial Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Commission Owed" value={formatCurrency(payoutStats?.totalOwedCommission ?? 0)} icon="💰" accentClass="text-warning" subtitle="From drivers" />
          <StatCard title="Pending Payouts" value={formatCurrency(payoutStats?.totalPendingPayouts ?? 0)} icon="📤" accentClass="text-info" subtitle="To drivers" />
          <StatCard title="Drivers Owing" value={payoutStats?.driversOwingCount ?? 0} icon="🚗" accentClass="text-error" subtitle="Need to pay" />
          <StatCard title="Drivers Owed" value={payoutStats?.driversOwedCount ?? 0} icon="✅" accentClass="text-success" subtitle="Awaiting payout" />
        </div>
      </section>

      {/* Ride Stats */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-textMuted mb-4">Ride Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Rides" value={rideStats?.totalRides ?? 0} icon="🚖" accentClass="text-primary" />
          <StatCard title="Active Rides" value={rideStats?.activeRides ?? 0} icon="⚡" accentClass="text-warning" subtitle="Now live" />
          <StatCard title="Completed" value={rideStats?.completedRides ?? 0} icon="🏁" accentClass="text-success" />
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-textMuted mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map(({ label, href, icon: Icon, color }) => (
            <Link key={href} href={href} className="bg-white rounded-xl border border-border shadow-sm p-5 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-textPrimary group-hover:text-primary transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
