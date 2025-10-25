'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ProductsGrid from './components/ProductsGrid';
import AddProductForm from './components/AddProductForm';

type View = 'products' | 'add-product';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('products');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      
      {/* Main Content Area - Dynamic based on active view */}
      <main className="ml-64 flex-1 min-h-screen">
        {activeView === 'products' ? <ProductsGrid /> : <AddProductForm />}
      </main>
    </div>
  );
}
