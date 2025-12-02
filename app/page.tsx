'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductsGrid from './components/ProductsGrid';
import NewProductForm from './components/NewProductForm';

type View = 'dashboard' | 'products' | 'add-product' | 'orders' | 'inventory' | 'marketplaces' | 'analytics' | 'settings';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('dashboard');

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductsGrid />;
      case 'add-product':
        return <NewProductForm />;
      case 'orders':
        return <ComingSoon title="Siparişler" />;
      case 'inventory':
        return <ComingSoon title="Stok Yönetimi" />;
      case 'marketplaces':
        return <ComingSoon title="Pazaryerleri" />;
      case 'analytics':
        return <ComingSoon title="Analitik" />;
      case 'settings':
        return <ComingSoon title="Ayarlar" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      
      {/* Main Content Area - Dynamic based on active view */}
      <main className="ml-64 flex-1 min-h-screen">
        {renderContent()}
      </main>
    </div>
  );
}

// Placeholder component for pages under development
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-indigo-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Bu özellik şu anda geliştirme aşamasındadır. Yakında kullanıma sunulacaktır.
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Yakında
        </div>
      </div>
    </div>
  );
}
