import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Check, Search } from 'lucide-react';

export interface SearchOption {
  value: string;
  label: string;
  subText?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SearchOption | string)[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  allowCustom?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  required = false,
  disabled = false,
  name,
  allowCustom = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normalize options to SearchOption objects
  const normalizedOptions = useMemo<SearchOption[]>(() => {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!isSearching || !searchTerm.trim()) {
      return normalizedOptions;
    }
    const lower = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(lower) ||
      opt.value.toLowerCase().includes(lower) ||
      (opt.subText && opt.subText.toLowerCase().includes(lower))
    );
  }, [normalizedOptions, isSearching, searchTerm]);

  // Sync search input with value when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
      setIsSearching(false);
    }
  }, [value, isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          if (isSearching) {
            if (allowCustom && searchTerm.trim() && searchTerm.trim() !== value.trim()) {
              onChange(searchTerm.trim());
            } else if (!searchTerm.trim()) {
              onChange('');
            } else {
              setSearchTerm(value || '');
            }
          }
          setIsSearching(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [allowCustom, isSearching, isOpen, onChange, searchTerm, value]);

  const handleSelectOption = (opt: SearchOption) => {
    onChange(opt.value);
    setSearchTerm(opt.value);
    setIsSearching(false);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchTerm(text);
    setIsSearching(true);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      setIsSearching(false);
      inputRef.current?.select();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsSearching(false);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleToggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(prev => {
        const next = !prev;
        if (next) {
          setIsSearching(false);
          inputRef.current?.focus();
          inputRef.current?.select();
        }
        return next;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setIsSearching(false);
      } else {
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        } else if (allowCustom && searchTerm.trim()) {
          onChange(searchTerm.trim());
          setIsSearching(false);
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsSearching(false);
      setSearchTerm(value || '');
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // When opening without active search, highlight current selected item
  useEffect(() => {
    if (isOpen && !isSearching && value) {
      const idx = filteredOptions.findIndex(
        opt => opt.value.toLowerCase() === value.toLowerCase()
      );
      if (idx >= 0) {
        setHighlightedIndex(idx);
      }
    }
  }, [isOpen, isSearching, value, filteredOptions]);

  const displayInputValue = isOpen ? (isSearching ? searchTerm : value) : value;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          name={name}
          required={required}
          disabled={disabled}
          value={displayInputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-2.5 pr-7 py-1 border rounded-md text-[16px] font-medium text-slate-900 bg-white outline-none transition-all ${disabled
            ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
            : 'border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
            }`}
        />

        <div className="absolute right-2 flex items-center gap-1 text-slate-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-600 rounded transition-colors"
              title="Clear"
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={handleToggleOpen}
            className="p-0.5 hover:text-slate-600 transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-slate-50 text-[16px]"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.slice(0, 150).map((opt, idx) => {
                const isSelected = opt.value.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    onMouseDown={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${isSelected
                      ? 'bg-teal-50 text-teal-900 font-semibold'
                      : isHighlighted
                        ? 'bg-slate-50 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.subText && (
                        <span className="text-[14px] text-slate-400 truncate font-normal">
                          {opt.subText}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-teal-600 flex-shrink-0" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-3 text-center text-slate-400 italic">
                {allowCustom && searchTerm.trim() ? (
                  <span>
                    Press Enter to use "<strong>{searchTerm}</strong>"
                  </span>
                ) : (
                  'No matching results found'
                )}
              </li>
            )}
            {filteredOptions.length > 150 && (
              <li className="px-3 py-1.5 text-center text-[10px] text-slate-400 bg-slate-50/80 font-medium">
                Showing top 150 results. Type to narrow down.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
