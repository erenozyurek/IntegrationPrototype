'use client';

import { useState } from 'react';

type NavItem = 'dashboard' | 'products' | 'add-product' | 'orders' | 'inventory' | 'marketplaces' | 'analytics' | 'settings';

interface SidebarProps {
  activeView: NavItem;
  onNavigate: (view: NavItem) => void;
}

export default function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm overflow-y-auto">
      {/* Logo/Brand Area */}
      <div className="px-6 py-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Aserai Entegrasyon
        </h1>
        <p className="text-sm text-gray-500 mt-1">Yönetim Paneli</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {/* Dashboard */}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Ana Sayfa</span>
            {activeView === 'dashboard' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100"></div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Ürün Yönetimi
          </p>

          {/* Products */}
          <button
            onClick={() => onNavigate('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'products'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Ürünler</span>
            {activeView === 'products' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          {/* Add Product */}
          <button
            onClick={() => onNavigate('add-product')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'add-product'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Ürün Ekle</span>
            {activeView === 'add-product' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          {/* Inventory */}
          <button
            onClick={() => onNavigate('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'inventory'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <span>Stok Yönetimi</span>
            {activeView === 'inventory' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100"></div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Satış & Pazaryerleri
          </p>

          {/* Orders */}
          <button
            onClick={() => onNavigate('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'orders'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Siparişler</span>
            {activeView === 'orders' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          {/* Marketplaces */}
          <button
            onClick={() => onNavigate('marketplaces')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'marketplaces'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Pazaryerleri</span>
            {activeView === 'marketplaces' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100"></div>
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Raporlama
          </p>

          {/* Analytics */}
          <button
            onClick={() => onNavigate('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'analytics'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analitik</span>
            {activeView === 'analytics' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            )}
          </button>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100"></div>

          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
              activeView === 'settings'
                ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Ayarlar</span>
            {activeView === 'settings' && (
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
