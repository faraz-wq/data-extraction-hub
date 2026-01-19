import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ConfigEditor } from '@/components/config/ConfigEditor';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ValidationConfig {
    application_type: string;
    key_details: KeyDetail[];
    rules: ValidationRule[];
}

interface KeyDetail {
    field_path: string;
    display_name: string;
    description: string;
    is_mandatory: boolean;
    valid_proof_documents: string[];
}

interface ValidationRule {
    rule_id: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    rule_type: string;
    fields_involved: string[];
}

export default function ConfigManager() {
    const [configs, setConfigs] = useState<ValidationConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [expandedConfigs, setExpandedConfigs] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    const navigate = useNavigate();

    const toggleExpand = (appType: string) => {
        setExpandedConfigs(prev => ({
            ...prev,
            [appType]: !prev[appType]
        }));
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await api.getValidationConfigs();
            setConfigs(data.configs || []);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load validation configurations',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        navigate('/configs/new');
    };

    const handleEdit = (config: ValidationConfig) => {
        navigate(`/configs/edit/${encodeURIComponent(config.application_type)}`);
    };

    const handleDuplicate = (config: ValidationConfig) => {
        // We can pass state to the new page if we want, or handle it differently.
        // For simplicity, let's navigate to /configs/new and maybe add a query param or just let it be.
        // Actually, let's just navigate to new with state if needed, but for now simple:
        navigate('/configs/new', { state: { template: config } });
    };

    const handleDelete = async (applicationType: string) => {
        try {
            await api.deleteValidationConfig(applicationType);
            toast({
                title: 'Success',
                description: 'Configuration deleted successfully',
            });
            setDeleteTarget(null);
            loadConfigs();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete configuration',
                variant: 'destructive',
            });
        }
    };


    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-foreground mb-2">
                                Validation Configurations
                            </h1>
                            <p className="text-muted-foreground">
                                Manage document validation rules and field definitions
                            </p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            size="lg"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Configuration
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : configs.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                No configurations yet
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Create your first validation configuration to get started
                            </p>
                            <Button onClick={handleCreate} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Configuration
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {configs.map((config) => {
                            const isExpanded = expandedConfigs[config.application_type];
                            return (
                                <Card
                                    key={config.application_type}
                                    className="group hover:shadow-lg transition-all duration-300 ease-in-out border-slate-200 flex flex-col h-full"
                                >
                                    <CardHeader className={cn(
                                        "transition-none",
                                        isExpanded ? "p-4 pb-2" : "p-6"
                                    )}>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <FileText className="w-5 h-5 transition-transform duration-300" style={{ stroke: "url(#tricolor-gradient)" }} />
                                            {config.application_type}
                                        </CardTitle>
                                        <CardDescription className={isExpanded ? "text-[11px]" : ""}>
                                            {config.key_details.length} fields • {config.rules.length} rules
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className={cn(
                                        "transition-none",
                                        isExpanded ? "px-4 pb-4 pt-0 flex flex-col flex-1" : "px-6 pb-6 pt-0 flex flex-col flex-1"
                                    )}>
                                        <div className={cn(
                                            "transition-none flex flex-col flex-1",
                                            isExpanded ? "gap-1" : "gap-3"
                                        )}>
                                            <div className={cn(
                                                "flex flex-wrap transition-none",
                                                isExpanded ? "gap-1" : "gap-2"
                                            )}>
                                                {(isExpanded ? config.key_details : config.key_details.slice(0, 3)).map((detail, idx) => (
                                                    <span
                                                        key={`${isExpanded ? 'exp-' : 'col-'}${detail.field_path}`}
                                                        className={cn(
                                                            "text-xs font-medium inline-block",
                                                            isExpanded ? "px-1 py-0.5 animate-field" : "px-1 py-1"
                                                        )}
                                                        style={isExpanded ? { animationDelay: `${idx * 0.03}s` } : {}}
                                                    >
                                                        <span className="text-slate-900 italic underline decoration-[#F97316]/40 underline-offset-[3px] decoration-[1.5px] transition-all hover:decoration-[#F97316]/80">
                                                            {detail.display_name}
                                                        </span>
                                                    </span>
                                                ))}
                                                {config.key_details.length > 3 && (
                                                    <button
                                                        onClick={() => toggleExpand(config.application_type)}
                                                        className={cn(
                                                            "bg-transparent text-[#F97316] hover:underline text-xs transition-all font-medium hover:scale-105 active:scale-95",
                                                            isExpanded ? "px-1 py-0.5 opacity-60 hover:opacity-100" : "px-1 py-1"
                                                        )}
                                                    >
                                                        {isExpanded ? 'Show Less' : `+${config.key_details.length - 3} more`}
                                                    </button>
                                                )}
                                            </div>

                                            <div className={cn(
                                                "flex gap-2 transition-all duration-300 mt-auto",
                                                isExpanded ? "pt-2" : "pt-4"
                                            )}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(config)}
                                                    className="flex-1"
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDuplicate(config)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(config.application_type)}
                                                    className="text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the "{deleteTarget}" configuration?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTarget && handleDelete(deleteTarget)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
