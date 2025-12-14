import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, SessionDetail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, MessageSquare, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

interface ResultsViewProps {
  result: SessionDetail;
  onFieldHover?: (field: string | null) => void;
  highlightedField?: string | null;
}

export function ResultsView({ result, onFieldHover, highlightedField }: ResultsViewProps) {
  const [feedbackState, setFeedbackState] = useState<Record<string, { type: 'upvote' | 'downvote', text?: string }>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<string, boolean>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});

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

  const renderDisplayValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return '—';

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground italic">Empty list</span>;
      return (
        <div className="flex flex-col gap-2 mt-1">
          {value.map((item, idx) => (
            <div key={idx} className="pl-2 border-l-2 border-border/50">
              {renderDisplayValue(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      if (Object.keys(value).length === 0) return <span className="text-muted-foreground italic">Empty object</span>;
      return (
        <div className="flex flex-col gap-1 mt-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
              <span className="text-muted-foreground font-medium capitalize">{k.replace(/_/g, ' ')}:</span>
              <div className="text-foreground">{renderDisplayValue(v)}</div>
            </div>
          ))}
        </div>
      );
    }

    return String(value);
  };

  const handleFeedback = async (field: string, type: 'upvote' | 'downvote', text?: string) => {
    setLoadingFeedback(prev => ({ ...prev, [field]: true }));
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
                onMouseEnter={() => onFieldHover?.(key)}
                onMouseLeave={() => onFieldHover?.(null)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {key.replace(/_/g, ' ')}
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

                    <div className="text-xs text-foreground">
                      {renderDisplayValue(value)}
                    </div>

                    {citation && (
                      <p className="text-[10px] text-muted-foreground mt-1 italic">
                        {citation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
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

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("h-6 w-6", currentFeedback?.text ? "text-blue-500" : "text-muted-foreground hover:text-blue-500")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="end">
                        <div className="space-y-2">
                          <h4 className="font-medium text-xs">Feedback for {key}</h4>
                          <Textarea
                            placeholder="Add your comments here..."
                            className="h-20 text-xs resize-none"
                            value={feedbackText[key] || ''}
                            onChange={(e) => setFeedbackText(prev => ({ ...prev, [key]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={() => {
                              handleFeedback(key, currentFeedback?.type || 'downvote', feedbackText[key]);
                            }}
                          >
                            Submit Feedback
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
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
