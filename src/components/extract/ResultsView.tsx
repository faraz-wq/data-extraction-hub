import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { SessionDetail, BoundingBox } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ResultsViewProps {
  result: SessionDetail;
  onFieldHover?: (field: string | null) => void;
  highlightedField?: string | null;
}

export function ResultsView({ result, onFieldHover, highlightedField }: ResultsViewProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const getCitationForField = (fieldName: string): string | undefined => {
    return result.citations?.[fieldName];
  };

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Card variant="glass" className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Extraction Results</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/sessions/${result.session_id}`}>
              <ExternalLink className="w-4 h-4" />
              View Session
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          {result.session_id}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Extracted Fields */}
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3 pr-4">
            {Object.entries(result.summary || {}).map(([key, value], index) => {
              const citation = getCitationForField(key);
              const isHighlighted = highlightedField === key;
              const fieldNumber = index + 1;

              return (
                <div
                  key={key}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200 cursor-pointer relative',
                    isHighlighted
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5'
                  )}
                  onMouseEnter={() => onFieldHover?.(key)}
                  onMouseLeave={() => onFieldHover?.(null)}
                >
                  {/* Field Number Badge */}
                  <div className={cn(
                    'absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200',
                    isHighlighted
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2 ring-offset-background scale-110'
                      : 'bg-blue-600 text-white ring-2 ring-blue-600/30 ring-offset-1 ring-offset-background'
                  )}>
                    {fieldNumber}
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(renderValue(value))}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {renderValue(value)}
                  </p>
                  {citation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Source: {citation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-success" />
            {Object.keys(result.summary || {}).length} fields extracted
          </div>
          {result.documents && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-primary" />
              {result.documents.length} documents processed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
