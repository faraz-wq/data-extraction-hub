import { Link } from 'react-router-dom';
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
    toast({ title: 'Copied' });
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
    <div className="h-full flex flex-col border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
          {result.session_id}
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
          <Link to={`/sessions/${result.session_id}`}>View</Link>
        </Button>
      </div>

      {/* Fields */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.entries(result.summary || {}).map(([key, value], index) => {
            const citation = getCitationForField(key);
            const isHighlighted = highlightedField === key;
            const fieldNumber = index + 1;

            return (
              <div
                key={key}
                className={cn(
                  'p-2 rounded border transition-all duration-150 cursor-pointer relative',
                  isHighlighted
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-border hover:border-blue-500'
                )}
                onMouseEnter={() => onFieldHover?.(key)}
                onMouseLeave={() => onFieldHover?.(null)}
              >
                <div className={cn(
                  'absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
                  isHighlighted
                    ? 'bg-purple-500 text-white'
                    : 'bg-blue-500 text-white'
                )}>
                  {fieldNumber}
                </div>

                <div className="flex items-start justify-between gap-1 ml-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(renderValue(value));
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap ml-3 mt-0.5">
                  {renderValue(value)}
                </p>
                {citation && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic ml-3">
                    {citation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-2 py-1 border-t border-border text-[10px] text-muted-foreground">
        {Object.keys(result.summary || {}).length} fields
        {result.documents && ` · ${result.documents.length} docs`}
      </div>
    </div>
  );
}
