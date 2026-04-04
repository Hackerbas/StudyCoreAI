import React from 'react';
import { Document, Page } from 'react-pdf';
import { BookOpen } from 'lucide-react';

export default function PdfThumbnail({ pdfUrl, fallbackIcon, width = 44 }) {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    if (error) return fallbackIcon;

    return (
        <div style={{ width, height: width * 1.4, borderRadius: 8, overflow: 'hidden', position: 'relative', background: 'var(--bg-card)', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
            <Document
                file={pdfUrl}
                loading={fallbackIcon}
                onLoadSuccess={() => setLoaded(true)}
                onLoadError={() => setError(true)}
            >
                <Page 
                    pageNumber={1} 
                    width={width} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false}
                />
            </Document>
            {!loaded && !error && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {fallbackIcon}
                </div>
            )}
        </div>
    );
}
