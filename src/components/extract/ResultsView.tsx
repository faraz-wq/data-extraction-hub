import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SessionDetail } from '@/lib/api';
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
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Extraction Results</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/sessions/${result.session_id}`}>View Session</Link>
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
                      ? 'border-foreground bg-secondary'
                      : 'border-border hover:border-foreground/50'
                  )}
                  onMouseEnter={() => onFieldHover?.(key)}
                  onMouseLeave={() => onFieldHover?.(null)}
                >
                  {/* Field Number Badge */}
                  <div className={cn(
                    'absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    isHighlighted
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {fieldNumber}
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-1 pl-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => copyToClipboard(renderValue(value))}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap pl-4">
                    {renderValue(value)}
                  </p>
                  {citation && (
                    <p className="text-xs text-muted-foreground mt-2 italic pl-4">
                      Source: {citation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <span>{Object.keys(result.summary || {}).length} fields extracted</span>
          {result.documents && (
            <>
              <span>·</span>
              <span>{result.documents.length} documents processed</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
