import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, SessionDetail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, AlertCircle, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ResultsViewProps {
  result: SessionDetail;
  onFieldHover?: (field: string | null) => void;
  onFieldClick?: (field: string) => void;
  highlightedField?: string | null;
  onPageClick?: (page: number) => void;
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

export function ResultsView({ result, onFieldHover, onFieldClick, highlightedField, onPageClick }: ResultsViewProps) {
  const [feedbackState, setFeedbackState] = useState<Record<string, { type: 'upvote' | 'downvote', text?: string }>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<string, boolean>>({});
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [activeFeedbackField, setActiveFeedbackField] = useState<string | null>(null);
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, 'accepted' | 'rejected' | null>>({});
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const flattenedSummary = useMemo(() => {
    return flattenObject(result.summary || {});
  }, [result.summary]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied' });
  };

  const renderCitation = (fieldName: string) => {
    const boxes = result.bounding_boxes?.[fieldName];

    if (boxes && boxes.length > 0) {
      const locations = boxes.map(b => {
        let title = b.document_title;
        if (!title) {
          const sourceDocs = result.source_documents || result.documents;
          if (Array.isArray(sourceDocs)) {
            const doc = sourceDocs.find((d: any) => d?.filename === b.filename);
            title = (doc as any)?.document_title || b.filename;
          } else {
            title = b.filename;
          }
        }

        return {
          text: `${title} (Page ${b.page})`,
          page: b.page,
          isApplication: title?.toLowerCase().includes('application')
        };
      });

      const uniqueLocations = locations.filter((loc, index, self) =>
        index === self.findIndex((t) => t.text === loc.text)
      );

      const proofCitations = uniqueLocations.filter(loc => !loc.isApplication);

      return (
        <div className="mt-2 text-wrap">
          {proofCitations.length > 0 && (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider shrink-0">
                Proofs:
              </span>
              {proofCitations.map((loc, i) => (
                <span
                  key={`proof-${i}`}
                  className="text-[10px] text-muted-foreground italic hover:text-primary hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageClick?.(loc.page);
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    onPageClick?.(loc.page);
                  }}
                  title="Click or hover to jump to page"
                >
                  {loc.text}{i < proofCitations.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    const textCitation = result.citations?.[fieldName];
    if (textCitation) {
      return (
        <p className="text-[10px] text-muted-foreground mt-1 italic">
          {textCitation}
        </p>
      );
    }

    return null;
  };

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const toggleIssue = (field: string) => {
    setFieldStatuses(prev => ({
      ...prev,
      [field]: prev[field] === 'rejected' ? null : 'rejected'
    }));
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">
            {result.application_type.replace('custom:', '')}
          </h2>
          <span className="text-[10px] text-muted-foreground font-mono truncate" title={result.session_id}>
            ID: {result.session_id}
          </span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" asChild>
          <Link to={`/sessions/${result.session_id}`}>View Details</Link>
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
          {Object.entries(flattenedSummary).map(([key, value]) => {
            const isHighlighted = highlightedField === key;
            const isRejected = fieldStatuses[key] === 'rejected';
            const isLoading = loadingFeedback[key];

            return (
              <div
                key={key}
                className={cn(
                  'p-2 rounded border transition-all duration-150 cursor-pointer relative group',
                  isHighlighted
                    ? 'border-purple-500 bg-purple-500/10'
                    : isRejected
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-border hover:border-blue-500'
                )}
                onClick={() => onFieldClick?.(key)}
                onMouseEnter={() => onFieldHover?.(key)}
                onMouseLeave={() => onFieldHover?.(null)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
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

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className={cn(
                                "h-6 w-6 rounded-full border transition-colors",
                                isRejected
                                  ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
                                  : "text-muted-foreground hover:text-red-600 hover:bg-red-50 border-input"
                              )}
                              onClick={() => toggleIssue(key)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-[10px]">{isRejected ? 'Remove Flag' : 'Flag Issue'}</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Internal Feedback System - Thumbs Up/Down (Original) */}
                        <Popover
                          open={activeFeedbackField === key}
                          onOpenChange={(open) => {
                            if (!open) setActiveFeedbackField(null);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", feedbackState[key]?.type === 'upvote' ? "text-green-500" : "text-muted-foreground hover:text-green-500")}
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
                                className={cn("h-6 w-6", feedbackState[key]?.type === 'downvote' ? "text-red-500" : "text-muted-foreground hover:text-red-500")}
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
                                    handleFeedback(key, feedbackState[key]?.type || 'upvote', feedbackText[key]);
                                  }}
                                >
                                  Submit
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="text-sm font-medium text-foreground break-words">
                    {renderValue(value)}
                  </div>

                  {renderCitation(key)}
                </div>
              </div>
            );
          })}

          <div className="pt-4 pb-2">
            <Button
              className="w-full h-10 text-sm font-bold"
              onClick={() => setShowSummaryModal(true)}
            >
              Complete Review
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-2 py-1 border-t border-border text-[10px] text-muted-foreground flex justify-between">
        <span>{Object.keys(flattenedSummary).length} fields</span>
        <span>
          {result.source_documents ? result.source_documents.length : (result as any).documents?.length || 0} docs
        </span>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Review Complete
            </DialogTitle>
            <DialogDescription>
              Summary of your review for <strong>{result.application_type.replace('custom:', '')}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  {Object.values(fieldStatuses).filter(s => s === 'rejected').length}
                </div>
                <div className="text-[10px] text-red-600/80 dark:text-red-400/80 uppercase font-bold tracking-wider">
                  Issues Flagged
                </div>
              </div>

              {Object.entries(fieldStatuses).filter(([_, s]) => s === 'rejected').length > 0 ? (
                <div className="mt-4 space-y-1 max-h-40 overflow-y-auto pr-2">
                  {Object.entries(fieldStatuses)
                    .filter(([_, s]) => s === 'rejected')
                    .map(([fieldName]) => (
                      <div key={fieldName} className="text-[11px] font-mono text-red-600/90 dark:text-red-400/90 bg-red-500/5 px-2 py-1 rounded border border-red-500/10">
                        • {fieldName}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium py-2">
                  No issues flagged. Everything looks correct!
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded italic text-center">
              A record of these flags will be saved for further review.
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setShowSummaryModal(false)}>
              Keep Editing
            </Button>
            <Button onClick={() => {
              setShowSummaryModal(false);
              toast({ title: "Review Submitted", description: "Document issues have been logged." });
            }}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
