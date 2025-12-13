import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, className }: StatCardProps) {
  return (
    <Card className={cn('p-6 animate-fade-in', className)}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <p className={cn(
            'text-xs',
            trend.isPositive ? 'text-foreground' : 'text-destructive'
          )}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last period
          </p>
        )}
      </div>
    </Card>
  );
}
