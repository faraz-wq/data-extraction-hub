import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, Schema } from '@/lib/api';
import { Database, Plus, Search, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

// Mock data
const mockSchemas: Schema[] = [
  { schema_id: 'sch_invoice', schema_name: 'Invoice', description: 'Extract invoice data including vendor, amounts, and line items', fields: [{ name: 'vendor_name', type: 'string', description: 'Vendor name', required: true }, { name: 'total_amount', type: 'number', description: 'Total amount', required: true }, { name: 'date', type: 'date', description: 'Invoice date', required: true }] },
  { schema_id: 'sch_receipt', schema_name: 'Receipt', description: 'Extract receipt data from retail purchases', fields: [{ name: 'store_name', type: 'string', description: 'Store name', required: true }, { name: 'total', type: 'number', description: 'Total', required: true }] },
  { schema_id: 'sch_contract', schema_name: 'Contract', description: 'Extract key terms from legal contracts', fields: [{ name: 'parties', type: 'array', description: 'Contract parties', required: true }, { name: 'effective_date', type: 'date', description: 'Start date', required: true }, { name: 'value', type: 'number', description: 'Contract value', required: false }] },
  { schema_id: 'sch_id', schema_name: 'ID Document', description: 'Extract data from identity documents', fields: [{ name: 'full_name', type: 'string', description: 'Full name', required: true }, { name: 'id_number', type: 'string', description: 'ID number', required: true }, { name: 'expiry_date', type: 'date', description: 'Expiry date', required: true }] },
];

export default function Schemas() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteSchema, setDeleteSchema] = useState<Schema | null>(null);

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const data = await api.getSchemas();
        setSchemas(data);
      } catch {
        setSchemas(mockSchemas);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchemas();
  }, []);

  const handleDelete = async () => {
    if (!deleteSchema) return;
    try {
      await api.deleteSchema(deleteSchema.schema_id);
      setSchemas(schemas.filter((s) => s.schema_id !== deleteSchema.schema_id));
      toast({ title: 'Schema deleted', description: `${deleteSchema.schema_name} has been removed.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete schema', variant: 'destructive' });
    }
    setDeleteSchema(null);
  };

  const filteredSchemas = schemas.filter(
    (schema) =>
      schema.schema_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schema.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schemas</h1>
            <p className="text-muted-foreground mt-1">Define extraction templates for your documents</p>
          </div>
          <div className="flex gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search schemas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button asChild variant="glow">
              <Link to="/schemas/new">
                <Plus className="w-4 h-4" />
                New Schema
              </Link>
            </Button>
          </div>
        </div>

        {/* Schemas Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <div className="h-5 w-32 shimmer rounded" />
                  <div className="h-4 w-full shimmer rounded" />
                  <div className="h-4 w-2/3 shimmer rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredSchemas.length === 0 ? (
          <Card variant="glass" className="p-12 text-center">
            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No schemas found</h3>
            <p className="text-muted-foreground mb-4">Create your first schema to start extracting data</p>
            <Button asChild variant="glow">
              <Link to="/schemas/new">
                <Plus className="w-4 h-4" />
                Create Schema
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemas.map((schema, index) => (
              <Card
                key={schema.schema_id}
                variant="interactive"
                className={cn('group animate-fade-in')}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link to={`/schemas/${schema.schema_id}/edit`}>
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteSchema(schema);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{schema.schema_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {schema.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {schema.fields.length} fields
                    </span>
                    <Link
                      to={`/schemas/${schema.schema_id}/edit`}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      View details
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSchema} onOpenChange={() => setDeleteSchema(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schema</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteSchema?.schema_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
