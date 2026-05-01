import { useState, useRef, useCallback, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { createPortal } from 'react-dom';
import { SearchInput, SearchResults } from '@azrtydxb/ui';
import { api, SearchResult } from '../../lib/api';

interface SearchBarProps {
  onSelect: (path: string) => void;
  inputRef?: React.MutableRefObject<HTMLInputElement | undefined>;
}

/**
 * Header search bar — wraps @azrtydxb/ui SearchInput + SearchResults.
 * Renders the dropdown via a portal so it escapes the header's stacking context.
 */
export function SearchBar({ onSelect, inputRef: externalRef }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.search(q);
      setResults(res);
      setOpen(true);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    doSearch(value);
  }, 200);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleSelect = useCallback((result: SearchResult) => {
    const path = result.isShared && result.ownerUserId
      ? `shared:${result.ownerUserId}:${result.path}`
      : result.path;
    onSelect(path);
    setQuery('');
    setResults([]);
    setOpen(false);
  }, [onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [open, results, selectedIndex, handleSelect]);

  const updateDropdownPos = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updateDropdownPos();
      window.addEventListener('resize', updateDropdownPos);
      window.addEventListener('scroll', updateDropdownPos, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPos);
        window.removeEventListener('scroll', updateDropdownPos, true);
      };
    }
  }, [open, updateDropdownPos]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchInput
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        loading={loading}
        placeholder="Search notes... (Ctrl+K)"
        inputRef={externalRef}
      />

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 99999,
          }}
          className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg overflow-hidden"
        >
          <SearchResults
            results={results}
            loading={loading}
            query={query}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            onHover={setSelectedIndex}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
