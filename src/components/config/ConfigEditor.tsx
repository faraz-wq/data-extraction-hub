import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { X, Plus, Save, ArrowLeft, AlertCircle, Copy, Zap, Search, FileUp, Trash2, CheckCircle2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable Field Card Component (must be separate to use hooks properly)
interface SortableFieldCardProps {
    detail: KeyDetail;
    index: number;
    selectedFields: Set<string>;
    toggleFieldSelection: (fieldPath: string) => void;
    handleFieldNameChange: (index: number, name: string) => void;
    duplicateKeyDetail: (index: number) => void;
    removeKeyDetail: (index: number) => void;
    updateKeyDetail: (index: number, updates: Partial<KeyDetail>) => void;
    removeProofDocument: (index: number, doc: string) => void;
    addProofDocument: (index: number, doc: string) => void;
    COMMON_DOCUMENTS: string[];
    collapsedSections: Set<string>;
    toggleSection: (sectionId: string) => void;
    fieldRules: ValidationRule[];
    addRuleForField: (fieldPath: string) => void;
    updateRule: (ruleIndex: number, updates: Partial<ValidationRule>) => void;
    removeRule: (ruleIndex: number) => void;
    allRules: ValidationRule[];
}

function SortableFieldCard({
    detail,
    index,
    selectedFields,
    toggleFieldSelection,
    handleFieldNameChange,
    duplicateKeyDetail,
    removeKeyDetail,
    updateKeyDetail,
    removeProofDocument,
    addProofDocument,
    COMMON_DOCUMENTS,
    collapsedSections,
    toggleSection,
    fieldRules,
    addRuleForField,
    updateRule,
    removeRule,
    allRules,
}: SortableFieldCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: detail.field_path });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className={`rounded-xl border shadow-none bg-background overflow-hidden transition-all duration-200 ${selectedFields.has(detail.field_path) ? 'ring-1 ring-primary border-primary bg-primary/[0.02]' : ''}`}>
                <CardContent className="p-0 flex overflow-hidden">
                    {/* Enhanced Drag Handle - Larger Hit Area */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="w-10 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary hover:bg-primary/5 border-r border-border/50 transition-colors group/drag"
                    >
                        <GripVertical className="w-4 h-4 group-hover/drag:scale-110 transition-transform" />
                    </div>

                    <div className="flex-1 p-3 space-y-3 relative">
                        {/* Invisible Click Overlay for Selection - only active on non-input areas */}
                        <div
                            className="absolute inset-0 z-0 cursor-pointer"
                            onClick={(e) => {
                                // Only toggle if we didn't click an input, button, or link
                                const target = e.target as HTMLElement;
                                if (!target.closest('input, button, textarea, label, [role="button"], .interactive-zone')) {
                                    toggleFieldSelection(detail.field_path);
                                }
                            }}
                        />

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="flex items-center gap-2 pr-2 border-r interactive-zone">
                                <Checkbox
                                    checked={selectedFields.has(detail.field_path)}
                                    onCheckedChange={() => toggleFieldSelection(detail.field_path)}
                                    className="h-4 w-4 rounded-sm border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase py-0.5 px-1.5 bg-muted rounded">#{index + 1}</span>
                            </div>

                            <div className="flex-1">
                                <Input
                                    autoFocus={detail.display_name === '' && detail.field_path.startsWith('new_field_')}
                                    value={detail.display_name}
                                    onChange={(e) => handleFieldNameChange(index, e.target.value)}
                                    placeholder="e.g., Applicant Name"
                                    className="h-9 text-sm font-semibold border-none bg-transparent hover:bg-muted/30 focus-visible:bg-muted/50 focus-visible:ring-0 px-2 shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-1 ml-auto pl-2 border-l">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => duplicateKeyDetail(index)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeKeyDetail(index)}
                                    className="h-8 w-8 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/5"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-3">

                            {/* Collapsible Description - Forgiving Hit Area */}
                            <Collapsible open={!collapsedSections.has(`desc_${index}`)}>
                                <CollapsibleTrigger
                                    onClick={() => toggleSection(`desc_${index}`)}
                                    className="flex items-center gap-2 w-full text-left hover:bg-muted/30 p-1 -ml-1 rounded-md transition-all group"
                                >
                                    <div className="w-4 flex items-center justify-center">
                                        {collapsedSections.has(`desc_${index}`) ? (
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary" />
                                        )}
                                    </div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 cursor-pointer select-none">Description</Label>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-1 mt-1 pl-6">
                                    <Input
                                        value={detail.description}
                                        onChange={(e) => updateKeyDetail(index, { description: e.target.value })}
                                        placeholder="Brief description..."
                                        className="h-9 text-xs rounded-md border-border/40 focus:border-primary/40"
                                    />
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Mandatory Toggle & Proof Docs */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center space-x-2 bg-muted/20 hover:bg-muted/40 px-2 py-1.5 rounded-lg border border-transparent hover:border-border/50 transition-all cursor-pointer select-none"
                                    onClick={() => updateKeyDetail(index, { is_mandatory: !detail.is_mandatory })}>
                                    <Switch
                                        checked={detail.is_mandatory}
                                        onCheckedChange={(checked) => updateKeyDetail(index, { is_mandatory: checked })}
                                        className="scale-75 origin-left"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <Label className="text-xs font-medium cursor-pointer">Mandatory</Label>
                                </div>

                                {/* Collapsible Proof Documents - Forgiving Hit Area */}
                                <Collapsible open={!collapsedSections.has(`docs_${index}`)} className="flex-1 min-w-0">
                                    <div className="flex gap-2 items-center">
                                        <CollapsibleTrigger
                                            onClick={() => toggleSection(`docs_${index}`)}
                                            className="flex items-center gap-2 hover:bg-muted/30 p-1 rounded-md transition-all group shrink-0"
                                        >
                                            <div className="w-4 flex items-center justify-center">
                                                {collapsedSections.has(`docs_${index}`) ? (
                                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary" />
                                                ) : (
                                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary" />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer select-none whitespace-nowrap">
                                                Docs {detail.valid_proof_documents.length > 0 && (
                                                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[8px] bg-primary/10 text-primary border-none">
                                                        {detail.valid_proof_documents.length}
                                                    </Badge>
                                                )}
                                            </span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="flex flex-wrap gap-2 pt-0.5">
                                            {detail.valid_proof_documents.map((doc) => (
                                                <Badge key={doc} variant="secondary" className="h-6 text-[10px] px-2 bg-muted/50 hover:bg-muted font-normal border-none group/badge transition-colors">
                                                    {doc}
                                                    <X
                                                        className="w-3 h-3 ml-1.5 cursor-pointer opacity-40 hover:opacity-100 hover:text-destructive transition-all"
                                                        onClick={(e) => { e.stopPropagation(); removeProofDocument(index, doc); }}
                                                    />
                                                </Badge>
                                            ))}
                                            <div className="flex flex-wrap gap-1 ml-1 border-l pl-2 border-border/50">
                                                {COMMON_DOCUMENTS.filter(doc => !detail.valid_proof_documents.includes(doc)).slice(0, 3).map(doc => (
                                                    <button
                                                        key={doc}
                                                        type="button"
                                                        onClick={() => addProofDocument(index, doc)}
                                                        className="text-[10px] h-6 px-2 rounded-full border border-border/60 bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all italic whitespace-nowrap"
                                                    >
                                                        + {doc}
                                                    </button>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            </div>

                            {/* Collapsible Validation Rules - Forgiving Hit Area */}
                            <Collapsible open={!collapsedSections.has(`rules_${index}`)} className="mt-2 pt-2 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <CollapsibleTrigger
                                        onClick={() => toggleSection(`rules_${index}`)}
                                        className="flex items-center gap-2 hover:bg-muted/30 p-1.5 -ml-1.5 rounded-md transition-all group flex-1"
                                    >
                                        <div className="w-4 flex items-center justify-center">
                                            {collapsedSections.has(`rules_${index}`) ? (
                                                <ChevronRight className="w-3.5 h-3.5 text-primary/70" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5 text-primary/70" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-primary/70" />
                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase cursor-pointer select-none">
                                                Validation Rules
                                                {fieldRules.length > 0 && (
                                                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[8px] bg-primary/10 text-primary border-none">
                                                        {fieldRules.length}
                                                    </Badge>
                                                )}
                                            </h4>
                                        </div>
                                    </CollapsibleTrigger>
                                    <Button
                                        onClick={() => addRuleForField(detail.field_path)}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-[10px] px-2 text-primary hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all shrink-0"
                                        disabled={!detail.field_path}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        Add Rule
                                    </Button>
                                </div>

                                <CollapsibleContent>
                                    <div className="space-y-2">
                                        {fieldRules.map((rule) => {
                                            const ruleIndex = allRules.findIndex(r => r === rule);
                                            return (
                                                <div key={ruleIndex} className="bg-muted/10 rounded-lg p-2 border border-muted/20 relative group">
                                                    <Textarea
                                                        value={rule.description}
                                                        onChange={(e) => updateRule(ruleIndex, { description: e.target.value })}
                                                        placeholder="Describe the validation rule in plain text (e.g., 'Must be exactly 12 digits')..."
                                                        className="text-xs rounded-md min-h-[50px] py-1.5 pr-8 resize-none"
                                                        rows={2}
                                                    />
                                                    <button
                                                        onClick={() => removeRule(ruleIndex)}
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {fieldRules.length === 0 && (
                                        <div className="col-span-2 py-3 text-center border border-dashed rounded-lg bg-background/30">
                                            <p className="text-[10px] text-muted-foreground opacity-60 uppercase tracking-widest">No validation logic</p>
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function ConfigEditor({ config, isNew, onSave, onCancel }: ConfigEditorProps) {
    const [editedConfig, setEditedConfig] = useState<ValidationConfig>(config);
    const [errors, setErrors] = useState<string[]>([]);

    // New UX State
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
    const [batchImportValue, setBatchImportValue] = useState("");

    // Progressive Disclosure State
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [isCompactMode, setIsCompactMode] = useState(false);

    // Global Keyboard Shortcuts
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K: Command Palette
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCommandPaletteOpen((open) => !open);
            }
            // Cmd/Ctrl + S: Save
            if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
            }
            // Cmd/Ctrl + A: Select All (when not in input)
            if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
                const target = e.target as HTMLElement;
                if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    setSelectedFields(new Set(editedConfig.key_details.map(d => d.field_path)));
                }
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [editedConfig.key_details]);

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
        const tempId = `new_field_${Date.now()}`;
        setEditedConfig({
            ...editedConfig,
            key_details: [
                ...editedConfig.key_details,
                {
                    field_path: tempId,
                    display_name: '',
                    description: '',
                    is_mandatory: false,
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

    const duplicateRule = (index: number) => {
        const rule = { ...editedConfig.rules[index] };
        setEditedConfig({
            ...editedConfig,
            rules: [...editedConfig.rules, rule],
        });
    };

    const addRuleForField = (fieldPath: string, ruleType: string = 'format') => {
        const severity = getDefaultRuleSeverity(ruleType);
        const ruleId = `${fieldPath}_rule_${Date.now()}`; // Auto-generate unique ID
        setEditedConfig({
            ...editedConfig,
            rules: [
                ...editedConfig.rules,
                {
                    rule_id: ruleId,
                    description: '',
                    severity: severity,
                    rule_type: ruleType,
                    fields_involved: [fieldPath],
                },
            ],
        });
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

    // Progressive Disclosure Helpers
    const toggleSection = (sectionId: string) => {
        const newCollapsed = new Set(collapsedSections);
        if (newCollapsed.has(sectionId)) {
            newCollapsed.delete(sectionId);
        } else {
            newCollapsed.add(sectionId);
        }
        setCollapsedSections(newCollapsed);
    };

    const toggleCompactMode = () => {
        if (!isCompactMode) {
            // Collapse all sections
            const allSections = new Set<string>();
            editedConfig.key_details.forEach((_, index) => {
                allSections.add(`desc_${index}`);
                allSections.add(`rules_${index}`);
                allSections.add(`docs_${index}`);
            });
            setCollapsedSections(allSections);
        } else {
            // Expand all sections
            setCollapsedSections(new Set());
        }
        setIsCompactMode(!isCompactMode);
    };

    // Drag & Drop Setup
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = editedConfig.key_details.findIndex(k => k.field_path === active.id);
            const newIndex = editedConfig.key_details.findIndex(k => k.field_path === over.id);

            const reordered = arrayMove(editedConfig.key_details, oldIndex, newIndex);
            setEditedConfig({ ...editedConfig, key_details: reordered });
        }
    };

    const COMMON_DOCUMENTS = [
        "Aadhaar Card", "Voter ID", "PAN Card", "Passport", "Driving License",
        "Ration Card", "Certificate", "Application Form", "Utility Bill"
    ];

    const FIELD_TEMPLATES = [
        {
            name: "Full Name",
            path: "full_name",
            desc: "Full name of the person",
            rules: [
                { id: "format", desc: "Should only contain letters and spaces", type: "format" }
            ]
        },
        {
            name: "Date of Birth",
            path: "dob",
            desc: "Date of birth in DD/MM/YYYY",
            rules: [
                { id: "valid_date", desc: "Must be a valid date in DD/MM/YYYY format", type: "format" },
                { id: "age_check", desc: "Individual must be at least 18 years old", type: "logic" }
            ]
        },
        {
            name: "Gender",
            path: "gender",
            desc: "Male/Female/Other",
            rules: [
                { id: "allowed_values", desc: "Must be one of: Male, Female, Other", type: "format" }
            ]
        },
        {
            name: "Aadhaar Number",
            path: "aadhaar_no",
            desc: "12-digit Aadhaar number",
            rules: [
                { id: "length", desc: "Must be exactly 12 digits", type: "format" },
                { id: "is_numeric", desc: "Must contain only numbers", type: "format" }
            ]
        },
        {
            name: "Address",
            path: "address",
            desc: "Permanent address as per document",
            rules: [
                { id: "min_length", desc: "Address must be at least 10 characters long", type: "format" }
            ]
        },
        {
            name: "Mobile Number",
            path: "mobile_no",
            desc: "10-digit contact number",
            rules: [
                { id: "format", desc: "Must be a valid 10-digit Indian mobile number", type: "format" }
            ]
        },
    ];

    const formatFieldPathToName = (path: string) => {
        return path
            .split(/[._\s]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Smart defaults helper functions
    const shouldBeAutoMandatory = (fieldName: string): boolean => {
        const mandatoryKeywords = ['name', 'dob', 'date_of_birth', 'birth', 'id', 'number', 'aadhaar', 'pan', 'passport', 'phone', 'mobile', 'email', 'address'];
        const lowerName = fieldName.toLowerCase();
        return mandatoryKeywords.some(keyword => lowerName.includes(keyword));
    };

    const suggestProofDocuments = (fieldName: string): string[] => {
        const lowerName = fieldName.toLowerCase();
        const suggestions: string[] = [];

        if (lowerName.includes('aadhaar')) suggestions.push('Aadhaar Card');
        if (lowerName.includes('pan')) suggestions.push('PAN Card');
        if (lowerName.includes('passport')) suggestions.push('Passport');
        if (lowerName.includes('voter')) suggestions.push('Voter ID');
        if (lowerName.includes('driving') || lowerName.includes('license')) suggestions.push('Driving License');
        if (lowerName.includes('address')) suggestions.push('Utility Bill', 'Ration Card');
        if (lowerName.includes('income') || lowerName.includes('salary')) suggestions.push('Certificate');
        if (lowerName.includes('age') || lowerName.includes('dob') || lowerName.includes('birth')) suggestions.push('Aadhaar Card', 'Passport');

        return [...new Set(suggestions)];
    };

    const generateSmartDescription = (fieldName: string): string => {
        const lowerName = fieldName.toLowerCase();

        if (lowerName.includes('name')) return 'Full legal name as per official documents';
        if (lowerName.includes('dob') || lowerName.includes('birth')) return 'Date of birth in DD/MM/YYYY format';
        if (lowerName.includes('age')) return 'Age in years';
        if (lowerName.includes('gender')) return 'Gender (Male/Female/Other)';
        if (lowerName.includes('aadhaar')) return '12-digit Aadhaar number';
        if (lowerName.includes('pan')) return '10-character PAN number (e.g., ABCDE1234F)';
        if (lowerName.includes('passport')) return 'Passport number as per passport document';
        if (lowerName.includes('phone') || lowerName.includes('mobile')) return '10-digit mobile number';
        if (lowerName.includes('email')) return 'Valid email address';
        if (lowerName.includes('address')) return 'Complete residential address';
        if (lowerName.includes('pincode') || lowerName.includes('zip')) return '6-digit PIN code';

        return '';
    };

    const getDefaultRuleSeverity = (ruleType: string): 'error' | 'warning' | 'info' => {
        switch (ruleType) {
            case 'format':
            case 'existence':
                return 'error';
            case 'consistency':
            case 'logic':
                return 'warning';
            case 'proof':
            default:
                return 'info';
        }
    };

    const addFieldFromTemplate = (template: typeof FIELD_TEMPLATES[0]) => {
        let path = template.path;
        // Ensure path is unique
        if (editedConfig.key_details.some(k => k.field_path === path)) {
            path = `${path}_${Date.now()}`;
        }

        const newRules = template.rules ? template.rules.map(r => ({
            rule_id: `${path}_${r.id}`,
            description: r.desc,
            severity: 'error' as const,
            rule_type: r.type,
            fields_involved: [path]
        })) : [];

        setEditedConfig({
            ...editedConfig,
            key_details: [
                ...editedConfig.key_details,
                {
                    field_path: path,
                    display_name: template.name,
                    description: template.desc,
                    is_mandatory: true,
                    valid_proof_documents: [],
                },
            ],
            rules: [
                ...editedConfig.rules,
                ...newRules
            ]
        });
    };

    const duplicateKeyDetail = (index: number) => {
        const originalDetail = editedConfig.key_details[index];
        const newPath = `${originalDetail.field_path}_copy`;
        const newDetail = {
            ...originalDetail,
            field_path: newPath,
            display_name: `${originalDetail.display_name} (Copy)`
        };

        // Deep Duplication: Find and clone rules associated with this field
        const associatedRules = editedConfig.rules.filter(r => r.fields_involved.includes(originalDetail.field_path));
        const clonedRules = associatedRules.map(rule => ({
            ...rule,
            rule_id: `${rule.rule_id}_copy_${Math.floor(Math.random() * 1000)}`,
            fields_involved: rule.fields_involved.map(f => f === originalDetail.field_path ? newPath : f)
        }));

        setEditedConfig({
            ...editedConfig,
            key_details: [...editedConfig.key_details, newDetail],
            rules: [...editedConfig.rules, ...clonedRules]
        });
    };

    const removeFieldFromRule = (ruleIndex: number, field: string) => {
        const rule = editedConfig.rules[ruleIndex];
        updateRule(ruleIndex, {
            fields_involved: rule.fields_involved.filter((f) => f !== field),
        });
    };
    const handleFieldNameChange = (index: number, name: string) => {
        const oldDetail = editedConfig.key_details[index];
        const oldPath = oldDetail.field_path;
        let newPath = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

        // Ensure path isn't empty (dnd-kit needs unique IDs)
        if (!newPath) {
            newPath = oldPath.startsWith('new_field_') ? oldPath : `new_field_${Date.now()}`;
        }

        // Smart defaults: auto-populate description and proof docs if empty
        const isNewField = !oldDetail.display_name;
        const smartDescription = isNewField && !oldDetail.description ? generateSmartDescription(name) : oldDetail.description;
        const smartProofDocs = isNewField && oldDetail.valid_proof_documents.length === 0 ? suggestProofDocuments(name) : oldDetail.valid_proof_documents;
        const smartMandatory = isNewField ? shouldBeAutoMandatory(name) : oldDetail.is_mandatory;

        const newDetails = [...editedConfig.key_details];
        newDetails[index] = {
            ...oldDetail,
            display_name: name,
            field_path: newPath,
            description: smartDescription,
            valid_proof_documents: smartProofDocs,
            is_mandatory: smartMandatory
        };

        // Update any associated rules to reflect the path change
        const newRules = editedConfig.rules.map(rule => ({
            ...rule,
            fields_involved: rule.fields_involved.map(f => f === oldPath ? newPath : f)
        }));

        setEditedConfig({
            ...editedConfig,
            key_details: newDetails,
            rules: newRules
        });
    };

    const handleBatchImport = () => {
        const lines = batchImportValue.split('\n').map(l => l.trim()).filter(Boolean);
        const newKeys: KeyDetail[] = [];
        const newRules: ValidationRule[] = [];

        lines.forEach(line => {
            const parts = line.split('|').map(p => p.trim());
            const name = parts[0];
            if (!name) return;

            const path = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
            const docs = parts[1] ? parts[1].split(',').map(d => d.trim()).filter(Boolean) : [];
            const ruleDesc = parts[2];

            newKeys.push({
                field_path: path,
                display_name: name,
                description: generateSmartDescription(name),
                is_mandatory: true,
                valid_proof_documents: docs
            });

            if (ruleDesc) {
                newRules.push({
                    rule_id: `${path}_rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    description: ruleDesc,
                    severity: 'error',
                    rule_type: 'format',
                    fields_involved: [path]
                });
            }
        });

        setEditedConfig(prev => ({
            ...prev,
            key_details: [...prev.key_details, ...newKeys],
            rules: [...prev.rules, ...newRules]
        }));
        setBatchImportValue("");
        setIsBatchImportOpen(false);
    };

    const toggleFieldSelection = (fieldPath: string) => {
        const newSelection = new Set(selectedFields);
        if (newSelection.has(fieldPath)) {
            newSelection.delete(fieldPath);
        } else {
            newSelection.add(fieldPath);
        }
        setSelectedFields(newSelection);
    };

    const batchApplyDocs = (doc: string) => {
        const newDetails = editedConfig.key_details.map(detail => {
            if (selectedFields.has(detail.field_path)) {
                if (!detail.valid_proof_documents.includes(doc)) {
                    return {
                        ...detail,
                        valid_proof_documents: [...detail.valid_proof_documents, doc]
                    };
                }
            }
            return detail;
        });
        setEditedConfig(prev => ({ ...prev, key_details: newDetails }));
    };

    const batchApplyMandatory = (mandatory: boolean) => {
        const newDetails = editedConfig.key_details.map(detail => {
            if (selectedFields.has(detail.field_path)) {
                return { ...detail, is_mandatory: mandatory };
            }
            return detail;
        });
        setEditedConfig(prev => ({ ...prev, key_details: newDetails }));
    };

    const batchDelete = () => {
        const remainingDetails = editedConfig.key_details.filter(d => !selectedFields.has(d.field_path));
        const remainingRules = editedConfig.rules.filter(r =>
            !r.fields_involved.some(f => selectedFields.has(f))
        );
        setEditedConfig(prev => ({
            ...prev,
            key_details: remainingDetails,
            rules: remainingRules
        }));
        setSelectedFields(new Set());
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto px-4">
                {/* Command Palette */}
                <CommandDialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Quick Actions">
                            <CommandItem onSelect={() => { addKeyDetail(); setIsCommandPaletteOpen(false); }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Blank Field
                            </CommandItem>
                            <CommandItem onSelect={() => { setIsBatchImportOpen(true); setIsCommandPaletteOpen(false); }}>
                                <FileUp className="mr-2 h-4 w-4" />
                                Batch Import Fields
                            </CommandItem>
                            <CommandItem onSelect={() => { handleSave(); setIsCommandPaletteOpen(false); }}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Configuration
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Field Templates">
                            {FIELD_TEMPLATES.map(template => (
                                <CommandItem key={template.path} onSelect={() => { addFieldFromTemplate(template); setIsCommandPaletteOpen(false); }}>
                                    <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                                    Add {template.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </CommandDialog>

                {/* Batch Import Dialog */}
                <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle>Batch Import Fields</DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter field details using the format:<br />
                                <code className="bg-muted px-1 rounded text-[10px] uppercase font-bold text-primary">Name | Proof Docs | Validation Rule</code><br />
                                <span className="text-[10px] mt-1 block italic opacity-70">Example: Aadhaar Number | Aadhaar Card | Must be 12 digits</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Textarea
                                placeholder="Aadhaar Number | Aadhaar Card | Must be 12 digits&#10;Full Name | ID Proof | Should match record&#10;Date of Birth"
                                className="min-h-[400px] text-xs font-mono"
                                value={batchImportValue}
                                onChange={(e) => setBatchImportValue(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsBatchImportOpen(false)}>Cancel</Button>
                            <Button onClick={handleBatchImport}>Import {batchImportValue.split('\n').filter(Boolean).length} Fields</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={onCancel} size="sm" className="h-8 px-2">
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground tracking-tight">
                                {isNew ? 'New' : 'Edit'} Configuration
                            </h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel} size="sm" className="h-8">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} size="sm" className="h-8 bg-primary hover:bg-primary/90">
                            <Save className="w-3.5 h-3.5 mr-1" />
                            Save
                        </Button>
                    </div>
                </div>

                {errors.length > 0 && (
                    <Alert variant="destructive" className="mb-4 py-2 px-3 rounded-lg border-none bg-destructive/10 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            <ul className="list-disc list-inside">
                                {errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4 pb-4">
                    <Card className="rounded-xl border shadow-none bg-muted/5">
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="app-type" className="text-[10px] uppercase font-bold text-muted-foreground">Application Type</Label>
                                    <Input
                                        id="app-type"
                                        value={editedConfig.application_type}
                                        onChange={(e) =>
                                            setEditedConfig({ ...editedConfig, application_type: e.target.value })
                                        }
                                        placeholder="e.g., Income Certificate"
                                        className="h-8 text-sm rounded-md"
                                        disabled={!isNew}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-4">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fields & Rules</h2>
                                {selectedFields.size > 0 && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] py-0 px-2 h-5">
                                        {selectedFields.size} selected
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={toggleCompactMode}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs text-muted-foreground hover:text-primary"
                                >
                                    {isCompactMode ? (
                                        <>
                                            <ChevronDown className="w-3 h-3 mr-1" />
                                            Expand All
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="w-3 h-3 mr-1" />
                                            Compact Mode
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setIsBatchImportOpen(true)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-[10px] text-muted-foreground hover:bg-muted font-bold uppercase"
                                >
                                    <FileUp className="w-3 h-3 mr-1" />
                                    Batch
                                </Button>
                                <Button onClick={addKeyDetail} size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/5">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Field
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1 p-1 bg-muted/20 rounded-lg border border-dashed border-border/60">
                            {FIELD_TEMPLATES.map((template) => (
                                <button
                                    key={template.path}
                                    className="px-1 text-[10px] bg-background border rounded-md hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-1"
                                    onClick={() => addFieldFromTemplate(template)}
                                >
                                    <Plus className="w-2 h-2" />
                                    {template.name}
                                </button>
                            ))}
                        </div>

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={editedConfig.key_details.map(k => k.field_path)} strategy={verticalListSortingStrategy}>
                                {editedConfig.key_details.map((detail, index) => (
                                    <SortableFieldCard
                                        key={detail.field_path}
                                        detail={detail}
                                        index={index}
                                        selectedFields={selectedFields}
                                        toggleFieldSelection={toggleFieldSelection}
                                        handleFieldNameChange={handleFieldNameChange}
                                        duplicateKeyDetail={duplicateKeyDetail}
                                        removeKeyDetail={removeKeyDetail}
                                        updateKeyDetail={updateKeyDetail}
                                        removeProofDocument={removeProofDocument}
                                        addProofDocument={addProofDocument}
                                        COMMON_DOCUMENTS={COMMON_DOCUMENTS}
                                        collapsedSections={collapsedSections}
                                        toggleSection={toggleSection}
                                        fieldRules={editedConfig.rules.filter(r => r.fields_involved.includes(detail.field_path))}
                                        addRuleForField={addRuleForField}
                                        updateRule={updateRule}
                                        removeRule={removeRule}
                                        allRules={editedConfig.rules}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {editedConfig.key_details.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/5">
                                <p className="text-sm text-muted-foreground mb-4">No fields defined</p>
                                <Button onClick={addKeyDetail} variant="outline" size="sm" className="rounded-full px-6">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Field
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Global Rules Section */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-t border-border/50  px-1">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Global Rules</h2>
                            </div>
                            <Button onClick={addRule} size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/5">
                                <Plus className="w-3 h-3 mr-1" />
                                Add Rule
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {editedConfig.rules.filter(r => r.fields_involved.length !== 1 || !editedConfig.key_details.some(k => k.field_path === r.fields_involved[0])).map((rule, index) => {
                                const ruleIndex = editedConfig.rules.findIndex(r => r === rule);
                                return (
                                    <Card key={ruleIndex} className="rounded-xl border shadow-none bg-background overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/5">
                                            <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground">Global Logic</CardTitle>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => duplicateRule(ruleIndex)}
                                                    className="h-6 w-6 p-0 text-muted-foreground"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeRule(ruleIndex)}
                                                    className="h-6 w-6 p-0 text-destructive/50"
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardContent className="p-3 space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Validation Rule</Label>
                                                <Textarea
                                                    value={rule.description}
                                                    onChange={(e) => updateRule(ruleIndex, { description: e.target.value })}
                                                    placeholder="Describe the validation rule in plain text (e.g., 'Date of birth must be before current date')..."
                                                    className="text-xs rounded-md min-h-[60px] py-2"
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Involved Fields</Label>
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    {rule.fields_involved.map((field) => {
                                                        const detail = editedConfig.key_details.find(k => k.field_path === field);
                                                        return (
                                                            <Badge key={field} variant="secondary" className="h-4 text-[8px] px-1 font-normal bg-muted border-none">
                                                                {detail ? detail.display_name : field}
                                                                <X className="w-2.5 h-2.5 ml-0.5" onClick={() => removeFieldFromRule(ruleIndex, field)} />
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                                <Select onValueChange={(v) => addFieldToRule(ruleIndex, v)}>
                                                    <SelectTrigger className="h-6 text-[9px] bg-background">
                                                        <SelectValue placeholder="Add..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {editedConfig.key_details.map(k => (
                                                            <SelectItem key={k.field_path} value={k.field_path} className="text-[10px]">{k.display_name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Batch Action Bar */}
            {
                selectedFields.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-2xl rounded-2xl px-4 py-2 flex items-center gap-4 min-w-[400px]">
                            <div className="flex items-center gap-2 pr-4 border-r">
                                <Checkbox
                                    checked={selectedFields.size === editedConfig.key_details.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedFields(new Set(editedConfig.key_details.map(d => d.field_path)));
                                        } else {
                                            setSelectedFields(new Set());
                                        }
                                    }}
                                    className="h-4 w-4"
                                />
                                <span className="text-xs font-bold whitespace-nowrap">{selectedFields.size} Selected</span>
                            </div>

                            <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-xl">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-4 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary hover:bg-background shadow-none rounded-lg transition-all"
                                    onClick={() => batchApplyMandatory(true)}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                                    Mandatory
                                </Button>

                                <div className="h-4 w-px bg-border/50 mx-1" />

                                <Select onValueChange={batchApplyDocs}>
                                    <SelectTrigger className="h-9 px-4 text-[10px] uppercase font-bold text-muted-foreground border-none shadow-none bg-transparent hover:text-primary hover:bg-background rounded-lg w-auto gap-2 transition-all">
                                        <Plus className="w-4 h-4" />
                                        Add Proof
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMMON_DOCUMENTS.map(doc => (
                                            <SelectItem key={doc} value={doc} className="text-[10px] uppercase font-bold">
                                                {doc}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="h-4 w-px bg-border/50 mx-1" />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-4 text-[10px] uppercase font-bold text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                    onClick={batchDelete}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>

                            <div className="ml-auto pl-4 border-l">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setSelectedFields(new Set())}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </DashboardLayout >
    );
}
