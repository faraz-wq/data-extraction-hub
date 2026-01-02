
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

                // If we have documents, try to set the first one as active implicitly by just rendering it
                // The PDFViewer handles the file prop.
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

    const handleFieldClick = (field: string) => {
        setSelectedField(prev => prev === field ? null : field);
    };

    if (loading) {
        return (
            <DashboardLayout noPadding>
                <div className="h-screen flex items-center justify-center bg-[#F2F2F7]">
                    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-sm font-medium text-gray-500">Loading Session...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!session) return null;

    // Determine the file to show
    // In the real app, we might support multiple files, but for now take the first one
    const fileToView = session.source_documents?.[0]?.url
        ? session.source_documents[0].url
        : null;

    const currentFilename = session.source_documents?.[0]?.filename || 'document';

    return (
        <DashboardLayout noPadding>
            <div className="h-screen overflow-hidden flex flex-col bg-[#F2F2F7]">
                {/* Main Content Area */}
                <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 flex overflow-hidden scale-in">
                        <div className="w-[640px] border-r border-border/40 bg-white shadow-xl z-10 overflow-hidden flex flex-col">
                            <ResultsView
                                result={session}
                                onFieldHover={handleFieldHover}
                                onFieldClick={handleFieldClick}
                                highlightedField={activeField}
                                selectedField={selectedField}
                                onPageClick={setPageNumber}
                                currentPage={pageNumber}
                            />
                        </div>
                        <div className="flex-1 bg-[#8E8E93]/10 p-2 overflow-hidden flex flex-col">
                            <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
                                <PDFViewerWithBoxes
                                    file={fileToView}
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
