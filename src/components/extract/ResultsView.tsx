import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { SessionDetail, BoundingBox, Citation } from '@/lib/api';
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

  const getCitationForField = (fieldName: string): Citation | undefined => {
    return result.citations?.find(c => c.field === fieldName);
  };

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge className="bg-success/20 text-success border-success/30">High</Badge>;
    }
    if (confidence >= 0.7) {
      return <Badge className="bg-warning/20 text-warning border-warning/30">Medium</Badge>;
    }
    return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Low</Badge>;
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
            {Object.entries(result.summary || {}).map(([key, value]) => {
              const citation = getCitationForField(key);
              const isHighlighted = highlightedField === key;
              
              return (
                <div
                  key={key}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                    isHighlighted
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/30 hover:border-primary/50'
                  )}
                  onMouseEnter={() => onFieldHover?.(key)}
                  onMouseLeave={() => onFieldHover?.(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {citation && getConfidenceBadge(citation.confidence)}
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
                      "{citation.text}" — Page {citation.page}
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
