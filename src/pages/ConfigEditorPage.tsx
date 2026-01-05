import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ConfigEditor } from '@/components/config/ConfigEditor';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ConfigEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(id ? true : false);

    const location = useLocation();

    useEffect(() => {
        if (id) {
            loadConfig();
        } else if (location.state?.template) {
            // Duplicate config
            const template = location.state.template;
            setConfig({
                ...template,
                application_type: `${template.application_type} (Copy)`,
            });
        } else {
            // New config
            setConfig({
                application_type: '',
                key_details: [],
                rules: [],
            });
        }
    }, [id, location.state]);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const data = await api.getValidationConfig(id!);
            setConfig(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to load configuration: ' + error.message,
                variant: 'destructive',
            });
            navigate('/configs');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedConfig: any) => {
        try {
            if (!id) {
                // Creation
                await api.createValidationConfig(updatedConfig);
                toast({
                    title: 'Success',
                    description: 'Configuration created successfully',
                });
            } else {
                // Update
                await api.updateValidationConfig(id, updatedConfig);
                toast({
                    title: 'Success',
                    description: 'Configuration updated successfully',
                });
            }
            navigate('/configs');
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save configuration',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    if (!config) return null;

    return (
        <ConfigEditor
            config={config}
            isNew={!id}
            onSave={handleSave}
            onCancel={() => navigate('/configs')}
        />
    );
}
