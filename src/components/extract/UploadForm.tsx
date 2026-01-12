import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Fallback types if API fails or is loading
const FALLBACK_TYPES = [
  "Income Certificate",
  "OBC Certificate",
  "EWS Certificate",
  "Integrated Certificate",
  "Family Member Certificate"
];

interface UploadFormProps {
  supportedTypes: string[];
  isLoadingTypes: boolean;
  onExtract: (applicationType: string, files: File[]) => Promise<void>;
  isExtracting: boolean;
}

export function UploadForm({ supportedTypes, isLoadingTypes, onExtract, isExtracting }: UploadFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayTypes = supportedTypes.length > 0 ? supportedTypes : FALLBACK_TYPES;

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
    await onExtract(selectedValue, selectedFiles);
  };

  return (
    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm max-w-lg mx-auto">
      <CardHeader className="text-center pb-4 pt-6 border-b border-border/10">
        <div className="mx-auto w-10 h-10 bg-primary/10 rodocument_validation/dataunded-full flex items-center justify-center mb-3">
          <FileText className="w-5 h-5" style={{ stroke: "url(#tricolor-gradient)" }} />
        </div>
        <CardTitle className="text-lg font-semibold">Start Validation</CardTitle>
        <CardDescription className="text-xs">Select document type and upload files</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-6 px-6 pb-6">
        {/* Step 1: Document Type */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              1. Document Type
            </label>
            {selectedValue && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
          </div>

          <Select value={selectedValue} onValueChange={setSelectedValue} disabled={isLoadingTypes && supportedTypes.length === 0}>
            <SelectTrigger className="w-full h-9 text-sm bg-white">
              <SelectValue placeholder={isLoadingTypes ? "Loading..." : "Choose document type..."} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs">Available Types</SelectLabel>
                {displayTypes.map(type => (
                  <SelectItem key={type} value={type} className="text-sm cursor-pointer">
                    {type}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              2. Upload Files
            </label>
            {selectedFiles.length > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
          </div>

          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer bg-white/50',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border/60 hover:border-primary/50 hover:bg-muted/30',
              selectedFiles.length > 0 && 'border-success/50 bg-success/5'
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

            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "p-2.5 rounded-full transition-colors",
                isDragging ? "bg-primary/20" : "bg-muted"
              )}>
                <Upload
                  className="w-4 h-4"
                  style={isDragging ? { stroke: "url(#tricolor-gradient)" } : {}}
                />
              </div>
              <div className="space-y-0.5">
                <p className="font-medium text-sm">
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                    : "Upload or drag & drop"
                  }
                </p>
                <p className="text-[10px] text-muted-foreground">
                  PDF or Images (Max 10MB)
                </p>
              </div>
            </div>
          </div>

          {/* Selected Files List - Compact */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/50 border border-border/50 text-xs group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-0.5 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action */}
        <Button
          size="default"
          className="w-full h-10 bg-success hover:bg-success/90 text-white font-medium text-sm shadow-sm transition-all"
          disabled={!selectedValue || selectedFiles.length === 0 || isExtracting}
          onClick={handleSubmit}
        >
          {isExtracting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              Validating...
            </span>
          ) : 'Start Validation'}
        </Button>
      </CardContent>
    </Card>
  );
}