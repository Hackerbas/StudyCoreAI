import React, { useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function AdvancedPdfReader({ pdfUrl, initialPage = 1, onPageChange, onAskAI }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [selPopup, setSelPopup] = useState(null);

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

    const handleMouseUp = () => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 3) {
            const rect = sel.getRangeAt(0).getBoundingClientRect();
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

    const containerRef = React.useRef(null);
    const [containerWidth, setContainerWidth] = useState(800);

    React.useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            setContainerWidth(entries[0].contentRect.width - 40);
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
                        width={containerWidth}
                        className="transition-all duration-300 ease-in-out"
                    />
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
