import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RequestsChartProps {
  data: Array<{
    timestamp?: string;
    bucket?: string;
    requests: number;
    errors: number;
  }>;
}

export function RequestsChart({ data }: RequestsChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    time: new Date(item.timestamp || item.bucket || '').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <Card variant="glass" className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-lg">Request Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="errorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#requestsGradient)"
                name="Requests"
              />
              <Area
                type="monotone"
                dataKey="errors"
                stroke="hsl(var(--chart-5))"
                strokeWidth={2}
                fill="url(#errorsGradient)"
                name="Errors"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
