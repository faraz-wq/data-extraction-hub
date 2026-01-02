import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
    <div
      className={cn(
        'flex items-center gap-3 p-2 border-b border-border',
        isDragging && 'bg-secondary'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Select value={selectedValue} onValueChange={setSelectedValue} disabled={isLoadingTypes && supportedTypes.length === 0}>
        <SelectTrigger className="w-48 h-8 text-xs">
          <SelectValue placeholder={isLoadingTypes ? "Loading..." : "Select type..."} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Document Type</SelectLabel>
            {displayTypes.map(type => (
              <SelectItem key={type} value={type} className="text-xs">
                {type}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => fileInputRef.current?.click()}
      >
        {selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : 'Add files'}
      </Button>

      {selectedFiles.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto max-w-md">
          {selectedFiles.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded whitespace-nowrap cursor-pointer hover:line-through"
              onClick={() => removeFile(index)}
            >
              {file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name}
            </span>
          ))}
        </div>
      )}

      <Button
        size="sm"
        className="h-8 text-xs ml-auto"
        disabled={!selectedValue || selectedFiles.length === 0 || isExtracting}
        onClick={handleSubmit}
      >
        {isExtracting ? 'Extracting...' : 'Extract'}
      </Button>
    </div>
  );
}