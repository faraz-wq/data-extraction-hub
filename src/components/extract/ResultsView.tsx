import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, SessionDetail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

interface ResultsViewProps {
  result: SessionDetail;
  onFieldHover?: (field: string | null) => void;
  onFieldClick?: (field: string) => void;
  highlightedField?: string | null;
}

function flattenObject(obj: any, prefix = '', res: Record<string, any> = {}) {
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          res[newKey] = [];
        } else {
          value.forEach((item, index) => {
            const arrayKey = `${newKey}[${index}]`;
            if (item && typeof item === 'object') {
              flattenObject(item, arrayKey, res);
            } else {
              res[arrayKey] = item;
            }
          });
        }
      } else {
        flattenObject(value, newKey, res);
      }
    } else {
      res[newKey] = value;
    }
  }
  return res;
}

export function ResultsView({ result, onFieldHover, onFieldClick, highlightedField }: ResultsViewProps) {
  const [feedbackState, setFeedbackState] = useState<Record<string, { type: 'upvote' | 'downvote', text?: string }>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<string, boolean>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [activeFeedbackField, setActiveFeedbackField] = useState<string | null>(null);

  const flattenedSummary = useMemo(() => {
    return flattenObject(result.summary || {});
  }, [result.summary]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied' });
  };

  const getCitationForField = (fieldName: string): string | undefined => {
    const boxes = result.bounding_boxes?.[fieldName];
    if (boxes && boxes.length > 0) {
      const uniqueLocations = Array.from(new Set(boxes.map(b => {
        // Prefer explicit document title from bounding box if available
        if (b.document_title) {
          return `${b.document_title} (Page ${b.page})`;
        }

        let titlePrefix = '';
        // Use source_documents from result, or fall back to documents
        const sourceDocs = result.source_documents || result.documents;

        if (Array.isArray(sourceDocs)) {
          const titles = sourceDocs
            .filter((d: any) => d?.filename === b.filename && d?.document_title)
            .map((d: any) => d.document_title);

          const uniqueTitles = Array.from(new Set(titles));
          if (uniqueTitles.length > 0) {
            titlePrefix = uniqueTitles.join(', ') + ' • ';
          }
        }

        return `${titlePrefix}${b.filename} (Page ${b.page})`;
      })));
      return uniqueLocations.join(', ');
    }
    return result.citations?.[fieldName];
  };

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const handleFeedback = async (field: string, type: 'upvote' | 'downvote', text?: string) => {
    setLoadingFeedback(prev => ({ ...prev, [field]: true }));

    if (!text) {
      setActiveFeedbackField(field);
    } else {
      setActiveFeedbackField(null);
    }

    try {
      await api.submitFeedback(result.session_id, field, type, text);

      setFeedbackState(prev => ({
        ...prev,
        [field]: { type, text }
      }));
      toast({ title: 'Feedback submitted' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error submitting feedback', variant: 'destructive' });
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div className="h-full flex flex-col border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted/30">
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
          {result.session_id}
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
          <Link to={`/sessions/${result.session_id}`}>View</Link>
        </Button>
      </div>

      {/* Errors Section */}
      {result.errors && result.errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-medium mb-1">
            <AlertCircle className="w-4 h-4" />
            Extraction Issues
          </div>
          <ul className="list-disc list-inside text-[10px] text-red-600/80 dark:text-red-400/80 space-y-0.5">
            {result.errors.map((err: any, i: number) => (
              <li key={i}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Fields */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.entries(flattenedSummary).map(([key, value], index) => {
            const citation = getCitationForField(key);
            const isHighlighted = highlightedField === key;
            const currentFeedback = feedbackState[key];
            const isLoading = loadingFeedback[key];

            return (
              <div
                key={key}
                className={cn(
                  'p-2 rounded border transition-all duration-150 cursor-pointer relative group',
                  isHighlighted
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-border hover:border-blue-500'
                )}
                onClick={() => onFieldClick?.(key)}
                onMouseEnter={() => onFieldHover?.(key)}
                onMouseLeave={() => onFieldHover?.(null)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-muted-foreground font-mono tracking-tight break-all">
                        {key}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(renderValue(value));
                        }}
                      >
                        Copy
                      </Button>
                    </div>

                    <div className="text-sm font-medium text-foreground break-words">
                      {renderValue(value)}
                    </div>

                    {citation && (
                      <p className="text-[10px] text-muted-foreground mt-1 italic">
                        {citation}
                      </p>
                    )}
                  </div>

                  <Popover
                    open={activeFeedbackField === key}
                    onOpenChange={(open) => {
                      if (!open) setActiveFeedbackField(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6", currentFeedback?.type === 'upvote' ? "text-green-500" : "text-muted-foreground hover:text-green-500")}
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFeedback(key, 'upvote');
                          }}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6", currentFeedback?.type === 'downvote' ? "text-red-500" : "text-muted-foreground hover:text-red-500")}
                          disabled={isLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFeedback(key, 'downvote');
                          }}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="end" side="left">
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-xs">Feedback</h4>
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Optional</span>
                        </div>
                        <Textarea
                          placeholder="Tell us more about this result..."
                          className="h-20 text-xs resize-none"
                          value={feedbackText[key] || ''}
                          onChange={(e) => setFeedbackText(prev => ({ ...prev, [key]: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setActiveFeedbackField(null)}
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              handleFeedback(key, currentFeedback?.type || 'upvote', feedbackText[key]);
                            }}
                          >
                            Submit
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-2 py-1 border-t border-border text-[10px] text-muted-foreground flex justify-between">
        <span>{Object.keys(flattenedSummary).length} fields</span>
        <span>
          {result.source_documents ? result.source_documents.length : result.documents?.length || 0} docs
        </span>
      </div>
    </div>
  );
}
