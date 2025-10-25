'use client';

import { useState } from 'react';

type NavItem = 'products' | 'add-product';

interface SidebarProps {
  activeView: NavItem;
  onNavigate: (view: NavItem) => void;
}

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo/Brand Area */}
      <div className="px-6 py-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Aserai Entegrasyon
        </h1>
        <p className="text-sm text-gray-500 mt-1">Yönetim Paneli</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'products'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>Ürünler</span>
            {activeView === 'products' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          <button
            onClick={() => onNavigate('add-product')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'add-product'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Ürün Ekle</span>
            {activeView === 'add-product' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          © 2025 Aserai Entegrasyon
        </p>
      </div>
    </aside>
  );
}
