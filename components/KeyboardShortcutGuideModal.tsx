import React from 'react';
import { X, Command, CornerDownLeft, ArrowLeft, Printer, Save, Search, HelpCircle, Navigation } from 'lucide-react';

interface KeyboardShortcutGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  secondaryKey?: string;
  description: string;
  category: 'Navigation' | 'Forms & Entry' | 'Actions & Tools';
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  { key: 'Esc', description: 'Go Back to previous page / Close open modal or dialog', category: 'Navigation' },
  { key: 'F1', secondaryKey: '?', description: 'Open Keyboard Shortcuts Help Guide', category: 'Navigation' },
  { key: 'F2', secondaryKey: 'Alt + N', description: 'Quick Jump: Patient Registration', category: 'Navigation' },
  { key: 'F3', secondaryKey: 'Alt + P', description: 'Quick Jump: Patient Directory / List', category: 'Navigation' },
  { key: 'F4', secondaryKey: 'Alt + O', description: 'Quick Jump: OPD Consultation Queue', category: 'Navigation' },
  { key: 'F6', secondaryKey: 'Alt + B', description: 'Quick Jump: Patient Billing & Cashier', category: 'Navigation' },
  { key: 'F7', secondaryKey: 'Alt + R', description: 'Quick Jump: E-Prescription Module', category: 'Navigation' },
  { key: 'F8', secondaryKey: 'Alt + I', description: 'Quick Jump: IPD In-Patient Management', category: 'Navigation' },
  { key: 'F9', secondaryKey: 'Alt + L', description: 'Quick Jump: Laboratory & Diagnostics', category: 'Navigation' },
  { key: 'F10', secondaryKey: 'Alt + M', description: 'Quick Jump: Pharmacy & Medicine Store', category: 'Navigation' },
  { key: 'Alt + H', secondaryKey: 'Alt + D', description: 'Go to Central Dashboard', category: 'Navigation' },

  // Forms & Entry
  { key: 'Enter', description: 'Advance focus to next form field', category: 'Forms & Entry' },
  { key: 'Shift + Enter', description: 'Move focus back to previous form field', category: 'Forms & Entry' },
  { key: 'Ctrl + S', secondaryKey: '⌘ + S', description: 'Save & Submit active form (Save Patient)', category: 'Forms & Entry' },
  { key: 'Ctrl + P', secondaryKey: '⌘ + P', description: 'Open Print Settings & Document Preview', category: 'Forms & Entry' },
  { key: '↑ / ↓', description: 'Navigate search suggestions and dropdowns', category: 'Forms & Entry' },

  // Actions & Tools
  { key: 'Ctrl + K', secondaryKey: '⌘ + K', description: 'Global Command Palette & Quick Search', category: 'Actions & Tools' }
];

export const KeyboardShortcutGuideModal: React.FC<KeyboardShortcutGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
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

  if (!isOpen) return null;

  const categories: Array<'Navigation' | 'Forms & Entry' | 'Actions & Tools'> = [
    'Navigation',
    'Forms & Entry',
    'Actions & Tools'
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Command size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Keyboard Navigation & Shortcuts
                <span className="text-[10px] font-mono bg-teal-600/40 text-teal-300 px-2 py-0.5 rounded border border-teal-500/40">
                  Full Keyboard Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Operate the entire hospital system without reaching for a mouse
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close [Esc]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
          {categories.map(category => {
            const items = SHORTCUTS.filter(s => s.category === category);
            return (
              <div key={category} className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  {category === 'Navigation' && <Navigation size={13} className="text-teal-600" />}
                  {category === 'Forms & Entry' && <CornerDownLeft size={13} className="text-teal-600" />}
                  {category === 'Actions & Tools' && <Command size={13} className="text-teal-600" />}
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-teal-50/40 border border-slate-100 transition-colors"
                    >
                      <span className="text-slate-700 font-medium text-xs">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <kbd className="px-2.5 py-1 text-xs font-bold font-mono bg-white text-slate-800 border border-slate-300 rounded-md shadow-xs min-w-[32px] text-center">
                          {item.key}
                        </kbd>
                        {item.secondaryKey && (
                          <>
                            <span className="text-slate-400 text-xs">or</span>
                            <kbd className="px-2 py-1 text-xs font-bold font-mono bg-white text-slate-600 border border-slate-300 rounded-md shadow-xs">
                              {item.secondaryKey}
                            </kbd>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <span>
            Press <kbd className="font-bold font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded shadow-xs">Esc</kbd> anytime to go back or close.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Got it (Esc)
          </button>
        </div>

      </div>
    </div>
  );
};

export default KeyboardShortcutGuideModal;
