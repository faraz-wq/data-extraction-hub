import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, SessionDetail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, AlertCircle, Check, MessageSquare } from 'lucide-react';
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

  const navigate = useNavigate();

  const handleAcceptAll = () => {
    toast({
      title: "Success",
      description: "All fields have been accepted.",
      className: "bg-green-600 text-white",
    });
    // Small delay to let the user see the toast before navigation
    setTimeout(() => {
      navigate('/extract');
    }, 500);
  };

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

  const formatFieldName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\[(\d+)\]/g, ' $1')
      .split('.')
      .map(part =>
        part
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      )
      .join(' › ');
  };

  const toggleIssue = (field: string) => {
    const isRejected = fieldStatuses[field] === 'rejected';
    setFieldStatuses(prev => ({
      ...prev,
      [field]: isRejected ? null : 'rejected'
    }));

    if (isRejected) {
      setActiveFeedbackField(null);
    }
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
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-bold border-green-600/50 text-green-700 hover:bg-green-50"
            onClick={handleAcceptAll}
          >
            ACCEPT ALL
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs font-bold"
            onClick={() => setShowSummaryModal(true)}
          >
            Complete Review
          </Button>
        </div>
      </div>

      {/* Validation Alert Bar */}
      {(() => {
        const missingFields = Object.entries(flattenedSummary)
          .filter(([_, v]) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0))
          .map(([k]) => k);

        const mismatches = (result.errors || []).map((err: any) => {
          if (typeof err === 'object' && err?.field) return err.field;
          const match = typeof err === 'string' ? err.match(/field:?\s*([\w\.]+)/i) : null;
          return match ? match[1] : 'Unknown';
        });

        if (result.validation_summary === null || result.validation_summary === '') return null;
        if (result.validation_summary === undefined && missingFields.length === 0 && mismatches.length === 0) return null;

        return (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/50 shrink-0 overflow-hidden">
            <div className="px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-tight">
                <span className="font-bold uppercase tracking-tight text-amber-700 dark:text-amber-400 mr-2">
                  Validation Summary
                </span>
                <span className="text-amber-600/90 dark:text-amber-400/80 font-medium">
                  {result.validation_summary || (
                    <>
                      {missingFields.length > 0 && (
                        <span>
                          <strong>Missing:</strong> {missingFields.join(', ')}
                        </span>
                      )}
                      {missingFields.length > 0 && mismatches.length > 0 && <span className="mx-1.5 opacity-30">|</span>}
                      {mismatches.length > 0 && (
                        <span>
                          <strong>Mismatches:</strong> {mismatches.join(', ')}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="px-3 pb-3 pt-2 border-t border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/10">
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[9px] font-bold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-widest">
                      Extraction Remarks
                    </div>
                    <ul className="space-y-1.5">
                      {result.errors.map((err: any, i: number) => (
                        <li key={i} className="text-[10px] text-amber-800/90 dark:text-amber-200/90 leading-relaxed flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-600 mt-1.5 shrink-0" />
                          <div>
                            {typeof err === 'object' ? (
                              <>
                                <span className="font-semibold text-amber-900 dark:text-amber-100 mr-1.5">{err.field}:</span>
                                <span>{err.message}</span>
                              </>
                            ) : (
                              <span>{err}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Fields */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.entries(flattenedSummary).map(([key, value]) => {
            const isHighlighted = highlightedField === key;
            const isRejected = fieldStatuses[key] === 'rejected';

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
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-foreground/80 tracking-tight break-all">
                        {formatFieldName(key)}
                      </span>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <TooltipProvider>
                          <Popover
                            open={activeFeedbackField === key}
                            onOpenChange={(open) => {
                              if (!open) setActiveFeedbackField(null);
                            }}
                          >
                            <PopoverTrigger asChild>
                              <div className="flex items-center border rounded-md px-0.5 bg-muted/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn("h-6 w-6 rounded-sm", feedbackState[key]?.type === 'upvote' ? "text-green-600 bg-green-50" : "text-muted-foreground hover:text-green-600")}
                                      onClick={() => handleFeedback(key, 'upvote')}
                                    >
                                      <ThumbsUp className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p className="text-[10px]">Quality is correct</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn("h-6 w-6 rounded-sm", feedbackState[key]?.type === 'downvote' ? "text-red-600 bg-red-50" : "text-muted-foreground hover:text-red-600")}
                                      onClick={() => handleFeedback(key, 'downvote')}
                                    >
                                      <ThumbsDown className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p className="text-[10px]">Quality is incorrect</p></TooltipContent>
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0 overflow-hidden" align="start" side="bottom">
                              <div className="bg-muted px-3 py-2 border-b">
                                <h4 className="font-bold text-[11px] uppercase tracking-wider text-foreground">
                                  System Feedback
                                </h4>
                              </div>
                              <div className="p-3 space-y-4" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-medium text-muted-foreground uppercase">
                                    Status
                                  </label>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "flex-1 h-8 text-[10px] gap-2",
                                        feedbackState[key]?.type === 'upvote' && "bg-green-50 border-green-200 text-green-700"
                                      )}
                                      onClick={() => handleFeedback(key, 'upvote', feedbackText[key])}
                                    >
                                      <ThumbsUp className="h-3 w-3" /> Correct
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "flex-1 h-8 text-[10px] gap-2",
                                        feedbackState[key]?.type === 'downvote' && "bg-red-50 border-red-200 text-red-700"
                                      )}
                                      onClick={() => handleFeedback(key, 'downvote', feedbackText[key])}
                                    >
                                      <ThumbsDown className="h-3 w-3" /> Incorrect
                                    </Button>
                                  </div>
                                </div>
                                <Textarea
                                  placeholder="Notes for developers..."
                                  className="h-20 text-xs resize-none"
                                  value={feedbackText[key] || ''}
                                  onChange={(e) => setFeedbackText(prev => ({ ...prev, [key]: e.target.value }))}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" className="h-8 text-xs px-4" onClick={() => setActiveFeedbackField(null)}>
                                    Done
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TooltipProvider>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-auto p-0 text-xs font-black transition-all hover:bg-transparent",
                                  isRejected
                                    ? "text-red-700 underline underline-offset-2 decoration-2"
                                    : "text-red-600 hover:text-red-700"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleIssue(key);
                                }}
                              >
                                {isRejected ? 'Rejected' : 'Reject'}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-[10px] font-bold">{isRejected ? 'Remove rejection' : 'Mark field as rejected'}</p>
                            </TooltipContent>
                          </Tooltip>

                          {feedbackState[key]?.text && (
                            <MessageSquare className="h-3 w-3 text-purple-500 fill-current opacity-70" />
                          )}
                        </div>
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
            <Button variant="outline" className="w-full h-10 text-sm" asChild>
              <Link to={`/sessions/${result.session_id}`}>View Full Session Details</Link>
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
