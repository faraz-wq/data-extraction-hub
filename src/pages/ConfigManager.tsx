import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [editingConfig, setEditingConfig] = useState<ValidationConfig | null>(null);
    const [isCreating, setIsCreating] = useState(false);
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
        setIsCreating(true);
        setEditingConfig({
            application_type: '',
            key_details: [],
            rules: [],
        });
    };

    const handleEdit = (config: ValidationConfig) => {
        setIsCreating(false);
        setEditingConfig({ ...config });
    };

    const handleDuplicate = (config: ValidationConfig) => {
        setIsCreating(true);
        setEditingConfig({
            ...config,
            application_type: `${config.application_type} (Copy)`,
        });
    };

    const handleSave = async (config: ValidationConfig) => {
        try {
            if (isCreating) {
                await api.createValidationConfig(config);
                toast({
                    title: 'Success',
                    description: 'Configuration created successfully',
                });
            } else {
                await api.updateValidationConfig(config.application_type, config);
                toast({
                    title: 'Success',
                    description: 'Configuration updated successfully',
                });
            }
            setEditingConfig(null);
            setIsCreating(false);
            loadConfigs();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save configuration',
                variant: 'destructive',
            });
        }
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

    if (editingConfig) {
        return (
            <ConfigEditor
                config={editingConfig}
                isNew={isCreating}
                onSave={handleSave}
                onCancel={() => {
                    setEditingConfig(null);
                    setIsCreating(false);
                }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                Validation Configurations
                            </h1>
                            <p className="text-slate-600">
                                Manage document validation rules and field definitions
                            </p>
                        </div>
                        <Button
                            onClick={handleCreate}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Configuration
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : configs.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="w-16 h-16 text-slate-300 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">
                                No configurations yet
                            </h3>
                            <p className="text-slate-500 mb-6">
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
                                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 bg-white/80 backdrop-blur"
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <FileText className="w-5 h-5 text-blue-600" />
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
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                                >
                                                    {detail.display_name}
                                                </span>
                                            ))}
                                            {config.key_details.length > 3 && (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                    +{config.key_details.length - 3} more
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(config)}
                                                className="flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDuplicate(config)}
                                                className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDeleteTarget(config.application_type)}
                                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
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
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
