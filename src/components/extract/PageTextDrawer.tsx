import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PageTextDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    pageNumber: number;
    filename?: string;
}

export function PageTextDrawer({ isOpen, onClose, text, pageNumber, filename }: PageTextDrawerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col bg-white z-[100]">
                <SheetHeader className="px-6 py-4 border-b border-border/40 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#5856D6]/10 text-[#5856D6] rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold tracking-tight">Raw extracted text</SheetTitle>
                            <SheetDescription className="text-xs font-medium text-muted-foreground">
                                OCR content from Page {pageNumber} {filename ? `• ${filename}` : ''}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden relative group">
                    <div className="absolute top-4 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopy}
                            className={cn(
                                "h-8 text-[10px] font-bold uppercase tracking-wide gap-1.5 transition-all shadow-sm",
                                copied ? "bg-green-50 text-green-600 border-green-200" : "bg-white hover:bg-gray-50"
                            )}
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? "Copied" : "Copy Text"}
                        </Button>
                    </div>

                    <ScrollArea className="h-full w-full">
                        <div className="p-6">
                            {text ? (
                                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground bg-[#F2F2F7]/50 p-4 rounded-xl border border-border/40 select-text">
                                    {text}
                                </pre>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-50">
                                    <FileText className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-sm font-bold text-muted-foreground">No text content found on this page</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
