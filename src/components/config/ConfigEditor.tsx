import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, Plus, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface ConfigEditorProps {
    config: ValidationConfig;
    isNew: boolean;
    onSave: (config: ValidationConfig) => void;
    onCancel: () => void;
}

export function ConfigEditor({ config, isNew, onSave, onCancel }: ConfigEditorProps) {
    const [editedConfig, setEditedConfig] = useState<ValidationConfig>(config);
    const [errors, setErrors] = useState<string[]>([]);

    const validateConfig = (): boolean => {
        const newErrors: string[] = [];

        if (!editedConfig.application_type.trim()) {
            newErrors.push('Application type is required');
        }

        if (editedConfig.key_details.length === 0) {
            newErrors.push('At least one key detail is required');
        }

        editedConfig.key_details.forEach((detail, index) => {
            if (!detail.field_path.trim()) {
                newErrors.push(`Key detail #${index + 1}: Field path is required`);
            }
            if (!detail.display_name.trim()) {
                newErrors.push(`Key detail #${index + 1}: Display name is required`);
            }
        });

        editedConfig.rules.forEach((rule, index) => {
            if (!rule.rule_id.trim()) {
                newErrors.push(`Rule #${index + 1}: Rule ID is required`);
            }
            if (!rule.description.trim()) {
                newErrors.push(`Rule #${index + 1}: Description is required`);
            }
            if (rule.fields_involved.length === 0) {
                newErrors.push(`Rule #${index + 1}: At least one field must be involved`);
            }
        });

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleSave = () => {
        if (validateConfig()) {
            onSave(editedConfig);
        }
    };

    const addKeyDetail = () => {
        setEditedConfig({
            ...editedConfig,
            key_details: [
                ...editedConfig.key_details,
                {
                    field_path: '',
                    display_name: '',
                    description: '',
                    is_mandatory: true,
                    valid_proof_documents: [],
                },
            ],
        });
    };

    const updateKeyDetail = (index: number, updates: Partial<KeyDetail>) => {
        const newDetails = [...editedConfig.key_details];
        newDetails[index] = { ...newDetails[index], ...updates };
        setEditedConfig({ ...editedConfig, key_details: newDetails });
    };

    const removeKeyDetail = (index: number) => {
        setEditedConfig({
            ...editedConfig,
            key_details: editedConfig.key_details.filter((_, i) => i !== index),
        });
    };

    const addRule = () => {
        setEditedConfig({
            ...editedConfig,
            rules: [
                ...editedConfig.rules,
                {
                    rule_id: '',
                    description: '',
                    severity: 'error',
                    rule_type: 'consistency',
                    fields_involved: [],
                },
            ],
        });
    };

    const updateRule = (index: number, updates: Partial<ValidationRule>) => {
        const newRules = [...editedConfig.rules];
        newRules[index] = { ...newRules[index], ...updates };
        setEditedConfig({ ...editedConfig, rules: newRules });
    };

    const removeRule = (index: number) => {
        setEditedConfig({
            ...editedConfig,
            rules: editedConfig.rules.filter((_, i) => i !== index),
        });
    };

    const addProofDocument = (detailIndex: number, document: string) => {
        if (!document.trim()) return;
        const detail = editedConfig.key_details[detailIndex];
        if (!detail.valid_proof_documents.includes(document)) {
            updateKeyDetail(detailIndex, {
                valid_proof_documents: [...detail.valid_proof_documents, document],
            });
        }
    };

    const removeProofDocument = (detailIndex: number, document: string) => {
        const detail = editedConfig.key_details[detailIndex];
        updateKeyDetail(detailIndex, {
            valid_proof_documents: detail.valid_proof_documents.filter((d) => d !== document),
        });
    };

    const addFieldToRule = (ruleIndex: number, field: string) => {
        if (!field.trim()) return;
        const rule = editedConfig.rules[ruleIndex];
        if (!rule.fields_involved.includes(field)) {
            updateRule(ruleIndex, {
                fields_involved: [...rule.fields_involved, field],
            });
        }
    };

    const removeFieldFromRule = (ruleIndex: number, field: string) => {
        const rule = editedConfig.rules[ruleIndex];
        updateRule(ruleIndex, {
            fields_involved: rule.fields_involved.filter((f) => f !== field),
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={onCancel} size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {isNew ? 'Create' : 'Edit'} Configuration
                            </h1>
                            <p className="text-slate-600 text-sm mt-1">
                                Define validation rules and field requirements
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Configuration
                        </Button>
                    </div>
                </div>

                {errors.length > 0 && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <ul className="list-disc list-inside space-y-1">
                                {errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="mb-6 border-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Configure the application type and metadata</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="app-type">Application Type *</Label>
                                <Input
                                    id="app-type"
                                    value={editedConfig.application_type}
                                    onChange={(e) =>
                                        setEditedConfig({ ...editedConfig, application_type: e.target.value })
                                    }
                                    placeholder="e.g., Income Certificate, EWS Certificate"
                                    className="mt-1"
                                    disabled={!isNew}
                                />
                                {!isNew && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Application type cannot be changed after creation
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="fields" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="fields">
                            Key Details ({editedConfig.key_details.length})
                        </TabsTrigger>
                        <TabsTrigger value="rules">
                            Validation Rules ({editedConfig.rules.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="fields" className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-600">
                                Define the fields that need to be extracted and validated
                            </p>
                            <Button onClick={addKeyDetail} size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Field
                            </Button>
                        </div>

                        {editedConfig.key_details.map((detail, index) => (
                            <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Field #{index + 1}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeKeyDetail(index)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Field Path *</Label>
                                            <Input
                                                value={detail.field_path}
                                                onChange={(e) => updateKeyDetail(index, { field_path: e.target.value })}
                                                placeholder="e.g., applicant_name"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Display Name *</Label>
                                            <Input
                                                value={detail.display_name}
                                                onChange={(e) => updateKeyDetail(index, { display_name: e.target.value })}
                                                placeholder="e.g., Applicant Name"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Description</Label>
                                        <Textarea
                                            value={detail.description}
                                            onChange={(e) => updateKeyDetail(index, { description: e.target.value })}
                                            placeholder="Describe what this field represents"
                                            className="mt-1"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={detail.is_mandatory}
                                            onCheckedChange={(checked) => updateKeyDetail(index, { is_mandatory: checked })}
                                        />
                                        <Label>Mandatory Field</Label>
                                    </div>

                                    <div>
                                        <Label>Valid Proof Documents</Label>
                                        <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                                            {detail.valid_proof_documents.map((doc) => (
                                                <Badge key={doc} variant="secondary" className="gap-1">
                                                    {doc}
                                                    <X
                                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                                        onClick={() => removeProofDocument(index, doc)}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add proof document (e.g., Aadhaar Card)"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addProofDocument(index, e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    addProofDocument(index, input.value);
                                                    input.value = '';
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {editedConfig.key_details.length === 0 && (
                            <Card className="border-2 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <p className="text-slate-500 mb-4">No fields defined yet</p>
                                    <Button onClick={addKeyDetail} variant="outline">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Field
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="rules" className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-slate-600">
                                Define validation rules that apply to the extracted fields
                            </p>
                            <Button onClick={addRule} size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Rule
                            </Button>
                        </div>

                        {editedConfig.rules.map((rule, index) => (
                            <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Rule #{index + 1}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeRule(index)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Rule ID *</Label>
                                            <Input
                                                value={rule.rule_id}
                                                onChange={(e) => updateRule(index, { rule_id: e.target.value })}
                                                placeholder="e.g., name_consistency"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Rule Type</Label>
                                            <Input
                                                value={rule.rule_type}
                                                onChange={(e) => updateRule(index, { rule_type: e.target.value })}
                                                placeholder="e.g., consistency, format, logic"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Description *</Label>
                                        <Textarea
                                            value={rule.description}
                                            onChange={(e) => updateRule(index, { description: e.target.value })}
                                            placeholder="Describe what this rule validates"
                                            className="mt-1"
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <Label>Severity</Label>
                                        <Select
                                            value={rule.severity}
                                            onValueChange={(value: 'error' | 'warning' | 'info') =>
                                                updateRule(index, { severity: value })
                                            }
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="error">Error</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="info">Info</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Fields Involved *</Label>
                                        <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                                            {rule.fields_involved.map((field) => (
                                                <Badge key={field} variant="secondary" className="gap-1">
                                                    {field}
                                                    <X
                                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                                        onClick={() => removeFieldFromRule(index, field)}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Select
                                                onValueChange={(value) => {
                                                    addFieldToRule(index, value);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a field" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {editedConfig.key_details.map((detail) => (
                                                        <SelectItem key={detail.field_path} value={detail.field_path}>
                                                            {detail.display_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {editedConfig.rules.length === 0 && (
                            <Card className="border-2 border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <p className="text-slate-500 mb-4">No validation rules defined yet</p>
                                    <Button onClick={addRule} variant="outline">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Rule
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
