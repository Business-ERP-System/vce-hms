
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { MENU_GROUPS, APP_NAME, MENU_ITEMS } from '../constants';
import {
    BookOpen, Download, Globe, Printer, Sparkles, ChevronRight,
    FileText, Layout, Settings, Users, Stethoscope, Pill,
    ShoppingCart, Briefcase, Database, ShieldCheck, Info,
    CheckCircle2, ArrowRight, MousePointer2, Search, Plus
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const UserManual = () => {
    const { patients } = useData();
    const [language, setLanguage] = useState('English');
    const [manualContent, setManualContent] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSection, setActiveSection] = useState('Introduction');
    const manualRef = useRef<HTMLDivElement>(null);

    const languages = [
        { name: 'English', code: 'en' },
        { name: 'Bangla', code: 'bn' },
        { name: 'Hindi', code: 'hi' },
        { name: 'French', code: 'fr' },
        { name: 'German', code: 'de' }
    ];

    const STATIC_MANUAL: Record<string, string> = {
        'Introduction': `
            <h2 class="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Introduction to ${APP_NAME}</h2>
            <p>Welcome to the official user documentation for <strong>${APP_NAME}</strong>, the next-generation Eye Hospital Management System. This platform is designed to streamline clinical workflows, optimize patient management, and provide deep analytical insights into your hospital's operations.</p>
            <h3 class="text-lg font-bold text-slate-800 mt-6 mb-3">Core Philosophy</h3>
            <ul>
                <li><strong>Efficiency First:</strong> Minimize clicks and maximize data visibility.</li>
                <li><strong>Clinical Precision:</strong> Specialized tools for ophthalmology including vision tracking and eye mapping.</li>
                <li><strong>AI Integration:</strong> Real-time clinical insights powered by Gemini 1.5.</li>
            </ul>
        `,
        'Dashboard': `
            <h3 class="text-xl font-black text-slate-900 mb-4 uppercase">Command Center Dashboard</h3>
            <p>The Dashboard serves as the heart of the HMS, providing a high-level overview of live operations. It features interactive charts and metrics.</p>
            <ul>
                <li><strong>Executive Summary:</strong> Live feed of census and revenue flow.</li>
                <li><strong>Drill-down:</strong> Click any chart segment or stat card to see detailed reports for that specific module.</li>
                <li><strong>Operational Queues:</strong> Monitor live OPD wait times and Lab pending statuses.</li>
            </ul>
        `,
        'Patient Registration': `
            <h3 class="text-xl font-black text-slate-900 mb-4 uppercase">Onboarding & Registration</h3>
            <p>The Registration module allows for fast onboarding of new and returning patients with comprehensive demographic tracking.</p>
            <h4 class="font-bold text-slate-800 mt-4 mb-2">Key Features:</h4>
            <ul>
                <li><strong>UHID Engine:</strong> Automatically generates Unique Health IDs.</li>
                <li><strong>Smart Search:</strong> Prevent duplicate patient records with fuzzy-matching search.</li>
            </ul>
        `,
        'EMR (Medical Records)': `
            <h3 class="text-xl font-black text-slate-900 mb-4 uppercase">Clinical Workup & EMR</h3>
            <p>The EMR module provides a specialized interface for ophthalmologists to document clinical findings and manage history.</p>
            <ul>
                <li><strong>Vitals & VA:</strong> Quickly record triage vitals and Visual Acuity (OD/OS).</li>
                <li><strong>Ophthalmic Drawing:</strong> Interactive canvas tools for mapping Anterior and Fundus findings.</li>
                <li><strong>AI Specialist Hub:</strong> Clinical reasoning assistant that suggests differential diagnoses based on findings.</li>
            </ul>
        `,
        'Pharmacy & Optical': `
            <h3 class="text-xl font-black text-slate-900 mb-4 uppercase">Pharmacy & Optical Inventory</h3>
            <p>Manage pharmaceutical stock and optical retail inventory (frames, lenses) across multiple locations.</p>
            <ul>
                <li><strong>Batch Management:</strong> Track manufacturing dates and batch-wise stock.</li>
                <li><strong>POS Integration:</strong> Fast billing for medical and optical sales.</li>
            </ul>
        `
    };

    const generateManual = async () => {
        setIsGenerating(true);
        try {
            // First, populate with static content
            const newContent: Record<string, string> = { ...STATIC_MANUAL };

            // Check for API Key
            const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

            if (apiKey && (language !== 'English' || !newContent[activeSection])) {
                const ai = new GoogleGenAI({ apiKey });

                const prompt = `Write a professional user manual section for the "${activeSection}" module of "${APP_NAME}" in ${language}. 
                Include purpose, key features, and usage steps. Use HTML tags (h3, p, ul, li).`;

                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: prompt
                });

                if (response && response.text) {
                    newContent[activeSection] = response.text;
                }
            }

            setManualContent(newContent);
        } catch (error) {
            console.error("Error generating manual:", error);
            setManualContent(STATIC_MANUAL);
        }
        setIsGenerating(false);
    };

    useEffect(() => {
        generateManual();
    }, [language]);

    const downloadPDF = async () => {
        if (!manualRef.current) return;

        const canvas = await html2canvas(manualRef.current, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${APP_NAME}_User_Manual_${language}.pdf`);
    };

    const MockScreenshot = ({ title, icon: Icon }: { title: string, icon: any }) => (
        <div className="my-6 bg-slate-100 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner">
            <div className="bg-slate-200 px-4 py-2 flex items-center justify-between border-b border-slate-300">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title} Preview</div>
                <div className="w-10"></div>
            </div>
            <div className="p-8 flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                <Icon size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Visual Interface Representation</p>
                <div className="mt-6 w-full max-w-md space-y-3">
                    <div className="h-2 bg-slate-200 rounded-full w-3/4 mx-auto"></div>
                    <div className="h-2 bg-slate-200 rounded-full w-1/2 mx-auto"></div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="h-12 bg-slate-200 rounded-xl"></div>
                        <div className="h-12 bg-slate-200 rounded-xl"></div>
                        <div className="h-12 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <BookOpen className="text-teal-600" size={32} />
                        Interactive User Manual
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        Comprehensive guide for {APP_NAME} • Automatically updated with system changes.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                        <Globe size={16} className="text-slate-400" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.name}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
                    >
                        <Download size={16} /> Download PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-2">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sticky top-24">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-4">Manual Sections</h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveSection('Introduction')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${activeSection === 'Introduction' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Introduction
                                {activeSection === 'Introduction' && <ChevronRight size={14} />}
                            </button>
                            {MENU_GROUPS.map(group => (
                                <div key={group.group} className="pt-2">
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1 px-4">{group.group}</p>
                                    {group.items.map(item => (
                                        <button
                                            key={item.name}
                                            onClick={() => setActiveSection(item.name)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${activeSection === item.name ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {item.name}
                                            {activeSection === item.name && <ChevronRight size={14} />}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
                        {isGenerating && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                                <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl animate-bounce mb-4">
                                    <Sparkles size={32} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">Updating Manual...</h3>
                                <p className="text-xs text-slate-500 font-medium">Synchronizing with system modules in {language}</p>
                            </div>
                        )}

                        <div ref={manualRef} className="p-12 manual-content relative">
                            {/* Watermark */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-35deg] select-none">
                                <div className="text-[120px] font-black text-slate-900 whitespace-nowrap">
                                    DEVELOPED BY VISIONARY CARE
                                </div>
                            </div>

                            {/* Manual Header for PDF */}
                            <div className="mb-12 border-b-4 border-slate-900 pb-8 flex justify-between items-end">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">V</div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{APP_NAME}</h2>
                                    </div>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Official User Documentation • v2.5</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-900 uppercase">Company: Visionary Care Solutions</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase mt-1">Language: {language}</p>
                                </div>
                            </div>

                            {/* Active Section Content */}
                            <div className="prose prose-slate max-w-none">
                                {manualContent[activeSection] ? (
                                    <div
                                        className="manual-body"
                                        dangerouslySetInnerHTML={{ __html: manualContent[activeSection] }}
                                    />
                                ) : (
                                    <div className="py-20 text-center">
                                        <Info size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-400 font-medium">Content is being generated for this section...</p>
                                    </div>
                                )}
                            </div>

                            {/* Mock Screenshot for the section */}
                            {activeSection !== 'Introduction' && (
                                <MockScreenshot
                                    title={activeSection}
                                    icon={MENU_ITEMS.find(i => i.name === activeSection)?.icon || Layout}
                                />
                            )}

                            {/* Footer for PDF */}
                            <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <div>© {new Date().getFullYear()} Visionary Care Solutions. All Rights Reserved.</div>
                                <div>Page {MENU_GROUPS.flatMap(g => g.items).findIndex(i => i.name === activeSection) + 2}</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-4">
                                <MousePointer2 size={20} />
                            </div>
                            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight mb-2">Navigation</h4>
                            <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">Use the sidebar to switch between modules. The top bar provides quick search and command palette access.</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm mb-4">
                                <Plus size={20} />
                            </div>
                            <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight mb-2">Quick Actions</h4>
                            <p className="text-xs text-emerald-700/70 font-medium leading-relaxed">Look for the "+" buttons to quickly add new records like patients, appointments, or prescriptions.</p>
                        </div>
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm mb-4">
                                <Search size={20} />
                            </div>
                            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-2">Global Search</h4>
                            <p className="text-xs text-amber-700/70 font-medium leading-relaxed">Press Ctrl+K (or Cmd+K) to open the command palette and search for anything across the system.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .manual-body h2 { font-size: 2rem; font-weight: 900; color: #0f172a; margin-bottom: 1.5rem; letter-spacing: -0.025em; }
                .manual-body h3 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin-top: 2rem; margin-bottom: 1rem; }
                .manual-body p { font-size: 0.875rem; line-height: 1.75; color: #475569; margin-bottom: 1.25rem; font-weight: 500; }
                .manual-body ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
                .manual-body li { font-size: 0.875rem; line-height: 1.75; color: #475569; margin-bottom: 0.5rem; font-weight: 500; }
                .manual-body strong { color: #0f172a; font-weight: 700; }
                @media print {
                    .manual-content { padding: 0 !important; }
                    .manual-body p, .manual-body li { font-size: 10pt !important; }
                }
            `}</style>
        </div>
    );
};

export default UserManual;
