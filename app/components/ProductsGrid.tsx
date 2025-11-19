'use client';

import { useState, useEffect } from 'react';
import EditProductModalEnhanced from './EditProductModalEnhanced';
import SendToTrendyolModal from './SendToTrendyolModal';

interface TrendyolProductVariant {
  id: string;
  barcode: string;
  stockCode: string;
  quantity: number;
  listPrice: number;
  salePrice: number;
  variantAttributes: Array<{
    attributeId: number;
    attributeValueId: number;
  }>;
}

interface TrendyolProduct {
  id: string;
  title: string;
  description: string;
  master_sku: string;
  barcode: string;
  price: number;
  salePrice: number;
  stock: number;
  categoryId: number;
  brandId: number;
  currency: string;
  vatRate: number;
  images: { url: string }[];
  attributes: unknown[];
  variants?: TrendyolProductVariant[];
  trendyol_status?: 'not_sent' | 'pending' | 'approved' | 'failed';
  batch_request_id?: string | null;
  failure_reasons?: string[] | null;
  last_sync_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductStats {
  total_products: number;
  total_stock: number;
  average_price: number;
}

export default function ProductsGrid() {
  const [products, setProducts] = useState<TrendyolProduct[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    total_products: 0,
    total_stock: 0,
    average_price: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<TrendyolProduct | null>(null);
  const [sendingProduct, setSendingProduct] = useState<TrendyolProduct | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/v1/temp-products/list');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch products');
      }

      setProducts(result.data || []);
      setStats(result.stats || {
        total_products: 0,
        total_stock: 0,
        average_price: 0,
      });
    } catch (err) {
      console.error('Fetch products error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.title.toLowerCase().includes(query) ||
      product.master_sku.toLowerCase().includes(query) ||
      product.barcode.toLowerCase().includes(query)
    );
  });

  const handleEdit = (product: TrendyolProduct) => {
    setSelectedProductForEdit(product);
  };

  const handleSaveEdit = (updatedProduct: TrendyolProduct) => {
    // Update the product in the list
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    // Refresh products from server
    fetchProducts();
  };

  const handleSendToTrendyol = (product: TrendyolProduct) => {
    setSendingProduct(product);
    setIsSendModalOpen(true);
  };

  const handleSendSuccess = () => {
    // Optionally refresh products or show notification
    fetchProducts();
  };

  const handleCheckStatus = async (product: TrendyolProduct) => {
    setCheckingStatus(product.id);
    
    try {
      const response = await fetch(`/api/v1/trendyol/check-status/${product.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Durum kontrolü başarısız');
      }

      // Show status message
      alert(
        `${result.message}\n\n` +
        (result.failureReasons && result.failureReasons.length > 0
          ? `Reddedilme Nedenleri:\n${result.failureReasons.join('\n')}`
          : '')
      );

      // Refresh products to show updated status
      fetchProducts();
    } catch (error) {
      console.error('Status check error:', error);
      alert(error instanceof Error ? error.message : 'Durum kontrol edilemedi');
    } finally {
      setCheckingStatus(null);
    }
  };

  const handleDelete = async (productId: string) => {
    const product = products.find((p) => p.id === productId);
    
    let confirmMessage = 'Bu ürünü silmek istediğinizden emin misiniz?';
    if (product?.trendyol_status === 'approved') {
      confirmMessage += '\n\nNot: Ürün Trendyol\'da onaylı durumda. Veritabanından silinecek ancak Trendyol\'dan satıcı paneli üzerinden manuel olarak silmeniz gerekecek.';
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch('/api/v1/trendyol/delete-product', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          deleteFromTrendyol: true, // Will show warning if not possible
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete product');
      }

      // Show result message
      let message = result.message;
      message += `\n\nSilinen görseller: ${result.imagesDeleted}`;
      
      if (result.batchRequestId) {
        message += `\n\nTrendyol Batch ID: ${result.batchRequestId}`;
        message += '\nTrendyol\'dan silinme durumunu birkaç dakika sonra kontrol edin.';
      }
      
      if (result.needsManualCheck) {
        message += '\n\nNot: Silme işlemi başlatıldı ancak tamamlanıp tamamlanmadığını kontrol etmelisiniz.';
      }
      
      alert(message);

      // Remove product from list
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      alert('Ürün başarıyla silindi!');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ürünler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Hata</div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Ürünler</h1>
              <p className="text-gray-600 text-lg">Trendyol&apos;a gönderilmek üzere hazırlanan ürünler</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold">
              + Yeni Ürün Ekle
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-sm font-medium mb-2">Toplam Ürün</div>
                <div className="text-4xl font-bold">{stats.total_products}</div>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-100 text-sm font-medium mb-2">Toplam Stok</div>
                <div className="text-4xl font-bold">{stats.total_stock}</div>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-purple-100 text-sm font-medium mb-2">Ortalama Fiyat</div>
                <div className="text-4xl font-bold">{stats.average_price.toFixed(2)} ₺</div>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Ürün adı, SKU veya barkod ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-lg"
            />
            <svg
              className="absolute left-5 top-5 h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-5 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Products Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchQuery ? 'Ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                {searchQuery 
                  ? 'Arama kriterlerinize uygun ürün bulunamadı. Farklı kelimeler deneyin.' 
                  : 'İlk ürününüzü ekleyerek başlayın ve Trendyol\'a göndermeye hazır hale getirin.'}
              </p>
              {!searchQuery && (
                <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                  + İlk Ürünü Ekle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                {/* Product Image */}
                <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0].url} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      Aktif
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg min-h-[3.5rem]">
                    {product.title}
                  </h3>
                  
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">SKU</span>
                      <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                        {product.master_sku}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Barkod</span>
                      <span className="font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                        {product.barcode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Stok</span>
                      <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {product.stock} adet
                      </span>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-medium">Fiyat</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {product.price.toFixed(2)} ₺
                        </div>
                        <div className="text-xs text-gray-500">
                          KDV Dahil
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {product.trendyol_status && product.trendyol_status !== 'not_sent' && (
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        product.trendyol_status === 'approved' ? 'bg-green-100 text-green-700' :
                        product.trendyol_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        product.trendyol_status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {product.trendyol_status === 'approved' && '✓ Onaylandı'}
                        {product.trendyol_status === 'pending' && '⏳ Beklemede'}
                        {product.trendyol_status === 'failed' && '✗ Reddedildi'}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Show Send button only if not sent yet */}
                    {(!product.trendyol_status || product.trendyol_status === 'not_sent' || product.trendyol_status === 'failed') && (
                      <button 
                        onClick={() => handleSendToTrendyol(product)}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {product.trendyol_status === 'failed' ? 'Tekrar Gönder' : 'Trendyol\'a Gönder'}
                      </button>
                    )}

                    {/* Show Status/Update/Delete for sent products */}
                    {product.trendyol_status && product.trendyol_status !== 'not_sent' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCheckStatus(product)}
                          disabled={checkingStatus === product.id}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Durumu Kontrol Et"
                        >
                          {checkingStatus === product.id ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Kontrol...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Durum
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleEdit(product)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                          Güncelle
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="px-4 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold text-sm"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Show Edit/Delete for not-sent products */}
                    {(!product.trendyol_status || product.trendyol_status === 'not_sent') && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                          Düzenle
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="px-4 py-2.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-semibold text-sm"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Eklenme: {new Date(product.created_at).toLocaleDateString('tr-TR')}</span>
                    <span className="text-blue-600 font-medium">ID: {String(product.id).slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

            {/* Edit Modal */}
      {selectedProductForEdit && (
        <EditProductModalEnhanced
          product={selectedProductForEdit}
          isOpen={!!selectedProductForEdit}
          onClose={() => setSelectedProductForEdit(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Send to Trendyol Modal */}
      {sendingProduct && (
        <SendToTrendyolModal
          product={sendingProduct}
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            setSendingProduct(null);
          }}
          onSuccess={handleSendSuccess}
        />
      )}
    </div>
  );
}
