import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, SessionDetail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, AlertCircle, Check, MessageSquare, Layout, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

  const defaultApplicationPage = useMemo(() => {
    const sourceDocs = result.source_documents || result.documents;
    if (Array.isArray(sourceDocs)) {
      const appDoc = sourceDocs.find((d: any) =>
        (d?.document_title || d?.filename || '').toLowerCase().includes('application')
      );
      if (appDoc && appDoc.page_numbers && appDoc.page_numbers.length > 0) {
        return appDoc.page_numbers[0];
      }
    }
    return 1;
  }, [result.source_documents, result.documents]);

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
          isApplication: (title || '').toLowerCase().includes('application')
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
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    onPageClick?.(defaultApplicationPage);
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
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* iOS Style Glass Header */}
      <div className="px-4 py-3 border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex flex-col min-w-0">
          <h2 className="text-[12px] font-bold text-foreground leading-tight tracking-tight uppercase">
            {result.application_type.replace('custom:', '')}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter truncate">
              Live Extraction Workspace
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-[10px] font-bold border-green-500/20 text-green-700 bg-green-500/5 hover:bg-green-500/10 rounded-full transition-all"
            onClick={handleAcceptAll}
          >
            VERIFY ALL
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-7 px-4 text-[10px] font-bold bg-black hover:bg-black/90 text-white rounded-full shadow-md transition-all"
            onClick={() => setShowSummaryModal(true)}
          >
            DONE
          </Button>
        </div>
      </div>

      {/* Modern Validation Alert Tab */}
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
          <div className="bg-[#5856D6]/5 border-b border-[#5856D6]/10 shrink-0">
            <div className="px-4 py-2 flex items-start gap-3">
              <AlertCircle className="w-3.5 h-3.5 text-[#5856D6] shrink-0 mt-0.5" />
              <div className="text-[10px] leading-snug">
                <span className="font-bold uppercase tracking-widest text-[#5856D6] mr-2 opacity-80">
                  Insights
                </span>
                <span className="text-black/70 font-medium">
                  {result.validation_summary || "Automated check completed with minor remarks."}
                </span>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="px-4 pb-3 pt-1">
                <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
                    <ul className="space-y-1">
                      {result.errors.map((err: any, i: number) => (
                        <li key={i} className="text-[9px] text-black/60 font-medium leading-relaxed flex items-center gap-2 bg-white/40 p-1.5 rounded-lg border border-[#5856D6]/5">
                          <div className="w-1 h-1 rounded-full bg-[#5856D6] shrink-0" />
                          <div className="truncate">
                            {typeof err === 'object' ? (
                              <>
                                <span className="font-bold text-black/80 mr-1">{err.field}:</span>
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

      {/* Document Map - Higher Density */}
      {result.source_documents && result.source_documents.length > 0 && (
        <div className="px-4 py-2 bg-white border-b border-border/30 shrink-0">
          <div className="text-[8px] font-bold uppercase text-muted-foreground/50 tracking-[0.2em] mb-2 flex items-center gap-2">
            <Layout className="w-2.5 h-2.5 opacity-40" />
            Evidence Sources
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.source_documents.map((doc: any, i: number) => (
              <button
                key={i}
                onClick={() => onPageClick?.(doc.page_numbers[0])}
                className="px-2.5 py-1 rounded-full bg-[#F2F2F7] border border-transparent shadow-sm text-[9px] font-bold hover:bg-black hover:text-white transition-all flex items-center gap-1.5 text-black/70"
              >
                <FileText className="w-2.5 h-2.5 opacity-50" />
                {doc.document_title}
                <span className="opacity-40 text-[7px] font-mono">#{doc.page_numbers[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fields Explorer - iOS High Density */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="divide-y divide-border/20">
          {Object.entries(flattenedSummary).map(([key, value]) => {
            const isHighlighted = highlightedField === key;
            const isRejected = fieldStatuses[key] === 'rejected';

            const fieldConflict = result.errors?.find((e: any) =>
              (typeof e === 'object' && e?.field === key) ||
              (typeof e === 'string' && e.includes(key))
            );

            return (
              <div
                key={key}
                className={cn(
                  'px-4 py-2 transition-all duration-300 cursor-pointer relative group',
                  isHighlighted
                    ? 'bg-[#5856D6]/5 border-l-2 border-[#5856D6]'
                    : isRejected
                      ? 'bg-red-500/[0.03] border-l-2 border-red-500'
                      : fieldConflict
                        ? 'bg-amber-500/[0.03] border-l-2 border-amber-500'
                        : 'hover:bg-[#F2F2F7]/40 border-l-2 border-transparent'
                )}
                onClick={() => onFieldClick?.(key)}
                onMouseEnter={() => onFieldHover?.(key)}
                onMouseLeave={() => onFieldHover?.(null)}
              >
                <div className="flex flex-col space-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-tight break-all transition-colors",
                        isHighlighted ? "text-[#5856D6]" : "text-muted-foreground/60"
                      )}>
                        {formatFieldName(key)}
                      </span>

                      {fieldConflict && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="h-4 px-1.5 text-[8px] font-bold hover:text-black text-muted-foreground/40 transition-colors uppercase"
                        onClick={() => copyToClipboard(renderValue(value))}
                      >
                        Copy
                      </button>
                      <button
                        className={cn(
                          "h-4 px-1.5 text-[8px] font-bold transition-colors uppercase rounded-md",
                          isRejected ? "bg-red-500 text-white" : "hover:text-red-500 text-muted-foreground/40"
                        )}
                        onClick={() => toggleIssue(key)}
                      >
                        {isRejected ? 'Flagged' : 'Flag'}
                      </button>
                    </div>
                  </div>

                  <div className={cn(
                    "text-[11px] font-bold break-words leading-tight tracking-tight",
                    isHighlighted ? "text-black" : "text-foreground"
                  )}>
                    {renderValue(value)}
                  </div>

                  {fieldConflict && isHighlighted && (
                    <div className="mt-1.5 p-2 rounded-xl bg-amber-500/10 text-[9px] text-amber-700 font-bold border border-amber-500/10 leading-snug animate-in fade-in slide-in-from-top-1">
                      {typeof fieldConflict === 'object' ? fieldConflict.message : fieldConflict}
                    </div>
                  )}

                  <div className="opacity-60 transition-opacity">
                    {renderCitation(key)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-10" />
      </div>

      {/* Modern Slim Meta Footer */}
      <div className="px-4 py-2 border-t border-border/30 text-[9px] font-bold text-muted-foreground/40 bg-white flex justify-between uppercase tracking-widest shrink-0">
        <div className="flex items-center gap-3">
          <span>{Object.keys(flattenedSummary).length} Facts</span>
          <span className="opacity-30">/</span>
          <span>{result.source_documents?.length || 0} Evidence</span>
        </div>
        <Link to={`/sessions/${result.session_id}`} className="hover:text-black transition-colors">
          View Detail ›
        </Link>
      </div>

      {/* Summary Modal - Clean iOS Style */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-3xl bg-white p-0 overflow-hidden">
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <div className="space-y-2">
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-black tracking-tight text-center">Review Ready</DialogTitle>
                <DialogDescription className="text-center text-sm font-medium">
                  Review complete for {result.application_type.replace('custom:', '')}.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F2F7] border border-black/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">Flagged Issues</span>
                <span className="text-xl font-black text-red-500 leading-none">
                  {Object.values(fieldStatuses).filter(s => s === 'rejected').length}
                </span>
              </div>

              {Object.entries(fieldStatuses).filter(([_, s]) => s === 'rejected').length > 0 && (
                <div className="mt-4 space-y-1 max-h-32 overflow-y-auto px-1 custom-scrollbar">
                  {Object.entries(fieldStatuses)
                    .filter(([_, s]) => s === 'rejected')
                    .map(([fieldName]) => (
                      <div key={fieldName} className="text-[10px] font-bold text-red-500 uppercase tracking-tight text-left truncate bg-white/50 px-2 py-1 rounded-md border border-red-500/10">
                        • {fieldName.replace(/_/g, ' ')}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full h-12 rounded-2xl bg-black hover:bg-black/90 text-white font-bold text-sm shadow-xl shadow-black/10"
                onClick={() => {
                  setShowSummaryModal(false);
                  toast({ title: "Review Submitted", description: "Record successfully updated." });
                }}
              >
                Submit Extraction
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-xs font-bold text-muted-foreground hover:bg-black/5"
                onClick={() => setShowSummaryModal(false)}
              >
                Continue Editing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
