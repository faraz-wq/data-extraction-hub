import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResultsView } from '@/components/extract/ResultsView';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { PageTextDrawer } from '@/components/extract/PageTextDrawer';
import { api, SessionDetail } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Session() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // State for UI interactions
    const [hoveredField, setHoveredField] = useState<string | null>(null);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [activeFilename, setActiveFilename] = useState<string | null>(null);
    const [isTextDrawerOpen, setIsTextDrawerOpen] = useState(false);

    // Derived state
    const activeField = hoveredField || selectedField;

    useEffect(() => {
        if (!sessionId) {
            navigate('/extract');
            return;
        }

        const fetchSession = async () => {
            try {
                setLoading(true);
                const data = await api.getSession(sessionId);
                setSession(data);

                // Initialize active document
                if (data.source_documents?.[0]) {
                    setActiveFilename(data.source_documents[0].filename);
                }
            } catch (error) {
                console.error('Failed to load session:', error);
                toast({
                    title: 'Error found',
                    description: 'Failed to load the requested session.',
                    variant: 'destructive',
                });
                navigate('/extract');
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [sessionId, navigate]);

    const handleFieldHover = (field: string | null) => {
        setHoveredField(field);
    };

    const handleFieldClick = (field: string, switchDoc: boolean = true) => {
        setSelectedField(prev => {
            const next = prev === field ? null : field;

            // If we are selecting a field, ensure we show the application document
            // but only if switchDoc is true (it is false when clicking a box in the viewer)
            if (next && session && switchDoc) {
                const appDoc = session.source_documents?.find(d =>
                    (d.document_title || d.filename || '').toLowerCase().includes('application')
                );
                if (appDoc) {
                    setActiveFilename(appDoc.filename);
                    if (appDoc.page_numbers?.[0]) {
                        setPageNumber(appDoc.page_numbers[0]);
                    }
                }
            }

            return next;
        });
    };

    const handlePageClick = (page: number, filename?: string) => {
        setPageNumber(page);
        if (filename) {
            setActiveFilename(filename);
        }
    };

    if (loading) {
        return (
            <DashboardLayout noPadding>
                <div className="h-screen flex items-center justify-center bg-slate-50/50">
                    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Session...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!session) return null;

    // Determine the active document
    const activeDoc = session.source_documents?.find(d => d.filename === activeFilename) || session.source_documents?.[0];
    const fileToView = activeDoc?.url || null;
    const currentFilename = activeDoc?.filename || 'document';

    return (
        <DashboardLayout noPadding>
            <div className="h-screen overflow-hidden flex flex-col bg-slate-50/50">
                {/* Main Content Area */}
                <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 flex overflow-hidden scale-in">
                        <div className="w-[640px] border-r border-border/40 bg-white/80 backdrop-blur-sm shadow-xl z-10 overflow-hidden flex flex-col">
                            <ResultsView
                                result={session}
                                onFieldHover={handleFieldHover}
                                onFieldClick={handleFieldClick}
                                highlightedField={activeField}
                                selectedField={selectedField}
                                onPageClick={handlePageClick}
                                currentPage={pageNumber}
                            />
                        </div>
                        <div className="flex-1 bg-slate-100/50 p-4 overflow-hidden flex flex-col">
                            <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
                                <PDFViewerWithBoxes
                                    file={fileToView}
                                    currentFilename={currentFilename}
                                    boundingBoxes={session.bounding_boxes}
                                    highlightedField={activeField}
                                    onFieldClick={handleFieldClick}
                                    page={pageNumber}
                                    onPageChange={setPageNumber}
                                    onShowText={() => setIsTextDrawerOpen(true)}
                                />
                            </div>
                        </div>

                        {/* Text Drawer */}
                        <PageTextDrawer
                            isOpen={isTextDrawerOpen}
                            onClose={() => setIsTextDrawerOpen(false)}
                            pageNumber={pageNumber}
                            filename={currentFilename}
                            text={
                                session.page_text?.[`${currentFilename}_page_${pageNumber}`] ||
                                session.page_text?.[`page_${pageNumber}`] ||
                                ""
                            }
                        />
                    </div>
                </main>
            </div >
        </DashboardLayout >
    );
}
