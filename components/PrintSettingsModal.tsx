import React, { useState, useRef, useEffect } from 'react';
import {
    Printer, X, Plus, ChevronDown, Check, FileText,
    ZoomIn, ZoomOut, Maximize2, RotateCcw
} from 'lucide-react';

export type PaperSizeType =
    | 'Letter'
    | 'Tabloid'
    | 'Legal'
    | 'Statement'
    | 'Executive'
    | 'A3'
    | 'A4'
    | 'A5'
    | 'JIS B4'
    | 'JIS B5'
    | '80mm';

export interface PrintSettings {
    printer: string;
    orientation: 'Portrait' | 'Landscape';
    paperSize: PaperSizeType;
    photoSize: 'Full page' | 'Half page' | 'Card slip';
    pageMargins: 'Normal' | 'Narrow' | 'Minimum' | 'None';
    fit: 'Fill page' | 'Fit to page' | 'Actual size';
}

interface PrintSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrintConfirm?: (settings: PrintSettings) => void;
    previewContent: React.ReactNode;
    defaultPaperSize?: PaperSizeType;
    defaultOrientation?: 'Portrait' | 'Landscape';
    documentTitle?: string;
}

interface SheetDimensions {
    w: number; // width in px at reference 96 DPI
    h: number; // height in px at reference 96 DPI
}

const paperPixelSizes: Record<PaperSizeType, SheetDimensions> = {
    'Letter': { w: 816, h: 1056 },
    'Tabloid': { w: 1056, h: 1632 },
    'Legal': { w: 816, h: 1344 },
    'Statement': { w: 528, h: 816 },
    'Executive': { w: 696, h: 1008 },
    'A3': { w: 1123, h: 1587 },
    'A4': { w: 794, h: 1123 },
    'A5': { w: 559, h: 794 },
    'JIS B4': { w: 971, h: 1376 },
    'JIS B5': { w: 688, h: 971 },
    '80mm': { w: 340, h: 750 }
};

const paperDimensionsText: Record<PaperSizeType, string> = {
    'Letter': '8.50" × 11.00"',
    'Tabloid': '11.00" × 17.00"',
    'Legal': '8.50" × 14.00"',
    'Statement': '5.50" × 8.50"',
    'Executive': '7.25" × 10.50"',
    'A3': '11.69" × 16.54"',
    'A4': '8.27" × 11.69"',
    'A5': '5.83" × 8.27"',
    'JIS B4': '10.12" × 14.33"',
    'JIS B5': '7.17" × 10.12"',
    '80mm': '3.15" Roll (Thermal POS)'
};

export const PrintSettingsModal: React.FC<PrintSettingsModalProps> = ({
    isOpen,
    onClose,
    onPrintConfirm,
    previewContent,
    defaultPaperSize = 'A4',
    defaultOrientation = 'Portrait',
    documentTitle = 'Patient Official Record'
}) => {
    const [printer, setPrinter] = useState<string>('Microsoft Print to PDF');
    const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>(defaultOrientation);
    const [paperSize, setPaperSize] = useState<PaperSizeType>(defaultPaperSize);
    const [photoSize, setPhotoSize] = useState<'Full page' | 'Half page' | 'Card slip'>('Full page');
    const [pageMargins, setPageMargins] = useState<'Normal' | 'Narrow' | 'Minimum' | 'None'>('Normal');
    const [fit, setFit] = useState<'Fill page' | 'Fit to page' | 'Actual size'>('Fit to page');
    const [showMoreSettings, setShowMoreSettings] = useState(false);
    const [copies, setCopies] = useState<number>(1);
    const [includeBackground, setIncludeBackground] = useState<boolean>(true);

    // Zoom and preview viewport sizing
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 600, height: 600 });
    const [zoomMode, setZoomMode] = useState<'fit' | 'custom'>('fit');
    const [customZoom, setCustomZoom] = useState<number>(1);

    // Measure preview viewport on mount/resize
    useEffect(() => {
        if (!isOpen) return;

        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    setContainerSize({ width: rect.width, height: rect.height });
                }
            }
        };

        // Delay slightly for modal animation to settle
        useEffect(() => {
            if (!isOpen) return;

            // Escape key to close print modal
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [isOpen, onClose]);
        const timer = setTimeout(updateSize, 50);

        window.addEventListener('resize', updateSize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateSize);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Calculate actual pixel width/height for current paper size & orientation
    const baseDimensions = paperPixelSizes[paperSize] || paperPixelSizes['A4'];
    const isLandscape = orientation === 'Landscape' && paperSize !== '80mm';
    const sheetW = isLandscape ? baseDimensions.h : baseDimensions.w;
    const sheetH = isLandscape ? baseDimensions.w : baseDimensions.h;

    // Calculate fit-to-window scale factor with comfortable padding
    const paddingAround = 48;
    const availW = Math.max(150, containerSize.width - paddingAround);
    const availH = Math.max(150, containerSize.height - paddingAround);
    const fitScale = Math.min(availW / sheetW, availH / sheetH);

    // Final effective scale
    const effectiveScale = zoomMode === 'fit'
        ? Math.min(fitScale, 1.2)
        : customZoom;

    const handleZoomIn = () => {
        setZoomMode('custom');
        setCustomZoom(prev => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10));
    };

    const handleZoomOut = () => {
        setZoomMode('custom');
        setCustomZoom(prev => Math.max(0.3, Math.round((prev - 0.1) * 10) / 10));
    };

    const handleFitReset = () => {
        setZoomMode('fit');
    };

    const handleActualSize = () => {
        setZoomMode('custom');
        setCustomZoom(1.0);
    };

    const getPageSizeRule = (size: PaperSizeType, orient: 'Portrait' | 'Landscape') => {
        if (size === '80mm') return '80mm auto';
        const isOrientLandscape = orient === 'Landscape';
        switch (size) {
            case 'Letter': return isOrientLandscape ? '11in 8.5in' : '8.5in 11in';
            case 'Tabloid': return isOrientLandscape ? '17in 11in' : '11in 17in';
            case 'Legal': return isOrientLandscape ? '14in 8.5in' : '8.5in 14in';
            case 'Statement': return isOrientLandscape ? '8.5in 5.5in' : '5.5in 8.5in';
            case 'Executive': return isOrientLandscape ? '10.5in 7.25in' : '7.25in 10.5in';
            case 'A3': return isOrientLandscape ? '420mm 297mm' : '297mm 420mm';
            case 'A4': return isOrientLandscape ? '297mm 210mm' : '210mm 297mm';
            case 'A5': return isOrientLandscape ? '210mm 148mm' : '148mm 210mm';
            case 'JIS B4': return isOrientLandscape ? '364mm 257mm' : '257mm 364mm';
            case 'JIS B5': return isOrientLandscape ? '257mm 182mm' : '182mm 257mm';
            default: return isOrientLandscape ? '297mm 210mm' : '210mm 297mm';
        }
    };

    const handleExecutePrint = () => {
        const settings: PrintSettings = {
            printer,
            orientation,
            paperSize,
            photoSize,
            pageMargins,
            fit
        };

        // Inject dynamic @page rules based on user settings
        let styleEl = document.getElementById('dynamic-page-print-size');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-page-print-size';
            document.head.appendChild(styleEl);
        }

        const sizeParam = getPageSizeRule(paperSize, orientation);
        const marginParam = pageMargins === 'None'
            ? '0mm'
            : pageMargins === 'Narrow'
                ? '4mm'
                : pageMargins === 'Minimum'
                    ? '2mm'
                    : '8mm';

        styleEl.innerHTML = `
            @page {
                size: ${sizeParam} !important;
                margin: ${marginParam} !important;
            }
        `;

        // Update target slip container class
        const slip = document.getElementById('printable-slip');
        if (slip) {
            slip.classList.remove('size-a4', 'size-a5', 'size-thermal', 'size-letter', 'size-tabloid', 'size-legal');
            slip.classList.add(paperSize === '80mm' ? 'size-thermal' : `size-${paperSize.toLowerCase().replace(/\s+/g, '-')}`);
            if (orientation === 'Landscape') {
                slip.classList.add('print-landscape');
            } else {
                slip.classList.remove('print-landscape');
            }
        }

        if (onPrintConfirm) {
            onPrintConfirm(settings);
        }

        onClose();

        setTimeout(() => {
            window.print();
        }, 120);
    };

    const getPaddingStyle = () => {
        if (pageMargins === 'None') return 'p-1';
        if (pageMargins === 'Minimum') return 'p-2 sm:p-3';
        if (pageMargins === 'Narrow') return 'p-3 sm:p-4';
        return 'p-4 sm:p-6';
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#323639] rounded-2xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col md:flex-row overflow-hidden border border-slate-700">

                {/* Left Side: Chrome-Style Live Document Preview */}
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#525659]">
                    {/* Dark Preview Toolbar */}
                    <div className="flex justify-between items-center px-4 py-2 bg-[#323639] text-white border-b border-black/30 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 shrink-0">Print Preview</span>
                            <span className="text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded truncate">
                                {paperSize} • {orientation}
                            </span>
                            <span className="text-xs text-slate-400 truncate hidden lg:inline max-w-[260px]">
                                {documentTitle}
                            </span>
                        </div>

                        {/* Interactive Zoom Toolbar */}
                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/10 shrink-0">
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                                title="Zoom Out"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <span className="text-[11px] font-mono font-bold text-slate-200 min-w-[42px] text-center select-none">
                                {Math.round(effectiveScale * 100)}%
                            </span>
                            <button
                                type="button"
                                onClick={handleZoomIn}
                                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                                title="Zoom In"
                            >
                                <ZoomIn size={14} />
                            </button>
                            <div className="w-px h-3.5 bg-white/20 mx-1" />
                            <button
                                type="button"
                                onClick={handleFitReset}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${zoomMode === 'fit' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                                title="Fit whole sheet in window"
                            >
                                Fit Page
                            </button>
                            <button
                                type="button"
                                onClick={handleActualSize}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${zoomMode === 'custom' && customZoom === 1 ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                                title="100% Actual size"
                            >
                                100%
                            </button>
                        </div>
                    </div>

                    {/* Virtual Sheet Desktop (Fixes flex centering scroll bug with m-auto) */}
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-auto p-4 sm:p-6 flex custom-scrollbar relative"
                    >
                        {/* Outer wrapper has EXACT rendered pixel bounding box */}
                        <div
                            className="m-auto transition-all duration-150"
                            style={{
                                width: Math.round(sheetW * effectiveScale),
                                height: Math.round(sheetH * effectiveScale),
                                flexShrink: 0
                            }}
                        >
                            {/* Inner Scaled Sheet Container */}
                            <div
                                className="shadow-2xl ring-1 ring-black/40 rounded bg-white overflow-hidden origin-top-left"
                                style={{
                                    width: sheetW,
                                    height: sheetH,
                                    transform: `scale(${effectiveScale})`,
                                    transformOrigin: 'top left'
                                }}
                            >
                                <div className={`w-full h-full overflow-y-auto custom-scrollbar text-slate-900 bg-white ${getPaddingStyle()}`}>
                                    {previewContent}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="px-4 py-1.5 bg-[#323639] border-t border-black/30 flex justify-between items-center text-[11px] text-slate-400 shrink-0">
                        <span>Sheet: <strong className="text-slate-200">{paperSize}</strong> ({paperDimensionsText[paperSize]})</span>
                        <span>1 of 1 Page</span>
                        <span className="hidden sm:inline">Margins: <strong className="text-slate-200">{pageMargins}</strong></span>
                    </div>
                </div>

                {/* Right Side: Windows-Style Print Settings Panel */}
                <div className="w-full md:w-80 lg:w-88 bg-white border-l border-slate-200 flex flex-col h-full shrink-0">
                    {/* Settings Panel Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
                        {/* Title Bar */}
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Printer size={20} className="text-teal-600" /> Print Settings
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Close dialog"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* 1. Printer Destination */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Printer</label>
                            <div className="relative">
                                <select
                                    value={printer}
                                    onChange={(e) => setPrinter(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                                    <option value="Default System Printer">Default System Printer</option>
                                    <option value="Save as PDF">Save as PDF</option>
                                    <option value="POS Thermal Printer (80mm)">POS Thermal Receipt Printer</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                            <button
                                type="button"
                                onClick={() => alert("To add a physical printer, configure it in Windows Settings > Bluetooth & Devices > Printers & Scanners.")}
                                className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                            >
                                <Plus size={14} /> Add a printer
                            </button>
                        </div>

                        {/* 2. Orientation */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Orientation</label>
                            <div className="relative">
                                <select
                                    value={orientation}
                                    onChange={(e) => setOrientation(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Portrait">Portrait (Vertical)</option>
                                    <option value="Landscape">Landscape (Horizontal)</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* 3. Paper Size (All Requested Standard Sizes) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Paper size</label>
                            <div className="relative">
                                <select
                                    value={paperSize}
                                    onChange={(e) => setPaperSize(e.target.value as PaperSizeType)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Letter">Letter (8.50" × 11.00")</option>
                                    <option value="Tabloid">Tabloid (11.00" × 17.00")</option>
                                    <option value="Legal">Legal (8.50" × 14.00")</option>
                                    <option value="Statement">Statement (5.50" × 8.50")</option>
                                    <option value="Executive">Executive (7.25" × 10.50")</option>
                                    <option value="A3">A3 (11.69" × 16.54")</option>
                                    <option value="A4">A4 (8.27" × 11.69")</option>
                                    <option value="A5">A5 (5.83" × 8.27")</option>
                                    <option value="JIS B4">JIS B4 (10.12" × 14.33")</option>
                                    <option value="JIS B5">JIS B5 (7.17" × 10.12")</option>
                                    <option value="80mm">80mm POS Roll (Thermal Slip)</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                            <span className="text-[11px] text-slate-500 block font-medium">
                                {paperDimensionsText[paperSize]}
                            </span>
                        </div>

                        {/* 4. Photo size / Output Layout */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Photo size</label>
                            <div className="relative">
                                <select
                                    value={photoSize}
                                    onChange={(e) => setPhotoSize(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Full page">Full page</option>
                                    <option value="Half page">Half page (Compact)</option>
                                    <option value="Card slip">Card slip</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* 5. Page Margins */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Page Margins</label>
                            <div className="relative">
                                <select
                                    value={pageMargins}
                                    onChange={(e) => setPageMargins(e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Normal">Normal (8mm)</option>
                                    <option value="Narrow">Narrow (4mm)</option>
                                    <option value="Minimum">Minimum (2mm)</option>
                                    <option value="None">None (0mm)</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* 6. Fit */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Fit</label>
                            <div className="relative">
                                <select
                                    value={fit}
                                    onChange={(e) => {
                                        const val = e.target.value as any;
                                        setFit(val);
                                        if (val === 'Fit to page' || val === 'Fill page') {
                                            setZoomMode('fit');
                                        } else {
                                            setZoomMode('custom');
                                            setCustomZoom(1.0);
                                        }
                                    }}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium outline-none focus:border-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Fit to page">Fit to page (Full view)</option>
                                    <option value="Fill page">Fill page (Expanded)</option>
                                    <option value="Actual size">Actual size (100%)</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* More settings toggle */}
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={() => setShowMoreSettings(!showMoreSettings)}
                                className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                                <ChevronDown size={14} className={`transition-transform duration-200 ${showMoreSettings ? 'rotate-180' : ''}`} />
                                More settings
                            </button>

                            {showMoreSettings && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-600 font-semibold">Number of Copies:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={copies}
                                            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 px-2 py-1 text-center bg-white border border-slate-300 rounded-lg font-bold"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeBackground}
                                            onChange={(e) => setIncludeBackground(e.target.checked)}
                                            className="rounded text-teal-600 focus:ring-teal-500"
                                        />
                                        <span>Print Background Graphics & Colors</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Buttons (Always pinned at bottom) */}
                    <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleExecutePrint}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Printer size={16} /> Print
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintSettingsModal;
