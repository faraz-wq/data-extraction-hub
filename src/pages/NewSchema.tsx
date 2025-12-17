import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';

interface Field {
  id: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export default function NewSchema() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemaName, setSchemaName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Field[]>([
    { id: crypto.randomUUID(), name: '', type: 'string', description: '', required: true }
  ]);
  const [exampleFile, setExampleFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setExampleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      handleFileChange(file);
    }
  };

  const removeFile = () => {
    setExampleFile(null);
  };

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), name: '', type: 'string', description: '', required: false }]);
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter(f => f.id !== id));
    }
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schemaName.trim()) {
      toast({ title: 'Error', description: 'Schema name is required', variant: 'destructive' });
      return;
    }

    if (fields.some(f => !f.name.trim())) {
      toast({ title: 'Error', description: 'All fields must have a name', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const schemaId = `sch_${schemaName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      await api.createSchema({
        schema_id: schemaId,
        schema_name: schemaName,
        description,
        fields: fields.map(({ name, type, description, required }) => ({ name, type, description, required }))
      });
      toast({ title: 'Schema created', description: `${schemaName} has been created successfully.` });
      navigate('/schemas');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create schema', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Left: Form */}
        <div className="w-1/2 overflow-auto p-2 space-y-2 border-r">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold">New Schema</h1>
            <Button variant="ghost" size="sm" onClick={() => navigate('/schemas')} className="h-7 text-xs">Cancel</Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-medium">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="space-y-0.5">
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input
                    id="name"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    placeholder="Invoice, Receipt, Contract..."
                    className="h-7 text-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What data does this schema extract?"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium">Fields</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addField} className="h-6 text-xs px-2">
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-2 border rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Field {index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                          className="h-5 text-xs text-destructive hover:text-destructive px-1"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          placeholder="field_name"
                          className="h-7 text-sm"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-xs">Type</Label>
                        <Select value={field.type} onValueChange={(value) => updateField(field.id, { type: value })}>
                          <SelectTrigger className="h-7 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={field.description}
                        onChange={(e) => updateField(field.id, { description: e.target.value })}
                        placeholder="What should be extracted?"
                        className="h-7 text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded border-border"
                      />
                      Required
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/schemas')} className="h-7 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-xs">
                {isSubmitting ? 'Creating...' : 'Create Schema'}
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Document Upload & Preview */}
        <div 
          className={`w-1/2 h-full relative ${isDragging ? 'bg-primary/5' : 'bg-muted/30'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="hidden"
          />
          {exampleFile ? (
            <>
              <PDFViewerWithBoxes
                file={exampleFile}
                boundingBoxes={{}}
                highlightedField={null}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeFile}
                className="absolute top-2 right-2 h-6 text-xs z-10"
              >
                Remove
              </Button>
            </>
          ) : (
            <div 
              className={`flex flex-col items-center justify-center h-full cursor-pointer border-2 border-dashed m-2 rounded transition-colors ${isDragging ? 'border-primary' : 'border-border'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <p className="text-sm text-muted-foreground">Drop document here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <p className="text-xs text-muted-foreground/60 mt-2">PDF, PNG, JPG</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
