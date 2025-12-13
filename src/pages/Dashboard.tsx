import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RequestsChart } from '@/components/dashboard/RequestsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, Stats, MetricPoint } from '@/lib/api';

// Mock data for demo
const mockStats: Stats = {
  total_requests: 12847,
  total_errors: 234,
  total_documents: 3521,
  avg_response_time_ms: 847,
  requests_last_24h: 1243,
};

const mockMetrics: MetricPoint[] = Array.from({ length: 24 }, (_, i) => ({
  bucket: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
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

        // Additional demo call: fetch sessions from the /sessions endpoint
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/sessions`);
          if (response.ok) {
            const sessionsData = await response.json();
            console.log('Sessions fetched from /sessions endpoint (for dashboard demo):', sessionsData);
          }
        } catch (error) {
          console.error('Error fetching sessions from /sessions endpoint:', error);
        }
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
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <h1 className="text-4xl font-bold text-muted-foreground">Coming Soon</h1>
      </div>
      {/* <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your extraction activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Requests"
            value={stats?.total_requests.toLocaleString() || '0'}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Documents Processed"
            value={stats?.total_documents.toLocaleString() || '0'}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Error Rate"
            value={`${((stats?.total_errors || 0) / (stats?.total_requests || 1) * 100).toFixed(2)}%`}
            trend={{ value: 3, isPositive: false }}
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats?.avg_response_time_ms || 0}ms`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RequestsChart data={metrics} />
          </div>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-base">Last 24 Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Requests</span>
                  <span className="text-2xl font-semibold text-foreground">
                    {stats?.requests_last_24h.toLocaleString()}
                  </span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full transition-all duration-500"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-2xl font-semibold text-foreground">
                    {(100 - ((stats?.total_errors || 0) / (stats?.total_requests || 1) * 100)).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full transition-all duration-500"
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
      </div> */}
    </DashboardLayout>
  );
}
