/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiSearch, FiX, FiClock } from 'react-icons/fi';
import { useDebounce } from '../../../hooks/useDebounce';
import { useSearchHistory } from '../../../hooks/useSearchHistory';
import '../style/SmartSearchBox.css';

export interface SearchSuggestion {
  id: string;
  text: string;
  type?: string;
  icon?: React.ReactNode;
  metadata?: any;
}

interface SmartSearchBoxProps {
  // Value và handlers
  value?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion | string) => void;
  onClear?: () => void;
  
  // Suggestions
  suggestions?: SearchSuggestion[];
  fetchSuggestions?: (query: string) => Promise<SearchSuggestion[]>;
  showSuggestions?: boolean;
  
  // History
  enableHistory?: boolean;
  historyStorageKey?: string;
  maxHistory?: number;
  
  // UI
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  autoFocus?: boolean;
  
  // Options
  debounceMs?: number;
  minQueryLength?: number;
  showHistoryWhenEmpty?: boolean;
  
  // Callbacks
  onFocus?: () => void;
  onBlur?: () => void;
  clearOnSearch?: boolean;
}

const SmartSearchBox: React.FC<SmartSearchBoxProps> = ({
  value: controlledValue,
  onSearch,
  onSuggestionSelect,
  suggestions: externalSuggestions,
  fetchSuggestions,
  showSuggestions: externalShowSuggestions,
  enableHistory = true,
  historyStorageKey = 'global_search_history',
  maxHistory = 10,
  placeholder = 'Tìm kiếm...',
  className = '',
  size = 'md',
  autoFocus = false,
  debounceMs = 300,
  minQueryLength = 1,
  showHistoryWhenEmpty = true,
  onFocus,
  onBlur,
  onClear,
  clearOnSearch = false,
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync với controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // History hook
  const { history, addHistory, removeHistory, clearHistory } = useSearchHistory({
    storageKey: historyStorageKey,
    maxHistory,
  });

  // Debounced value
  const debouncedValue = useDebounce(internalValue, debounceMs);

  // Fetch suggestions
  useEffect(() => {
    if (!fetchSuggestions || !debouncedValue.trim() || debouncedValue.trim().length < minQueryLength) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchSuggestions(debouncedValue.trim())
      .then(results => {
        setSuggestions(results || []);
        setIsLoading(false);
      })
      .catch(() => {
        setSuggestions([]);
        setIsLoading(false);
      });
  }, [debouncedValue, fetchSuggestions, minQueryLength]);

  // Sử dụng external suggestions nếu có
  const displaySuggestions = useMemo(() => {
    return externalSuggestions !== undefined ? externalSuggestions : suggestions;
  }, [externalSuggestions, suggestions]);

  // Show/hide suggestions
  useEffect(() => {
    const shouldShow = 
      isFocused &&
      (externalShowSuggestions !== undefined ? externalShowSuggestions : (
        (internalValue.trim().length >= minQueryLength && displaySuggestions.length > 0) ||
        (showHistoryWhenEmpty && enableHistory && internalValue.trim().length === 0 && history.length > 0)
      ));
    
    setShowSuggestions(shouldShow);
  }, [isFocused, internalValue, displaySuggestions, history, externalShowSuggestions, showHistoryWhenEmpty, enableHistory, minQueryLength]);

  // Click outside để đóng suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    setSelectedIndex(-1);
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = internalValue.trim();
    if (!trimmedValue) {
      onSearch('');
      if (clearOnSearch) {
        setInternalValue('');
        setSuggestions([]);
        setSelectedIndex(-1);
      }
      setShowSuggestions(false);
      return;
    }

    if (enableHistory) {
      addHistory(trimmedValue);
    }
    onSearch(trimmedValue);
    if (clearOnSearch) {
      setInternalValue('');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
    setShowSuggestions(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion | string) => {
    const searchText = typeof suggestion === 'string' ? suggestion : suggestion.text;
    setInternalValue(searchText);

    if (enableHistory && searchText.trim()) {
      addHistory(searchText);
    }

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onSearch(searchText);
    }

    setShowSuggestions(false);
    if (clearOnSearch) {
      setInternalValue('');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
    inputRef.current?.blur();
  };

  // Handle history click
  const handleHistoryClick = (term: string) => {
    setInternalValue(term);
    onSearch(term);
    if (clearOnSearch) {
      setInternalValue('');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Handle clear
  const handleClear = () => {
    setInternalValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
    if (onClear) {
      onClear();
    } else {
      onSearch('');
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    const items = [
      ...(showHistoryWhenEmpty && enableHistory && internalValue.trim().length === 0 ? history.map((h:any) => ({ id: h, text: h, type: 'history' } as SearchSuggestion)) : []),
      ...displaySuggestions
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const item = items[selectedIndex];
          if (item.type === 'history') {
            handleHistoryClick(item.text);
          } else {
            handleSuggestionClick(item);
          }
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    // Delay để cho phép click vào suggestions
    setTimeout(() => {
      setIsFocused(false);
      if (onBlur) onBlur();
    }, 200);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.querySelector(
        `.search-suggestion-item:nth-child(${selectedIndex + 1})`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const items = [
    ...(showHistoryWhenEmpty && enableHistory && internalValue.trim().length === 0 && history.length > 0
      ? history.map((h:any) => ({ id: h, text: h, type: 'history' } as SearchSuggestion))
      : []),
    ...displaySuggestions
  ];


  return (
    <div ref={containerRef} className={`smart-search-box ${className} size-${size}`}>
      <form onSubmit={handleSubmit} className="smart-search-form">
        <div className="smart-search-input-wrapper">
          <FiSearch className="smart-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={internalValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="smart-search-input"
            autoFocus={autoFocus}
            autoComplete="off"
          />
          {internalValue && (
            <button
              type="button"
              onClick={handleClear}
              className="smart-search-clear"
              aria-label="Xóa tìm kiếm"
            >
              <FiX />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && (
        <div ref={suggestionsRef} className="smart-search-suggestions">
          {isLoading && (
            <div className="search-suggestion-loading">Đang tìm kiếm...</div>
          )}

          {!isLoading && items.length === 0 && internalValue.trim().length >= minQueryLength && (
            <div className="search-suggestion-empty">Không tìm thấy kết quả</div>
          )}

          {!isLoading && items.length > 0 && (
            <>
              {/* History section */}
              {enableHistory && internalValue.trim().length === 0 && history.length > 0 && (
                <div className="search-suggestions-section">
                  <div className="search-suggestions-header">
                    <span>Lịch sử tìm kiếm</span>
                    <button
                      type="button"
                      onClick={clearHistory}
                      className="search-suggestions-clear-all"
                      title="Xóa tất cả lịch sử"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  {history.map((term :any , idx : any) => (
                    <div
                      key={`history-${term}`}
                      className={`search-suggestion-item ${idx === selectedIndex ? 'selected' : ''} history`}
                      onClick={() => handleHistoryClick(term)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <FiClock className="search-suggestion-icon" />
                      <span className="search-suggestion-text">{term}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistory(term);
                        }}
                        className="search-suggestion-remove"
                        title="Xóa"
                      >
                        <FiX size={14} />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions section */}
              {displaySuggestions.length > 0 && (
                <div className="search-suggestions-section">
                  {enableHistory && internalValue.trim().length === 0 && history.length > 0 && (
                    <div className="search-suggestions-header">Gợi ý</div>
                  )}
                  {displaySuggestions.map((suggestion, idx) => {
                    const actualIdx = enableHistory && internalValue.trim().length === 0 && history.length > 0
                      ? history.length + idx
                      : idx;
                    return (
                      <div
                        key={suggestion.id || `suggestion-${idx}`}
                        className={`search-suggestion-item ${actualIdx === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setSelectedIndex(actualIdx)}
                      >
                        {suggestion.icon && (
                          <span className="search-suggestion-icon">{suggestion.icon}</span>
                        )}
                        <span className="search-suggestion-text">{suggestion.text || 'Không có tên'}</span>
                        {suggestion.type && (
                          <span className="search-suggestion-type">{suggestion.type}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBox;