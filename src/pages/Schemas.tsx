import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, Schema } from '@/lib/api';
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Schemas</h1>
            <p className="text-muted-foreground mt-1">Define extraction templates for your documents</p>
          </div>
          <div className="flex gap-3">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search schemas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link to="/schemas/new">New Schema</Link>
            </Button>
          </div>
        </div>

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
          <Card className="p-12 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No schemas found</h3>
            <p className="text-muted-foreground mb-4">Create your first schema to start extracting data</p>
            <Button asChild>
              <Link to="/schemas/new">Create Schema</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemas.map((schema, index) => (
              <Card
                key={schema.schema_id}
                className={cn('group animate-fade-in hover:border-foreground/20 transition-colors')}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{schema.schema_name}</CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/schemas/${schema.schema_id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteSchema(schema);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {schema.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{schema.fields.length} fields</span>
                    <Link
                      to={`/schemas/${schema.schema_id}/edit`}
                      className="hover:text-foreground transition-colors"
                    >
                      View details →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
