import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api, SessionDetail } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ThumbsUp, ThumbsDown, AlertCircle, Check, MessageSquare, Layout, FileText, Sparkles, Flag } from 'lucide-react';
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
  const [showUnmappedFields, setShowUnmappedFields] = useState(false);

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

  const flattenedUnmappedSummary = useMemo(() => {
    return flattenObject(result.unmapped_summary || {});
  }, [result.unmapped_summary]);

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

  const pageMap = useMemo(() => {
    const sourceDocs = result.source_documents || result.documents;
    if (!Array.isArray(sourceDocs)) return [];

    const map: Record<number, string> = {};
    sourceDocs.forEach((doc: any) => {
      doc.page_numbers?.forEach((p: number) => {
        map[p] = doc.document_title;
      });
    });

    return Object.entries(map)
      .map(([page, title]) => ({ page: parseInt(page), title }))
      .sort((a, b) => a.page - b.page);
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
        <div className="mt-1 text-wrap">
          {proofCitations.length > 0 && (
            <div className="flex items-baseline gap-1 flex-wrap">
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
      if (Array.isArray(textCitation)) {
        return (
          <div className="flex flex-col gap-1 mt-1">
            {textCitation.map((cite, idx) => (
              <p key={idx} className="text-[10px] text-muted-foreground italic">
                {cite}
              </p>
            ))}
          </div>
        );
      }
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
            {result.application_type?.replace('custom:', '') || (result as any).application_type?.replace('custom:', '') || 'N/A'}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-help">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      (result as any).confidence_score >= 0.9 ? "bg-green-500" :
                        (result as any).confidence_score >= 0.7 ? "bg-amber-500" : "bg-red-500"
                    )} />
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter truncate">
                      {(result as any).confidence_score ? `${Math.round((result as any).confidence_score * 100)}% Confidence` : "Live Workspace"}
                    </span>
                  </div>
                </TooltipTrigger>
                {(result as any).confidence_reason && (
                  <TooltipContent side="bottom" className="bg-black text-white text-[10px] p-2 rounded-xl border-none shadow-2xl max-w-[200px]">
                    {(result as any).confidence_reason}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <span className="text-[9px] text-muted-foreground/30 opacity-50 px-1">•</span>
            <span className="text-[8px] font-black tracking-widest uppercase opacity-70">
              {(result as any).confidence_score >= 0.9 ? "Verified" : "Needs Review"}
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


      {/* Two Column Layout: Validation Summary (Left) + Fields Explorer (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Validation Summary & Field Remarks */}
        {(result.validation_summary || (result.field_remarks && Object.keys(result.field_remarks).length > 0)) && (
          <div className="w-[50%] border-r border-border/30 bg-gradient-to-b from-indigo-50/30 to-white overflow-y-auto custom-scrollbar">
            <div className="p-1">
              {/* Header */}
              <div className="text-[9px] font-black uppercase tracking-widest text-indigo-900/50">
                Validation Insights
              </div>


              {/* AI Summary */}
              {result.validation_summary && (
                <div className="px-1 py-1">
                  <div className="flex gap-1 items-start">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0 opacity-70" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] font-bold uppercase tracking-wide text-indigo-800/90 mb-1">
                        AI Summary
                      </div>
                      <div className="text-[10px] font-medium text-indigo-900/90 leading-relaxed">
                        {result.validation_summary}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues Summary */}
              {(() => {
                const issues = result.issues || [];
                if (issues.length === 0) return null;

                return (
                  <div className="px-2 py-2">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-red-700/60 mb-2">
                      Issues Detected ({issues.length})
                    </div>
                    <div className="space-y-2">
                      {issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "pl-3 py-1 border-l-2",
                            issue.severity === 'error'
                              ? "border-red-400/50"
                              : "border-amber-400/50"
                          )}
                        >
                          <div className={cn(
                            "text-[8px] font-bold uppercase tracking-wide mb-0.5 opacity-80",
                            issue.severity === 'error' ? "text-red-700" : "text-amber-700"
                          )}>
                            {issue.field || issue.schema_field}
                          </div>
                          <div className={cn(
                            "text-[9px] leading-snug",
                            issue.severity === 'error' ? "text-red-900/70" : "text-amber-900/70"
                          )}>
                            {issue.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {/* Field Observations */}
              {result.field_remarks && Object.entries(result.field_remarks).length > 0 && (
                <div className="px-1 py-1">
                  <div className="text-[8px] font-bold uppercase tracking-wide text-indigo-700/60 mb-2">
                    Field Observations ({Object.entries(result.field_remarks).length})
                  </div>
                  <div className="space-y-1">
                    {Object.entries(result.field_remarks).map(([field, remark], idx) => (
                      <div key={idx} className="pl-1 py-1 border-l-2 border-indigo-300/40">
                        <div className="text-[8px] font-bold text-indigo-700 uppercase tracking-wide ">
                          {field.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[10px] text-indigo-900/90 leading-snug">
                          {remark}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Right Column: Fields Explorer */}
        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar bg-white",
          !(result.validation_summary || (result.field_remarks && Object.keys(result.field_remarks).length > 0)) && "w-full"
        )}>
          <div className="divide-y divide-border/20">
            {Object.entries(flattenedSummary).map(([key, value]) => {
              const isHighlighted = highlightedField === key;
              const isRejected = fieldStatuses[key] === 'rejected';

              const fieldIssues = (result.issues || []).filter(i => i.field === key);

              const fieldConflict = fieldIssues[0] || result.errors?.find((e: any) =>
                (typeof e === 'object' && e?.field === key) ||
                (typeof e === 'string' && e.includes(key))
              );

              return (
                <div
                  key={key}
                  className={cn(
                    'px-2 py-1 transition-all duration-300 cursor-pointer relative group',
                    isHighlighted
                      ? 'bg-[#5856D6]/5 border-l-2 border-[#5856D6]'
                      : isRejected
                        ? 'bg-red-500/[0.08] border-l-2 border-red-500'
                        : fieldConflict
                          ? 'bg-amber-500/[0.1] border-l-2 border-amber-500'
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
                          "text-[10px] font-bold uppercase tracking-tight break-all transition-colors",
                          isHighlighted ? "text-[#5856D6]" : "text-muted-foreground/60"
                        )}>
                          {formatFieldName(key)}
                        </span>

                        {fieldConflict && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="h-4 px-1.5 text-[8px] font-bold hover:text-black text-muted-foreground/40 transition-all uppercase opacity-0 group-hover:opacity-100"
                          onClick={() => copyToClipboard(renderValue(value))}
                        >
                          Copy
                        </button>
                        <button
                          className={cn(
                            "h-5 px-2 text-[8px] font-bold transition-all uppercase rounded-md flex items-center gap-1.5 border",
                            isRejected
                              ? "bg-red-500 text-white border-red-500 shadow-sm"
                              : "bg-white text-muted-foreground border-border hover:border-red-500/50 hover:text-red-600 hover:bg-red-50 shadow-sm"
                          )}
                          onClick={() => toggleIssue(key)}
                        >
                          <Flag className={cn("w-2.5 h-2.5", isRejected && "fill-current")} />
                          {isRejected ? 'Flagged' : 'Flag'}
                        </button>
                      </div>
                    </div>

                    <div className={cn(
                      "text-[12px] font-bold break-words leading-tight tracking-tight",
                      isHighlighted ? "text-black" : "text-foreground"
                    )}>
                      {renderValue(value)}
                    </div>

                    {/* Field-Specific Validation Results */}
                    {isHighlighted && fieldIssues.length > 0 && (
                      <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        {fieldIssues.map((issue, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "p-2 rounded-xl border text-[9px] font-bold leading-snug",
                              issue.severity === 'error'
                                ? "bg-red-500/5 border-red-500/10 text-red-700"
                                : "bg-amber-500/5 border-amber-500/10 text-amber-700"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn(
                                "w-1 h-1 rounded-full mt-1 shrink-0",
                                issue.severity === 'error' ? "bg-red-500" : "bg-amber-500"
                              )} />
                              {issue.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {fieldConflict && isHighlighted && !fieldIssues.length && (
                      <div className="mt-1.5 p-2 rounded-xl bg-amber-500/10 text-[9px] text-amber-700 font-bold border border-amber-500/10 leading-snug animate-in fade-in slide-in-from-top-1">
                        {typeof fieldConflict === 'object' ? fieldConflict.message : fieldConflict}
                      </div>
                    )}

                    {/* AI Observation / Field Remarks */}
                    {isHighlighted && result.field_remarks?.[key] && (
                      <div className="mt-1.5 p-2 rounded-xl bg-[#5856D6]/5 text-[9px] text-[#5856D6] font-bold border border-[#5856D6]/10 leading-snug animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-2.5 h-2.5 shrink-0 mt-0.5 opacity-60" />
                          {result.field_remarks[key]}
                        </div>
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

          {/* Supplementary Extracted Fields (Fields with Bounding Boxes not in Schema) */}
          {Object.keys(flattenedUnmappedSummary).length > 0 && (
            <div className="border-t border-border/20">
              <button
                onClick={() => setShowUnmappedFields(!showUnmappedFields)}
                className="w-full px-4 py-3 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:bg-[#F2F2F7]/40 transition-all bg-muted/5 group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 opacity-50" />
                  <span>Supplementary Data ({Object.keys(flattenedUnmappedSummary).length})</span>
                  {showUnmappedFields && (
                    <Badge variant="outline" className="h-4 text-[7px] bg-purple-500/5 text-purple-600 border-purple-500/20 rounded-full px-1.5 ml-1">
                      ALL EVIDENCED
                    </Badge>
                  )}
                </div>
                <span className="text-[9px] opacity-40 group-hover:opacity-100 transition-opacity">
                  {showUnmappedFields ? 'HIDE' : 'VIEW MORE'}
                </span>
              </button>

              {showUnmappedFields && (
                <div className="divide-y divide-border/20 bg-muted/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  {Object.entries(flattenedUnmappedSummary).map(([key, value]) => {
                    const isHighlighted = highlightedField === key;

                    return (
                      <div
                        key={key}
                        className={cn(
                          'px-4 py-2 transition-all duration-300 cursor-pointer relative group',
                          isHighlighted
                            ? 'bg-purple-500/5 border-l-2 border-purple-500'
                            : 'hover:bg-[#F2F2F7]/60 border-l-2 border-transparent'
                        )}
                        onClick={() => onFieldClick?.(key)}
                        onMouseEnter={() => onFieldHover?.(key)}
                        onMouseLeave={() => onFieldHover?.(null)}
                      >
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-tight text-muted-foreground/50",
                              isHighlighted && "text-purple-600"
                            )}>
                              {key.replace(/^ext_/, '').replace(/_/g, ' ')}
                            </span>
                            <button
                              className="h-4 px-1.5 text-[8px] font-bold hover:text-black text-muted-foreground/30 transition-all uppercase opacity-0 group-hover:opacity-100"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(String(value)); }}
                            >
                              Copy
                            </button>
                          </div>
                          <div className={cn(
                            "text-[12px] font-medium break-words leading-tight tracking-tight",
                            isHighlighted ? "text-black" : "text-foreground/80"
                          )}>
                            {String(value)}
                          </div>
                          <div className="opacity-50 mt-1">
                            {renderCitation(key)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="h-10" />
        </div>
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
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">Review Complete</h3>
            </div>

            <div className="text-sm text-muted-foreground leading-relaxed px-4">
              {Object.values(fieldStatuses).filter(s => s === 'rejected').length === 0 ? (
                <p>
                  The <span className="font-medium text-foreground">{(result as any).application_type?.replace('custom:', '')}</span> application has been fully verified.
                  Review completed with a confidence score of <span className="font-medium text-foreground">{Math.round((result as any).confidence_score * 100)}%</span>.
                  No issues were flagged during the manual review process.
                </p>
              ) : (
                <div className="space-y-3">
                  <p>
                    You have flagged <span className="font-medium text-red-600">{Object.values(fieldStatuses).filter(s => s === 'rejected').length} issues</span> in
                    the <span className="font-medium text-foreground">{(result as any).application_type?.replace('custom:', '')}</span> application.
                  </p>
                  <p className="bg-red-50 p-4 rounded-xl text-red-700/80 text-[13px]">
                    The following fields require attention:{" "}
                    <span className="font-semibold text-red-700">
                      {Object.entries(fieldStatuses)
                        .filter(([_, s]) => s === 'rejected')
                        .map(([field]) => field.replace(/_/g, ' '))
                        .join(', ')}
                    </span>.
                  </p>
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
    </div >
  );
}
