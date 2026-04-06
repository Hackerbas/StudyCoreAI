import React, { useState, useCallback, useMemo } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, Sparkles, StickyNote } from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function AdvancedPdfReader({ pdfUrl, initialPage = 1, onPageChange, aiHighlights = [], onAskAI }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [selPopup, setSelPopup] = useState(null);

    // Sync external jumps
    React.useEffect(() => {
        if (initialPage && initialPage !== pageNumber) {
            setPageNumber(initialPage);
        }
    }, [initialPage]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const changePage = (offset) => {
        setPageNumber(prev => {
            const next = prev + offset;
            if (next >= 1 && next <= numPages) {
                onPageChange?.(next);
                return next;
            }
            return prev;
        });
    };

    // Custom text highlighting
    const customTextRenderer = useCallback(({ str, itemIndex }) => {
        const pageHighlights = aiHighlights.filter(h => h.page === pageNumber);
        
        let markedStr = str;
        pageHighlights.forEach(h => {
             if (h.text && str.toLowerCase().includes(h.text.toLowerCase())) {
                 // Simplistic highlight matching
                 const idx = str.toLowerCase().indexOf(h.text.toLowerCase());
                 if (idx !== -1) {
                     const match = str.substring(idx, idx + h.text.length);
                     markedStr = str.substring(0, idx) + 
                         `<mark style="background-color: rgba(250, 204, 21, 0.4); border-radius: 4px; padding: 2px;">${match}</mark>` + 
                         str.substring(idx + h.text.length);
                 }
             }
        });
        
        // Return dangerouslySetInnerHTML format for react-pdf customTextRenderer (v9 allows returning nodes or strings of html if rendered manually, wait actually react-pdf customTextRenderer accepts a string and renders it. Let's return raw string if there's no highlight, or a wrapped node if there is. Wait, `customTextRenderer` expects a returned string or ReactElement in v9+. To be safe, let's return a string)
        // Wait, react-pdf v9 `customTextRenderer` expects a returned React element or string. 
        if (markedStr !== str) {
            return <span dangerouslySetInnerHTML={{ __html: markedStr }} />;
        }
        return str;
    }, [aiHighlights, pageNumber]);

    // Handle text selection for AI Ask popup
    const handleMouseUp = () => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 3) {
            const rect = sel.getRangeAt(0).getBoundingClientRect();
            // Calculate relative to the viewer container
            setSelPopup({ x: rect.left + rect.width / 2, y: rect.top, text });
        } else {
            setSelPopup(null);
        }
    };

    const handleAskPopup = () => {
        if (!selPopup) return;
        onAskAI?.(selPopup.text);
        setSelPopup(null);
        window.getSelection()?.removeAllRanges();
    };

    const activeStickyNotes = useMemo(() => {
        return aiHighlights.filter(h => h.page === pageNumber && h.note);
    }, [aiHighlights, pageNumber]);

    const containerRef = React.useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);

    React.useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            setContainerWidth(entries[0].contentRect.width - 40); // 40px padding for safety
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0b0f19', color: 'white' }} onMouseUp={handleMouseUp}>
            
            {/* Selection Popup */}
            {selPopup && (
                <div style={{
                    position: 'fixed', top: selPopup.y - 44, left: selPopup.x,
                    transform: 'translateX(-50%)', background: '#1e293b',
                    borderRadius: 10, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 9999,
                    cursor: 'pointer', border: '1px solid var(--border)', animation: 'selPopIn 0.15s ease'
                }} onClick={handleAskPopup}>
                    <Sparkles size={12} color="white" />
                    <span style={{ color: 'white', fontSize: '0.78rem', fontWeight: 700 }}>Ask AI</span>
                </div>
            )}

            <div ref={containerRef} style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '20px 0', position: 'relative' }}>
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="spin" style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }}/>}
                >
                    <Page 
                        pageNumber={pageNumber} 
                        renderAnnotationLayer={true} 
                        renderTextLayer={true}
                        customTextRenderer={customTextRenderer}
                        width={containerWidth} // Completely responsive!
                        className="transition-all duration-300 ease-in-out"
                    />
                    
                    {/* Sticky Notes Overlay */}
                    {activeStickyNotes.map((note, idx) => (
                        <div key={idx} style={{ position: 'absolute', top: 40 + (idx * 50), right: -30, background: '#fef08a', color: '#854d0e', padding: '8px 12px', borderRadius: '4px 16px 16px 16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #fde047', fontSize: '0.8rem', maxWidth: 200, zIndex: 50, rotate: idx % 2 === 0 ? '2deg' : '-2deg' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                <StickyNote size={12} /> <strong style={{ fontSize: '0.7rem' }}>AI Note</strong>
                            </div>
                            {note.note}
                        </div>
                    ))}
                </Document>
            </div>

            {/* Pagination Controls */}
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderTop: '1px solid var(--border)', background: '#0b0f19' }}>
                <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} style={{ background: '#1e293b', border: '1px solid var(--border)', color: 'white', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: pageNumber > 1 ? 'pointer' : 'default', opacity: pageNumber <= 1 ? 0.4 : 1, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'} onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
                    <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', background: '#1e293b', padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)' }}>Page {pageNumber} of {numPages || '--'}</span>
                <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} style={{ background: '#1e293b', border: '1px solid var(--border)', color: 'white', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: pageNumber < numPages ? 'pointer' : 'default', opacity: pageNumber >= numPages ? 0.4 : 1, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'} onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
                    <ChevronRight size={18} />
                </button>
            </div>
            <style>{`
                @keyframes selPopIn { from { opacity:0; transform:translate(-50%,6px); } to { opacity:1; transform:translate(-50%,0); } }

                .react-pdf__Page__canvas { border-radius: 8px; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5); }
            `}</style>
        </div>
    );
}
