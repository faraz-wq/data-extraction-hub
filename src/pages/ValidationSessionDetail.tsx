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
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-primary">
                            <Link to="/validate/sessions">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to History
                            </Link>
                        </Button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary">
                                <Layout className="w-5 h-5" />
                                <span className="text-sm font-bold tracking-widest uppercase">Audit Result</span>
                            </div>
                            <h1 className="text-4xl font-black text-foreground tracking-tight">
                                {session.application_type}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 opacity-50" />
                                    <span>{new Date(session.created_at).toLocaleString()}</span>
                                </div>
                                <span>·</span>
                                <div className="flex items-center gap-1.5">
                                    <Database className="w-4 h-4 opacity-50" />
                                    <span className="font-mono text-[10px]">{session.validation_id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.print()}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                        </Button>
                        <Button variant="destructive" size="sm" className="rounded-full" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Status Banner */}
                {getStatusBanner()}

                {/* Main Interface */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                    {/* LEFT: Stats & Navigation */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Stats Card */}
                        <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xl overflow-hidden ring-1 ring-white/10">
                            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Audit Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">Confidence</span>
                                        <span className={cn(
                                            "text-sm font-black",
                                            session.confidence_score >= 0.9 ? "text-green-500" :
                                                session.confidence_score >= 0.7 ? "text-amber-500" : "text-red-500"
                                        )}>
                                            {(session.confidence_score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all duration-1000",
                                                session.confidence_score >= 0.9 ? "bg-green-500" :
                                                    session.confidence_score >= 0.7 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                            style={{ width: `${session.confidence_score * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                                        <div className="text-xl font-black text-red-500">{session.error_count}</div>
                                        <div className="text-[8px] font-black uppercase text-red-500/70 tracking-tighter">Errors</div>
                                    </div>
                                    <div className="text-center p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                        <div className="text-xl font-black text-amber-500">{session.warning_count}</div>
                                        <div className="text-[8px] font-black uppercase text-amber-500/70 tracking-tighter">Warnings</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                        <div className="text-xl font-black text-blue-500">{session.info_count}</div>
                                        <div className="text-[8px] font-black uppercase text-blue-500/70 tracking-tighter">Info</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Field Navigator */}
                        <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xl overflow-hidden ring-1 ring-white/10">
                            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Field Navigator</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                                <div className="divide-y divide-border/30">
                                    {Object.keys(extraction || {}).filter(key => !key.startsWith('_') && !['bounding_boxes', 'citations', 'source_documents'].includes(key)).map((key) => {
                                        const hasIssue = report.issues.some((i: any) => i.field === key || (Array.isArray(i.field) && i.field.includes(key)));
                                        const severity = hasIssue ? report.issues.find((i: any) => i.field === key || (Array.isArray(i.field) && i.field.includes(key)))?.severity : null;

                                        return (
                                            <button
                                                key={key}
                                                onClick={() => handleFieldClick(key)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-4 text-left transition-all hover:bg-muted/50",
                                                    activeField === key ? "bg-primary/10 ring-1 ring-inset ring-primary/20" : ""
                                                )}
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className={cn(
                                                        "text-xs font-bold uppercase tracking-tight truncate",
                                                        activeField === key ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {key.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate opacity-70">
                                                        {JSON.stringify(extraction[key]).slice(0, 40)}
                                                    </p>
                                                </div>
                                                {hasIssue && (
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full ring-4 shadow-lg",
                                                        severity === 'error' ? "bg-red-500 ring-red-500/20 shadow-red-500/30" :
                                                            severity === 'warning' ? "bg-amber-500 ring-amber-500/20 shadow-amber-500/30" :
                                                                "bg-blue-500 ring-blue-500/20 shadow-blue-500/30"
                                                    )} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* MIDDLE/RIGHT: Data & Issues */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Field Details */}
                        {activeField && (
                            <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50 py-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">
                                            {activeField.replace(/_/g, ' ')}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px] font-black uppercase font-mono tracking-tighter">
                                            Field Detail
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Extracted Value</label>
                                                <div className="p-6 bg-muted/20 border border-border/50 rounded-3xl text-lg font-medium shadow-inner">
                                                    {renderFieldValue(extraction[activeField])}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Source Citation</label>
                                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
                                                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                                                    <p className="text-sm text-foreground/80 italic font-medium leading-relaxed">
                                                        "{extraction._citations?.[activeField] || "No citation available for this field."}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Validation Analysis</label>
                                            <div className="space-y-3">
                                                {report.issues.filter((i: any) => i.field === activeField || (Array.isArray(i.field) && i.field.includes(activeField))).length > 0 ? (
                                                    report.issues.filter((i: any) => i.field === activeField || (Array.isArray(i.field) && i.field.includes(activeField))).map((issue: any, idx: number) => (
                                                        <div key={idx} className={cn(
                                                            "p-5 rounded-3xl border flex items-start gap-4",
                                                            issue.severity === 'error' ? "bg-red-500/10 border-red-500/20" :
                                                                issue.severity === 'warning' ? "bg-amber-500/10 border-amber-500/20" :
                                                                    "bg-blue-500/10 border-blue-500/20"
                                                        )}>
                                                            <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-black uppercase tracking-tight">{issue.message}</p>
                                                                {issue.expected_value && (
                                                                    <p className="text-xs font-medium opacity-80">
                                                                        Expected: <span className="font-bold underline">{JSON.stringify(issue.expected_value)}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center bg-green-500/5 border border-green-500/10 rounded-3xl space-y-3">
                                                        <CheckCircle2 className="w-10 h-10 text-green-500/30 mx-auto" />
                                                        <p className="text-sm font-bold text-green-500/70 uppercase">No issues found for this field</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Overall Issues List */}
                        <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xl overflow-hidden ring-1 ring-white/10">
                            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">All Validation Issues</CardTitle>
                                    <Badge variant="outline" className="rounded-full px-3">{report.issues.length} Issues</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {report.issues.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground font-medium">
                                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                                        No issues identified in this validation.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/30">
                                        {report.issues.map((issue: any, index: number) => (
                                            <button
                                                key={index}
                                                onClick={() => issue.field && handleFieldClick(Array.isArray(issue.field) ? issue.field[0] : issue.field)}
                                                className="w-full text-left p-6 hover:bg-muted/30 transition-all flex items-start gap-4"
                                            >
                                                <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">{issue.field || "System"}</span>
                                                        <Badge variant="outline" className="text-[8px] font-black leading-none py-0.5">{issue.severity}</Badge>
                                                    </div>
                                                    <p className="font-bold text-foreground leading-snug">{issue.message}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-30 mt-1" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Extraction Data Tree */}
                        <Card className="border-border/50 bg-background/40 backdrop-blur-xl shadow-xl overflow-hidden ring-1 ring-white/10">
                            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Extracted Data Tree</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    {Object.entries(extraction || {}).filter(([key]) => !key.startsWith('_') && !['bounding_boxes', 'citations', 'source_documents'].includes(key)).map(([key, value]) => (
                                        <div key={key} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{key.replace(/_/g, ' ')}</span>
                                            </div>
                                            <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl shadow-sm">
                                                {renderFieldValue(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
