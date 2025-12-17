import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";

interface SchemaField {
  name: string;
  type: string;
  description: string;
}

const EditSchema = () => {
  const navigate = useNavigate();
  const { schemaId } = useParams<{ schemaId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<SchemaField[]>([]);

  useEffect(() => {
    const loadSchema = async () => {
      if (!schemaId) return;
      try {
        const schemas = await api.getSchemas();
        const schema = schemas.find(s => s.schema_id === schemaId);
        if (schema) {
          setName(schema.schema_name);
          setDescription(schema.description || "");
          setFields(schema.fields || []);
        } else {
          toast({ title: "Error", description: "Schema not found", variant: "destructive" });
          navigate("/schemas");
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to load schema", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadSchema();
  }, [schemaId, navigate, toast]);

  const addField = () => {
    setFields([...fields, { name: "", type: "string", description: "" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, value: string) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemaId) return;

    if (!name.trim()) {
      toast({ title: "Error", description: "Schema name is required", variant: "destructive" });
      return;
    }

    if (fields.length === 0) {
      toast({ title: "Error", description: "At least one field is required", variant: "destructive" });
      return;
    }

    const invalidFields = fields.filter(f => !f.name.trim());
    if (invalidFields.length > 0) {
      toast({ title: "Error", description: "All fields must have a name", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateSchema(schemaId, { schema_name: name, description, fields });
      toast({ title: "Success", description: "Schema updated successfully" });
      navigate("/schemas");
    } catch (error) {
      toast({ title: "Error", description: "Failed to update schema", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <button
          onClick={() => navigate("/schemas")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Schemas
        </button>

        <h1 className="text-xl font-semibold mb-4">Edit Schema</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Invoice, Receipt, Contract..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this schema extracts..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fields</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="h-3 w-3 mr-1" />
                Add Field
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded">
                No fields yet. Add a field to define what to extract.
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start p-2 border rounded bg-muted/30">
                    <div className="flex-1 space-y-1.5">
                      <Input
                        placeholder="Field name"
                        value={field.name}
                        onChange={(e) => updateField(index, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Select value={field.type} onValueChange={(v) => updateField(index, "type", v)}>
                          <SelectTrigger className="h-8 text-sm w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Description (optional)"
                          value={field.description}
                          onChange={(e) => updateField(index, "description", e.target.value)}
                          className="h-8 text-sm flex-1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/schemas")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditSchema;
