'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TemuCategoryTreeNode } from '@/lib/integrations/temu/cache';

interface CategoryBrowserProps {
  categoryTree: TemuCategoryTreeNode[];
  onSelect: (category: { id: number; name: string; path: string }) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
  selectedCategoryId: number | null;
  isLoading: boolean;
  marketplaceName: string;
}

interface SearchResult {
  catId: number;
  catName: string;
  displayName?: string;
  pathString: string;
  path?: string[];
  leaf: boolean;
}

export default function TemuCategoryBrowser({
  categoryTree,
  onSelect,
  onSearch,
  selectedCategoryId,
  isLoading,
}: CategoryBrowserProps) {
  const [mode, setMode] = useState<'browse' | 'search'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Debounced search
  useEffect(() => {
    if (mode !== 'search' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearch(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mode, onSearch]);

  const toggleNode = useCallback((nodeKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });
  }, []);

  const handleSelectCategory = useCallback((categoryId: number, name: string, path: string) => {
    onSelect({ id: categoryId, name, path });
    // Switch back to browse mode after selection
    setMode('browse');
    setSearchQuery('');
  }, [onSelect]);

  // Render a tree node
  const renderTreeNode = useCallback((node: TemuCategoryTreeNode, depth: number = 0): React.ReactNode => {
    const nodeKey = node.pathString || `${node.catId}`;
    const isExpanded = expandedNodes.has(nodeKey);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.leaf && node.catId === selectedCategoryId;
    const isVirtual = node.catId === 0; // Virtual parent nodes

    return (
      <div key={nodeKey} className="select-none">
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${isSelected ? 'bg-orange-100 border border-orange-300' : 'hover:bg-gray-100'}
            ${depth > 0 ? 'ml-' + Math.min(depth * 4, 12) : ''}
          `}
          style={{ marginLeft: depth * 16 }}
          onClick={() => {
            if (node.leaf && node.catId !== 0) {
              handleSelectCategory(node.catId, node.name, node.pathString);
            } else if (hasChildren) {
              toggleNode(nodeKey);
            }
          }}
        >
          {/* Expand/Collapse icon */}
          {hasChildren && (
            <button
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(nodeKey);
              }}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!hasChildren && <span className="w-5" />}

          {/* Folder/Leaf icon */}
          <span className="text-lg">
            {node.leaf ? '📄' : isExpanded ? '📂' : '📁'}
          </span>

          {/* Name */}
          <span className={`flex-1 text-sm ${isVirtual ? 'font-medium text-gray-700' : 'text-gray-800'}`}>
            {node.name}
          </span>

          {/* Selected indicator */}
          {isSelected && (
            <span className="text-orange-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-gray-200">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, selectedCategoryId, handleSelectCategory, toggleNode]);

  // Render search results
  const renderSearchResults = useMemo(() => {
    if (isSearching) {
      return (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Aranıyor...
        </div>
      );
    }

    if (searchQuery && searchResults.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>&quot;{searchQuery}&quot; için sonuç bulunamadı</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {searchResults.map(result => {
          const isSelected = result.catId === selectedCategoryId;
          return (
            <div
              key={result.catId}
              className={`
                px-3 py-3 rounded-lg cursor-pointer transition-colors
                ${isSelected ? 'bg-orange-100 border border-orange-300' : 'hover:bg-gray-100 border border-transparent'}
              `}
              onClick={() => handleSelectCategory(
                result.catId, 
                result.displayName || result.catName, 
                result.pathString
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <span className="font-medium text-gray-900">
                  {result.displayName || result.catName}
                </span>
                {isSelected && (
                  <span className="ml-auto text-orange-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                {result.pathString}
              </p>
            </div>
          );
        })}
      </div>
    );
  }, [searchQuery, searchResults, isSearching, selectedCategoryId, handleSelectCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Kategoriler yükleniyor...
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header with mode toggle */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center gap-2">
          {/* Mode toggle buttons */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-0.5">
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'browse' 
                  ? 'bg-orange-100 text-orange-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setMode('browse')}
            >
              📁 Gözat
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'search' 
                  ? 'bg-orange-100 text-orange-700 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setMode('search')}
            >
              🔍 Ara
            </button>
          </div>

          {/* Search input (only in search mode) */}
          {mode === 'search' && (
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kategori adı yazın..."
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto p-2">
        {mode === 'browse' ? (
          categoryTree.length > 0 ? (
            <div className="space-y-0.5">
              {categoryTree.map(node => renderTreeNode(node))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Kategori ağacı yüklenemedi</p>
            </div>
          )
        ) : (
          renderSearchResults
        )}
      </div>

      {/* Footer info */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
        {mode === 'browse' 
          ? '💡 Klasörlere tıklayarak açın, yaprak kategorileri seçin'
          : '💡 Kategori adını yazarak arayın'
        }
      </div>
    </div>
  );
}
