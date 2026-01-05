import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
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
    const { toast } = useToast();
    const navigate = useNavigate();

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
                        {configs.map((config) => (
                            <Card
                                key={config.application_type}
                                className="group hover:shadow-lg transition-all duration-200"
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="w-5 h-5 text-primary" />
                                        {config.application_type}
                                    </CardTitle>
                                    <CardDescription>
                                        {config.key_details.length} fields • {config.rules.length} rules
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {config.key_details.slice(0, 3).map((detail) => (
                                                <span
                                                    key={detail.field_path}
                                                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium"
                                                >
                                                    {detail.display_name}
                                                </span>
                                            ))}
                                            {config.key_details.length > 3 && (
                                                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                                                    +{config.key_details.length - 3} more
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-4">
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
                        ))}
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
