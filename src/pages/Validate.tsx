import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api, ValidationReport, SessionDetail, BoundingBox } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
    Upload,
    FileText,
    XCircle,
    AlertTriangle,
    Info,
    ArrowLeft,
    Package,
    List,
    Layers,
    AlertCircle,
    Search
} from 'lucide-react';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const APPLICATION_TYPES = [
    'Family Member Certificate',
    'Income Certificate',
    'OBC Certificate',
    'EWS Certificate',
    'Integrated Certificate',
];

export default function Validate() {
    const [selectedType, setSelectedType] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
    const [extractionData, setExtractionData] = useState<SessionDetail | null>(null);
    const [activeField, setActiveField] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleValidate = async () => {
        if (!selectedType || files.length === 0) {
            toast({
                title: 'Data Missing',
                description: 'Select type and docs',
                variant: 'destructive',
            });
            return;
        }

        setIsValidating(true);
        try {
            const extraction = await api.extractSummary(selectedType, files);
            setExtractionData(extraction);
            const report = await api.validateExtraction(selectedType, extraction.summary, extraction.session_id);
            setValidationReport(report);
        } catch (error) {
            toast({
                title: 'Failed',
                description: error instanceof Error ? error.message : 'Error',
                variant: 'destructive',
            });
        } finally {
            setIsValidating(false);
        }
    };

    const getSeverityIcon = (severity: string, size = "w-2.5 h-2.5") => {
        switch (severity) {
            case 'error': return <XCircle className={cn(size, "text-red-500")} />;
            case 'warning': return <AlertTriangle className={cn(size, "text-amber-500")} />;
            default: return <Info className={cn(size, "text-blue-500")} />;
        }
    };

    const getIssueForField = (fieldPath: string) => {
        if (!validationReport) return null;
        return validationReport.issues.find(issue =>
            issue.field === fieldPath || (Array.isArray(issue.field) && issue.field.includes(fieldPath))
        );
    };

    const renderFieldValue = (value: any, path: string): React.ReactNode => {
        const isActive = activeField === path;

        if (value === null || value === undefined || value === "") {
            return (
                <div
                    onClick={(e) => { e.stopPropagation(); setActiveField(path); }}
                    className={cn("flex items-center gap-1 text-muted-foreground/30 italic text-[9px] cursor-pointer hover:bg-muted/50 rounded px-1 transition-all py-0.5", isActive && "bg-primary/10 text-primary/80")}
                >
                    <AlertCircle className="w-2 h-2" />
                    <span>N/A</span>
                </div>
            );
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            return (
                <div className="space-y-0.5 pl-2 border-l border-primary/10 ml-1 py-0.5">
                    {Object.entries(value).map(([key, val]) => {
                        const childPath = path ? `${path}.${key}` : key;
                        const isChildActive = activeField === childPath;
                        return (
                            <div key={key} className="space-y-0">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveField(childPath); }}
                                    className={cn(
                                        "text-[8px] font-black uppercase text-muted-foreground/50 tracking-tighter leading-none mb-0.5 cursor-pointer hover:text-primary transition-colors",
                                        isChildActive && "text-primary/70"
                                    )}
                                >
                                    {key.replace(/_/g, ' ')}
                                </div>
                                {renderFieldValue(val, childPath)}
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (Array.isArray(value)) {
            return (
                <div className="space-y-1 mt-0.5">
                    {value.map((item, index) => {
                        const childPath = `${path}[${index}]`;
                        return (
                            <div key={index} className="p-1 bg-muted/20 rounded border border-border/10">
                                <div
                                    onClick={(e) => { e.stopPropagation(); setActiveField(childPath); }}
                                    className="text-[7px] font-black uppercase text-primary/30 flex items-center gap-1 mb-0.5 cursor-pointer hover:text-primary transition-colors"
                                >
                                    <Package className="w-2 h-2" /> {index + 1}
                                </div>
                                {renderFieldValue(item, childPath)}
                            </div>
                        );
                    })}
                </div>
            );
        }

        return (
            <div
                onClick={(e) => { e.stopPropagation(); setActiveField(path); }}
                className={cn(
                    "text-[11px] font-bold tracking-tight text-foreground break-words leading-none cursor-pointer hover:bg-primary/5 transition-all inline-block px-1 py-0.5 rounded",
                    isActive && "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
                )}
            >
                {String(value)}
            </div>
        );
    };

    const renderFieldRow = (key: string, value: any) => {
        const issue = getIssueForField(key);
        const isActive = activeField === key;

        return (
            <div
                key={key}
                onClick={() => setActiveField(key)}
                className={cn(
                    "relative p-1.5 px-3 transition-all cursor-pointer border-b border-border/10 last:border-0",
                    isActive ? "bg-primary/[0.03]" : "hover:bg-muted/30",
                    issue?.severity === 'error' && "bg-red-500/[0.02]",
                    issue?.severity === 'warning' && "bg-amber-500/[0.02]"
                )}
            >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className={cn(
                        "text-[9px] font-black uppercase tracking-tighter flex items-center gap-1",
                        issue?.severity === 'error' ? "text-red-500" :
                            issue?.severity === 'warning' ? "text-amber-500" :
                                "text-muted-foreground/70"
                    )}>
                        {key.replace(/_/g, ' ')}
                        {issue && getSeverityIcon(issue.severity)}
                    </div>
                </div>

                <div>
                    {renderFieldValue(value, key)}
                </div>

                {issue && isActive && (
                    <div className={cn(
                        "mt-1.5 p-1.5 rounded-md border text-[9px] leading-tight",
                        issue.severity === 'error' ? "bg-red-500/5 border-red-500/10 text-red-600" :
                            issue.severity === 'warning' ? "bg-amber-500/5 border-amber-500/10 text-amber-600" :
                                "bg-blue-500/5 border-blue-500/10 text-blue-600"
                    )}>
                        <span className="font-black uppercase opacity-60 mr-1">Note:</span>
                        {issue.message}
                    </div>
                )}
            </div>
        );
    };

    // Auto-select the first field if none is selected
    useEffect(() => {
        if (extractionData && !activeField) {
            const firstField = Object.keys(extractionData.summary).find(
                key => !key.startsWith('_') && !['bounding_boxes', 'citations', 'source_documents'].includes(key)
            );
            if (firstField) {
                setActiveField(firstField);
            }
        }
    }, [extractionData, activeField]);

    return (
        <DashboardLayout noPadding>
            <div className="h-screen overflow-hidden flex flex-col bg-[#F2F2F7]">
                {/* Visual Fix: Ensure the main container fills the available height without gaps */}

                {/* Slim Header - iOS Style Glassmorphism */}
                <header className="px-4 py-2 border-b border-border/40 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5" onClick={() => {
                            if (!validationReport || confirm("Reset current session?")) {
                                setValidationReport(null);
                                setExtractionData(null);
                                setFiles([]);
                                setActiveField(null);
                            }
                        }}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-[12px] font-bold text-foreground leading-none tracking-tight">Audit Dashboard</h1>
                            <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                                {validationReport ? `REF: ${validationReport.metadata?.validation_id?.slice(0, 8).toUpperCase()}` : 'Verification Workspace'}
                            </p>
                        </div>
                    </div>

                    {validationReport && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] font-black uppercase text-muted-foreground/50 tracking-tighter leading-none">Confidence</span>
                                    <span className={cn(
                                        "text-[10px] font-bold",
                                        validationReport.confidence_score >= 0.9 ? "text-green-500" :
                                            validationReport.confidence_score >= 0.7 ? "text-amber-500" : "text-red-500"
                                    )}>{(validationReport.confidence_score * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-6 w-px bg-border/40 mx-1" />
                                <div className="flex flex-col items-end">
                                    <span className="text-[7px] font-black uppercase text-muted-foreground/50 tracking-tighter leading-none">Alerts</span>
                                    <span className="text-[10px] font-bold text-red-500">{validationReport.metadata?.total_issues || 0}</span>
                                </div>
                            </div>

                            <Badge className={cn(
                                "h-6 rounded-full px-3 text-[9px] font-bold tracking-tight shadow-sm border-none transition-all",
                                validationReport.auto_approved ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                            )}>
                                {validationReport.auto_approved ? 'AI-PASS' : 'REVIEW'}
                            </Badge>
                            <Button size="sm" className="h-7 px-4 font-bold text-[10px] rounded-full bg-black hover:bg-black/80 text-white shadow-md">
                                Approve
                            </Button>
                        </div>
                    )}
                </header>

                <main className="flex-1 min-h-0 flex overflow-hidden">
                    {/* LEFT PANEL - Side List */}
                    <div className="w-[320px] flex flex-col border-r border-border/40 shrink-0 overflow-hidden bg-white z-10">
                        {!validationReport ? (
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-[#F2F2F7]/30">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold uppercase text-muted-foreground/70 tracking-tight ml-1">Application Type</label>
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="w-full h-9 px-3 border border-border/60 rounded-xl bg-white text-[11px] font-medium outline-none shadow-sm focus:ring-2 focus:ring-black/5 transition-all"
                                            disabled={isValidating}
                                        >
                                            <option value="">Select service...</option>
                                            {APPLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold uppercase text-muted-foreground/70 tracking-tight ml-1">Evidence Files</label>
                                        <div className="border border-dashed border-border/80 rounded-2xl p-6 text-center hover:bg-white hover:border-black/20 transition-all relative cursor-pointer group bg-white/50">
                                            <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isValidating} />
                                            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30 group-hover:text-black/40 transition-colors" />
                                            <p className="text-[10px] font-bold text-muted-foreground/60">Upload documents</p>
                                        </div>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="bg-white/50 p-2 rounded-xl border border-border/40 space-y-1">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2 truncate text-[10px] text-muted-foreground font-medium px-1">
                                                    <FileText className="w-3 h-3 text-primary/40 shrink-0" />
                                                    <span className="truncate">{f.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-10 rounded-full font-bold text-[11px] shadow-lg shadow-black/5 bg-black hover:bg-black/90 text-white"
                                        onClick={handleValidate}
                                        disabled={isValidating || !selectedType || files.length === 0}
                                    >
                                        {isValidating ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Analyzing</span>
                                            </div>
                                        ) : 'Start Verification'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0">
                                {/* Explorer Header */}
                                <div className="px-4 py-2.5 bg-white border-b border-border/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                                        <span className="text-[10px] font-bold tracking-tight uppercase">Extracted Facts</span>
                                    </div>
                                    <span className="text-[9px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                                        {Object.keys(extractionData.summary).filter(k => !k.startsWith('_')).length}
                                    </span>
                                </div>

                                {/* Scrollable Content Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                    <div className="divide-y divide-border/20">
                                        {Object.entries(extractionData.summary)
                                            .filter(([k]) => !k.startsWith('_') && !['bounding_boxes', 'citations', 'source_documents'].includes(k))
                                            .map(([key, value]) => renderFieldRow(key, value))}
                                    </div>

                                    {/* Visual Fix: Spacer to push content up and ensure no floating gaps */}
                                    <div className="h-10" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL - Document Canvas */}
                    <div className="flex-1 relative overflow-hidden flex flex-col bg-[#8E8E93]/10">
                        {validationReport ? (
                            <div className="h-full flex flex-col scale-in">
                                {/* Canvas Header */}
                                <div className="px-4 py-2 border-b border-border/30 bg-white/40 backdrop-blur-sm flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="h-5 text-[8px] font-bold border-black/5 uppercase text-black/60 px-2 bg-white/60 rounded-md shadow-sm">
                                            Evidence
                                        </Badge>
                                        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[200px]">
                                            {files[0]?.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Interactive Preview</span>
                                    </div>
                                </div>

                                {/* The primary document view area */}
                                <div className="flex-1 min-h-0 bg-transparent p-2">
                                    <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
                                        <PDFViewerWithBoxes
                                            file={files[0] || null}
                                            boundingBoxes={extractionData?.bounding_boxes as Record<string, BoundingBox[]> || {}}
                                            highlightedField={activeField}
                                            onFieldClick={(f) => setActiveField(f)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-[0.03]">
                                <Search className="w-24 h-24 mb-4 text-black" />
                                <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-black">Verification Vault</h3>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
