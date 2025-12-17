import { useState } from 'react';
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
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">New Schema</h1>
          <Button variant="ghost" onClick={() => navigate('/schemas')}>Cancel</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  placeholder="Invoice, Receipt, Contract..."
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What data does this schema extract?"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Fields</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addField} className="h-7 text-xs">
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Field {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="h-6 text-xs text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        placeholder="field_name"
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={field.type} onValueChange={(value) => updateField(field.id, { type: value })}>
                        <SelectTrigger className="h-8">
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
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={field.description}
                      onChange={(e) => updateField(field.id, { description: e.target.value })}
                      placeholder="What should be extracted?"
                      className="h-8"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, { required: e.target.checked })}
                      className="rounded border-border"
                    />
                    Required field
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/schemas')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Schema'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
