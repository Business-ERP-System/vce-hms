import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CustomDatePickerProps {
    name?: string;
    value: string; // YYYY-MM-DD
    onChange: (e: { target: { name: string; value: string } }) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    id?: string;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Convert YYYY-MM-DD to DD-MM-YYYY for display
const toDisplayDate = (isoStr: string): string => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoStr;
};

// Convert DD-MM-YYYY or YYYY-MM-DD to standard YYYY-MM-DD
const toIsoDate = (input: string): string => {
    if (!input) return '';
    const clean = input.trim();
    // Match DD-MM-YYYY or DD/MM/YYYY
    const dmy = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmy) {
        const dd = dmy[1].padStart(2, '0');
        const mm = dmy[2].padStart(2, '0');
        const yyyy = dmy[3];
        return `${yyyy}-${mm}-${dd}`;
    }
    // Match YYYY-MM-DD
    const ymd = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymd) {
        const yyyy = ymd[1];
        const mm = ymd[2].padStart(2, '0');
        const dd = ymd[3].padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    return '';
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    name = 'dob',
    value,
    onChange,
    placeholder = 'dd-mm-yyyy',
    required = false,
    className = '',
    onKeyDown,
    id
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'yearMonth'>('calendar');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial display value in DD-MM-YYYY
    const [displayText, setDisplayText] = useState(() => toDisplayDate(value));

    // Keep displayText in sync when value changes externally (e.g., age calculation)
    useEffect(() => {
        setDisplayText(toDisplayDate(value));
    }, [value]);

    // View state for current calendar month/year
    const parseInitialDate = () => {
        if (value) {
            const parts = value.split('-');
            if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                    return new Date(y, m, d);
                }
            }
        }
        return new Date();
    };

    const [viewDate, setViewDate] = useState<Date>(parseInitialDate);

    // Update viewDate when value changes
    useEffect(() => {
        if (value) {
            const parts = value.split('-');
            if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                    setViewDate(new Date(y, m, d));
                }
            }
        }
    }, [value]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setViewMode('calendar');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewYear, viewMonth - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewYear, viewMonth + 1, 1));
    };

    const handleSelectDay = (day: number) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const iso = `${viewYear}-${mm}-${dd}`;
        setDisplayText(`${dd}-${mm}-${viewYear}`);
        onChange({ target: { name, value: iso } });
        setIsOpen(false);
        setViewMode('calendar');

        // Trigger onKeyDown if enter behavior is requested
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // User types into input box directly
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setDisplayText(text);
        const iso = toIsoDate(text);
        if (iso) {
            onChange({ target: { name, value: iso } });
        } else if (text.trim() === '') {
            onChange({ target: { name, value: '' } });
        }
    };

    // Build calendar days
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Check if a day is the selected date
    const isSelected = (day: number) => {
        if (!value) return false;
        const parts = value.split('-');
        if (parts.length !== 3) return false;
        const valYear = parseInt(parts[0], 10);
        const valMonth = parseInt(parts[1], 10) - 1;
        const valDay = parseInt(parts[2], 10);
        return valYear === viewYear && valMonth === viewMonth && valDay === day;
    };

    // Check if day is today
    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getFullYear() === viewYear &&
            today.getMonth() === viewMonth &&
            today.getDate() === day
        );
    };

    // Fast Year / Month switcher (supports past birth dates and future expiry dates)
    const yearsList = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 20; y >= 1920; y--) {
        yearsList.push(y);
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    name={name}
                    required={required}
                    value={displayText}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setIsOpen(false);
                        }
                        if (onKeyDown) onKeyDown(e);
                    }}
                    placeholder={placeholder}
                    className={`w-full px-2.5 py-1 pr-8 border border-slate-200 rounded-md text-[16px] font-medium text-slate-900 bg-white focus:ring-1 focus:ring-teal-500 outline-none ${className}`}
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                        setIsOpen(prev => !prev);
                        setViewMode('calendar');
                    }}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                    title="Open calendar"
                >
                    <CalendarIcon size={16} />
                </button>
            </div>

            {/* Dropdown Calendar Popup */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-2xl border border-slate-200 w-[280px] sm:w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
                >
                    {/* Header Banner - Matches Image with #009647 Vibrant Green */}
                    <div className="bg-[#009647] text-white px-3 py-2.5 flex items-center justify-between">
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={handlePrevMonth}
                            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
                            title="Previous Month"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setViewMode(prev => prev === 'calendar' ? 'yearMonth' : 'calendar')}
                            className="font-bold text-[17px] text-white hover:bg-white/15 px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1"
                            title="Click to jump year or month"
                        >
                            <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                        </button>

                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={handleNextMonth}
                            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
                            title="Next Month"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Fast Year/Month Picker View */}
                    {viewMode === 'yearMonth' ? (
                        <div className="p-3 bg-slate-50 space-y-2.5">
                            <div className="flex items-center justify-between border-b pb-1.5">
                                <span className="text-[13px] font-bold text-slate-700">Quick Select Year & Month</span>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('calendar')}
                                    className="text-[12px] font-bold text-emerald-700 hover:underline"
                                >
                                    Done
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Year</label>
                                    <select
                                        value={viewYear}
                                        onChange={(e) => setViewDate(new Date(parseInt(e.target.value, 10), viewMonth, 1))}
                                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-[14px] font-bold text-slate-900 outline-none"
                                        size={6}
                                    >
                                        {yearsList.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">Month</label>
                                    <select
                                        value={viewMonth}
                                        onChange={(e) => setViewDate(new Date(viewYear, parseInt(e.target.value, 10), 1))}
                                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-[14px] font-bold text-slate-900 outline-none"
                                        size={6}
                                    >
                                        {MONTH_NAMES.map((m, idx) => (
                                            <option key={m} value={idx}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewMode('calendar')}
                                className="w-full py-1.5 bg-[#009647] hover:bg-[#00823d] text-white text-[13px] font-bold rounded transition-all"
                            >
                                Show Calendar Days
                            </button>
                        </div>
                    ) : (
                        /* Normal Calendar View */
                        <div className="p-3 bg-white">
                            {/* Weekday Row: Su Mo Tu We Th Fr Sa */}
                            <div className="grid grid-cols-7 mb-1.5">
                                {WEEKDAY_NAMES.map(d => (
                                    <div
                                        key={d}
                                        className="text-center font-bold text-slate-800 text-[14px] py-0.5"
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
                                {/* Previous month trailing days */}
                                {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                                    const prevDayNum = daysInPrevMonth - firstDayOfWeek + i + 1;
                                    return (
                                        <div
                                            key={`prev-${i}`}
                                            className="h-8 flex items-center justify-center text-[14px] font-medium text-slate-300 pointer-events-none"
                                        >
                                            {prevDayNum}
                                        </div>
                                    );
                                })}

                                {/* Current month days */}
                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const dayNum = i + 1;
                                    const sel = isSelected(dayNum);
                                    const tod = isToday(dayNum);

                                    return (
                                        <button
                                            key={dayNum}
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => handleSelectDay(dayNum)}
                                            className={`h-8 w-full flex items-center justify-center text-[14px] rounded transition-all cursor-pointer ${sel
                                                ? 'bg-[#009647] text-white font-bold shadow-sm'
                                                : tod
                                                    ? 'text-[#009647] font-bold border border-[#009647] hover:bg-emerald-50'
                                                    : 'text-slate-800 font-medium hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                        >
                                            {dayNum}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer quick action */}
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[12px]">
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => {
                                        const now = new Date();
                                        setViewDate(now);
                                        handleSelectDay(now.getDate());
                                    }}
                                    className="font-bold text-[#009647] hover:underline cursor-pointer"
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => {
                                        setDisplayText('');
                                        onChange({ target: { name, value: '' } });
                                        setIsOpen(false);
                                    }}
                                    className="text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
