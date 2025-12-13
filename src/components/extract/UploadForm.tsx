import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Schema } from '@/lib/api';

const APPLICATION_TYPES = [
  "Income Certificate",
  "OBC Certificate",
  "EWS Certificate",
  "Integrated Certificate",
  "Family Member Certificate"
];

interface UploadFormProps {
  schemas: Schema[];
  isLoadingSchemas: boolean;
  onExtract: (id: string, type: 'schema' | 'application', files: File[]) => Promise<void>;
  isExtracting: boolean;
}

export function UploadForm({ schemas, isLoadingSchemas, onExtract, isExtracting }: UploadFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedValue || selectedFiles.length === 0) return;

    const isSchema = selectedValue.startsWith('schema:');
    const id = isSchema ? selectedValue.replace('schema:', '') : selectedValue;
    const type = isSchema ? 'schema' : 'application';

    await onExtract(id, type, selectedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedSchema = schemas.find(s => `schema:${s.schema_id}` === selectedValue);

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">Upload Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Document Type</label>
          <Select value={selectedValue} onValueChange={setSelectedValue} disabled={isLoadingSchemas}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select document type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Standard Applications</SelectLabel>
                {APPLICATION_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Custom Schemas</SelectLabel>
                {schemas.map(schema => (
                  <SelectItem key={schema.schema_id} value={`schema:${schema.schema_id}`}>
                    {schema.schema_name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {selectedSchema && (
            <p className="text-xs text-muted-foreground">
              {selectedSchema.description}
            </p>
          )}
        </div>

        {/* Drop Zone */}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
            isDragging
              ? 'border-foreground bg-secondary'
              : 'border-border hover:border-foreground/50',
            'cursor-pointer'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-sm font-medium text-foreground mb-1">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PDF and image files
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Selected Files ({selectedFiles.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          disabled={!selectedValue || selectedFiles.length === 0 || isExtracting}
          onClick={handleSubmit}
        >
          {isExtracting ? 'Extracting...' : 'Extract Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
