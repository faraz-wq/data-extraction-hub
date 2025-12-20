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
            <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-background">
                {/* Slim Header */}
                <header className="px-3 py-1.5 border-b border-border bg-background flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                            if (!validationReport || confirm("Reset?")) {
                                setValidationReport(null);
                                setExtractionData(null);
                                setFiles([]);
                                setActiveField(null);
                            }
                        }}>
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-[11px] font-black uppercase tracking-widest text-foreground/80 leading-none">Audit Dashboard</h1>
                            <p className="text-[8px] text-muted-foreground/60 font-medium tracking-tight">
                                {validationReport ? `REF: ${validationReport.metadata?.validation_id?.slice(0, 8)}` : 'READY TO START'}
                            </p>
                        </div>
                    </div>

                    {validationReport && (
                        <div className="flex items-center gap-1.5">
                            <Badge className={cn(
                                "h-5 rounded-md px-1.5 text-[8px] font-black tracking-tighter",
                                validationReport.auto_approved ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                            )}>
                                {validationReport.auto_approved ? 'AI-PASS' : 'REVIEW'}
                            </Badge>
                            <Button size="sm" className="h-6 px-3 font-black uppercase tracking-widest text-[8px] rounded-md">
                                Approve
                            </Button>
                        </div>
                    )}
                </header>

                <main className="flex-1 min-h-0 flex overflow-hidden">
                    {/* LEFT PANEL */}
                    <div className="w-[300px] flex flex-col border-r border-border shrink-0 overflow-hidden bg-muted/[0.02]">
                        {!validationReport ? (
                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Classification</label>
                                        <select
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="w-full px-1.5 py-1 border border-border rounded-md bg-background text-[10px] font-bold outline-none ring-1 ring-transparent focus:ring-primary/20"
                                            disabled={isValidating}
                                        >
                                            <option value="">Select Service...</option>
                                            {APPLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Documents</label>
                                        <div className="border border-dashed border-border/60 rounded-lg p-3 text-center hover:bg-muted/50 transition-all relative cursor-pointer">
                                            <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isValidating} />
                                            <Upload className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground/40" />
                                            <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground/70">Drop Files</p>
                                        </div>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="bg-muted/20 p-1.5 rounded border border-border/30 space-y-0.5">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex items-center gap-1.5 truncate text-[9px] text-muted-foreground/80 font-medium">
                                                    <FileText className="w-2.5 h-2.5 shrink-0" />
                                                    <span className="truncate">{f.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-8 rounded-lg font-black uppercase tracking-[0.1em] text-[10px]"
                                        onClick={handleValidate}
                                        disabled={isValidating || !selectedType || files.length === 0}
                                    >
                                        {isValidating ? 'Thinking...' : 'Start Extraction'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="p-1.5 border-b border-border bg-muted/20 flex gap-1">
                                    <div className="flex-1 bg-background border border-border/40 rounded p-1 text-center shadow-sm">
                                        <div className="text-[7px] font-black uppercase text-muted-foreground/50 tracking-tighter leading-none">Confidence</div>
                                        <div className="text-[11px] font-black italic tracking-tighter">{(validationReport.confidence_score * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="flex-1 bg-background border border-border/40 rounded p-1 text-center shadow-sm">
                                        <div className="text-[7px] font-black uppercase text-muted-foreground/50 tracking-tighter leading-none">Alerts</div>
                                        <div className="text-[11px] font-black italic tracking-tighter text-red-500">{validationReport.metadata?.total_issues || 0}</div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="px-3 py-1 bg-muted/30 border-b border-border/50 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center justify-between">
                                        Field Explorer
                                        <List className="w-2.5 h-2.5" />
                                    </div>
                                    <div className="divide-y divide-border/5 overflow-x-hidden">
                                        {Object.entries(extractionData.summary)
                                            .filter(([k]) => !k.startsWith('_') && !['bounding_boxes', 'citations', 'source_documents'].includes(k))
                                            .map(([key, value]) => renderFieldRow(key, value))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="flex-1 relative overflow-hidden flex flex-col bg-muted/5">
                        {validationReport ? (
                            <>
                                <div className="px-3 py-1 border-b border-border bg-background flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="outline" className="h-4 text-[7px] font-black tracking-widest border-primary/10 uppercase text-primary/70 px-1 bg-primary/5 rounded-sm">
                                            Evidence
                                        </Badge>
                                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase truncate max-w-[150px] tracking-tighter">
                                            {files[0]?.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-40">
                                        <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-tighter">
                                            <Layers className="w-2 h-2" />
                                            Active View
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <PDFViewerWithBoxes
                                        file={files[0] || null}
                                        boundingBoxes={extractionData?.bounding_boxes as Record<string, BoundingBox[]> || {}}
                                        highlightedField={activeField}
                                        onFieldClick={(f) => setActiveField(f)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-10">
                                <Search className="w-12 h-12 mb-2 text-muted-foreground" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Audit Vault</h3>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </DashboardLayout>
    );
}
