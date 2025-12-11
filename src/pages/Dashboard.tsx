import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RequestsChart } from '@/components/dashboard/RequestsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, Stats, MetricPoint } from '@/lib/api';
import { Activity, FileText, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

// Mock data for demo
const mockStats: Stats = {
  total_requests: 12847,
  total_errors: 234,
  total_documents: 3521,
  avg_response_time_ms: 847,
  requests_last_24h: 1243,
};

const mockMetrics: MetricPoint[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
  requests: Math.floor(Math.random() * 100) + 20,
  errors: Math.floor(Math.random() * 10),
  avg_ms: Math.floor(Math.random() * 500) + 500,
}));

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, metricsData] = await Promise.all([
          api.getStats(),
          api.getMetrics(
            new Date(Date.now() - 86400000).toISOString(),
            new Date().toISOString(),
            'hour'
          ),
        ]);
        setStats(statsData);
        setMetrics(metricsData);
      } catch {
        // Use mock data for demo
        setStats(mockStats);
        setMetrics(mockMetrics);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <div className="h-4 w-24 shimmer rounded" />
                  <div className="h-8 w-32 shimmer rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your extraction activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Requests"
            value={stats?.total_requests.toLocaleString() || '0'}
            icon={Activity}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Documents Processed"
            value={stats?.total_documents.toLocaleString() || '0'}
            icon={FileText}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Error Rate"
            value={`${((stats?.total_errors || 0) / (stats?.total_requests || 1) * 100).toFixed(2)}%`}
            icon={AlertTriangle}
            trend={{ value: 3, isPositive: false }}
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats?.avg_response_time_ms || 0}ms`}
            icon={Clock}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RequestsChart data={metrics} />
          </div>

          {/* Quick Stats */}
          <Card variant="glass" className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Last 24 Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Requests</span>
                  <span className="text-2xl font-bold text-foreground">
                    {stats?.requests_last_24h.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-2xl font-bold text-success">
                    {(100 - ((stats?.total_errors || 0) / (stats?.total_requests || 1) * 100)).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${100 - ((stats?.total_errors || 0) / (stats?.total_requests || 1) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Peak usage: 2:00 PM - 4:00 PM UTC
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
