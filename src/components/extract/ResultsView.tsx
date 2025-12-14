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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(renderValue(value));
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap ml-3 mt-0.5">
                  {renderValue(value)}
                </p>
                {citation && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic ml-3">
                    {citation}
                  </p>
                )}

                {/* Feedback Controls */}
                <div className="flex items-center gap-1 ml-3 mt-2 border-t border-border/50 pt-1">
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
                    <PopoverContent className="w-64 p-2" align="start">
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
