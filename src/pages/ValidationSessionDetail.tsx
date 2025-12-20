import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, ValidationReport, SessionDetail, BoundingBox } from '@/lib/api';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import {
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Info,
    FileText,
    Database,
    Calendar,
    Target,
    Download,
    Trash2,
    ChevronRight,
    ChevronDown,
    Layout,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ValidationSessionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        const fetchSession = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await api.getValidationSession(id);
                setSession(data);

                // If there's an extraction session, we want to try and get the files
                // This might be tricky if the files aren't stored in a way the frontend can easily reach
                // For now, we'll focus on the audit data.

                // Auto-select first field
                if (data.extraction_summary) {
                    const firstField = Object.keys(data.extraction_summary).find(
                        key => !key.startsWith('_') && !['bounding_boxes', 'citations', 'source_documents'].includes(key)
                    );
                    if (firstField) {
                        setActiveField(firstField);
                    }
                }
            } catch (error) {
                console.error('Error fetching validation session:', error);
                toast.error('Failed to load validation session');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
    }, [id]);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center gap-2 mb-8">
                    <Button variant="ghost" size="icon" disabled>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <div className="h-64 bg-muted animate-pulse rounded-xl" />
                        <div className="h-96 bg-muted animate-pulse rounded-xl" />
                    </div>
                    <div className="space-y-8">
                        <div className="h-[500px] bg-muted animate-pulse rounded-xl" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!session) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">Session Not Found</h2>
                        <p className="text-muted-foreground">The validation session you are looking for does not exist or has been deleted.</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link to="/validate/sessions">Back to History</Link>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const handleDelete = async () => {
        if (!id || !window.confirm('Are you sure you want to delete this validation session?')) return;
        try {
            await api.deleteValidationSession(id);
            toast.success('Session deleted successfully');
            navigate('/validate/sessions');
        } catch (error) {
            console.error('Error deleting session:', error);
            toast.error('Failed to delete session');
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'info': return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Info className="w-4 h-4" />;
        }
    };

    const getStatusBanner = () => {
        if (session.auto_approved) {
            return (
                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl shadow-green-500/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-green-500 uppercase tracking-tight">Ready for Approval</h3>
                            <p className="text-green-500/80 font-medium">This application meets all validation criteria and can be auto-approved.</p>
                        </div>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-500 text-white font-bold rounded-full px-8 shadow-lg shadow-green-500/20">
                        Approve Now
                    </Button>
                </div>
            );
        }

        const hasErrors = session.error_count > 0;
        return (
            <div className={cn(
                "p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl",
                hasErrors ? "bg-red-500/10 border border-red-500/20 shadow-red-500/5" : "bg-amber-500/10 border border-amber-500/20 shadow-amber-500/5"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        hasErrors ? "bg-red-500/20" : "bg-amber-500/20"
                    )}>
                        {hasErrors ? <AlertCircle className="w-6 h-6 text-red-500" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
                    </div>
                    <div className="space-y-1">
                        <h3 className={cn(
                            "text-lg font-black uppercase tracking-tight",
                            hasErrors ? "text-red-500" : "text-amber-500"
                        )}>
                            {hasErrors ? "Requires Corrections" : "Requires Review"}
                        </h3>
                        <p className={cn(
                            "font-medium",
                            hasErrors ? "text-red-500/80" : "text-amber-500/80"
                        )}>
                            {hasErrors ? "Validation errors must be addressed before approval." : "Review warnings and ensure data accuracy before proceeding."}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderFieldValue = (value: any, path: string = ''): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span className="text-muted-foreground italic">Not provided</span>;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            return (
                <div className="space-y-2 pl-4 border-l-2 border-border/50">
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{key.replace(/_/g, ' ')}</div>
                            {renderFieldValue(val, path ? `${path}.${key}` : key)}
                        </div>
                    ))}
                </div>
            );
        }

        if (Array.isArray(value)) {
            if (value.length === 0) {
                return <span className="text-muted-foreground italic">No items</span>;
            }
            return (
                <div className="space-y-3">
                    {value.map((item, index) => (
                        <div key={index} className="p-3 bg-muted/20 border border-border/50 rounded-xl">
                            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Item {index + 1}</div>
                            {renderFieldValue(item, `${path}[${index}]`)}
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="text-sm font-medium text-foreground">{String(value)}</div>;
    };

    const handleFieldClick = (fieldName: string) => {
        setActiveField(fieldName);
        // If we had files, we'd show the PDF viewer here
        // setShowPdfViewer(true);
    };

    const report = session.validation_report;
    const extraction = session.extraction_summary;

    return (
        <DashboardLayout noPadding>
            <div className="h-screen flex flex-col bg-[#F2F2F7] overflow-hidden">
                {/* Header - iOS Glass Style */}
                <header className="px-6 py-4 border-b border-border/40 bg-white/80 backdrop-blur-md z-20 flex items-center justify-between shrink-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-black/5 -ml-2">
                            <Link to="/validate/sessions">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="h-4 text-[8px] font-black border-black/5 uppercase px-1.5 bg-white/50">
                                    Audit Session
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-mono opacity-50">
                                    {session.report_id}
                                </span>
                            </div>
                            <h1 className="text-lg font-black text-foreground tracking-tight truncate max-w-[400px]">
                                {session.application_type}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 rounded-full text-[10px] font-bold border-black/5 bg-white shadow-sm" onClick={() => window.print()}>
                            <Download className="w-3.5 h-3.5 mr-2" />
                            EXPORT PDF
                        </Button>
                        <Button variant="destructive" size="sm" className="h-8 rounded-full text-[10px] font-bold shadow-lg shadow-red-500/10" onClick={handleDelete}>
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            REMOVE
                        </Button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 min-h-0 flex overflow-hidden">
                    {/* Sidebar Navigator */}
                    <aside className="w-[320px] border-r border-border/40 bg-white shadow-xl z-10 flex flex-col">
                        <div className="p-4 border-b border-border/40 bg-muted/10">
                            {getStatusBanner()}
                        </div>

                        <div className="p-4 py-2 border-b border-border/20">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Audit Intelligence</span>
                                <Badge className="bg-[#5856D6] text-white text-[9px] font-black rounded-full h-4">
                                    {(session.confidence_score * 100).toFixed(0)}% Match
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border/20">
                            {Object.keys(extraction || {}).filter(key => !key.startsWith('_') && !['bounding_boxes', 'citations', 'source_documents'].includes(key)).map((key) => {
                                const issues = report.issues.filter((i: any) => i.field === key || (Array.isArray(i.field) && i.field.includes(key)));
                                const hasIssue = issues.length > 0;
                                const severity = hasIssue ? issues[0].severity : null;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleFieldClick(key)}
                                        className={cn(
                                            "w-full flex items-start gap-3 p-4 text-left transition-all relative overflow-hidden group",
                                            activeField === key ? "bg-[#5856D6]/5" : "hover:bg-[#F2F2F7]/40"
                                        )}
                                    >
                                        {activeField === key && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#5856D6]" />
                                        )}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-tight truncate",
                                                    activeField === key ? "text-[#5856D6]" : "text-muted-foreground/60"
                                                )}>
                                                    {key.replace(/_/g, ' ')}
                                                </span>
                                                {hasIssue && (
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        severity === 'error' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                                                            severity === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                                                "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                    )} />
                                                )}
                                            </div>
                                            <p className={cn(
                                                "text-[11px] font-bold truncate leading-tight transition-colors",
                                                activeField === key ? "text-black" : "text-foreground"
                                            )}>
                                                {String(extraction[key])}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Content Panel */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-[#8E8E93]/10 p-4">
                        <div className="flex-1 glass-card rounded-3xl border border-white/40 shadow-2xl overflow-hidden flex flex-col bg-white">
                            {activeField ? (
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                                    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        {/* Field Identity */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-[#5856D6]/10 flex items-center justify-center">
                                                    <Target className="w-6 h-6 text-[#5856D6]" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-[#5856D6] bg-[#5856D6]/5 border-[#5856D6]/10">
                                                        Deep Audit Target
                                                    </Badge>
                                                    <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">
                                                        {activeField.replace(/_/g, ' ')}
                                                    </h2>
                                                </div>
                                            </div>

                                            <div className="p-8 bg-muted/5 border border-border/40 rounded-3xl shadow-inner-lg">
                                                <div className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] mb-4">Verification Artifact</div>
                                                <div className="text-2xl font-medium text-foreground leading-tight">
                                                    {renderFieldValue(extraction[activeField])}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification Results */}
                                        <div className="space-y-6">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] flex items-center gap-2">
                                                <Database className="w-3 h-3 opacity-40" />
                                                Validation Logic Analysis
                                            </div>

                                            <div className="space-y-4">
                                                {report.issues.filter((i: any) => i.field === activeField || (Array.isArray(i.field) && i.field.includes(activeField))).length > 0 ? (
                                                    report.issues.filter((i: any) => i.field === activeField || (Array.isArray(i.field) && i.field.includes(activeField))).map((issue: any, idx: number) => (
                                                        <div key={idx} className={cn(
                                                            "p-6 rounded-3xl border shadow-xl transition-all hover:scale-[1.01]",
                                                            issue.severity === 'error' ? "bg-red-50 border-red-200/50 shadow-red-500/[0.03]" :
                                                                issue.severity === 'warning' ? "bg-amber-50 border-amber-200/50 shadow-amber-500/[0.03]" :
                                                                    "bg-blue-50 border-blue-200/50 shadow-blue-500/[0.03]"
                                                        )}>
                                                            <div className="flex items-start gap-4">
                                                                <div className="p-2 bg-white rounded-xl shadow-sm border border-black/[0.03] mt-0.5">
                                                                    {getSeverityIcon(issue.severity)}
                                                                </div>
                                                                <div className="space-y-2 flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={cn(
                                                                            "text-[10px] font-black uppercase tracking-widest",
                                                                            issue.severity === 'error' ? "text-red-700" :
                                                                                issue.severity === 'warning' ? "text-amber-700" :
                                                                                    "text-blue-700"
                                                                        )}>
                                                                            {issue.severity.toUpperCase()} ALERT
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-base font-bold text-foreground leading-snug">{issue.message}</p>
                                                                    {issue.expected_value && (
                                                                        <div className="mt-3 p-3 bg-white/60 rounded-xl border border-black/[0.03] inline-block">
                                                                            <span className="text-[10px] font-bold text-muted-foreground block mb-1">REFERENCE BENCHMARK:</span>
                                                                            <span className="font-mono text-xs font-bold">{JSON.stringify(issue.expected_value)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-12 text-center bg-green-500/[0.03] border border-green-500/10 rounded-3xl space-y-4">
                                                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/10">
                                                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="text-lg font-black text-green-600 uppercase tracking-tight">Verified Fact</h4>
                                                            <p className="text-sm font-medium text-green-600/60 max-w-xs mx-auto">This artifact passed all automated verification protocols with high confidence.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Source Citation */}
                                        <div className="space-y-4 opacity-80">
                                            <div className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-[0.2em] flex items-center gap-2">
                                                <FileText className="w-3 h-3 opacity-40" />
                                                Cited Origin
                                            </div>
                                            <div className="p-6 bg-muted/5 border border-border/30 rounded-2xl italic font-medium text-sm text-foreground/80 leading-relaxed shadow-sm">
                                                "{extraction._citations?.[activeField] || "System verified metadata from encrypted source documents."}"
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-10">
                                    <Database className="w-32 h-32 mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-[0.5em]">Select Objective</h3>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
