'use client';

import { useState } from 'react';

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
}

interface SendToTrendyolModalProps {
  product: TrendyolProduct;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendToTrendyolModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: SendToTrendyolModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [step, setStep] = useState<'confirm' | 'sending' | 'checking' | 'result'>('confirm');
  const [batchRequestId, setBatchRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    errors?: string;
  } | null>(null);

  const handleSend = async () => {
    setIsSending(true);
    setStep('sending');

    try {
      // Step 1: Send product to Trendyol
      const sendResponse = await fetch('/api/v1/trendyol/send-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          trendyolProduct: {
            barcode: product.barcode,
            title: product.title,
            productMainId: product.master_sku,
            stockCode: product.master_sku,
            brandId: product.brandId,
            categoryId: product.categoryId,
            quantity: product.stock,
            dimensionalWeight: 0,
            description: product.description,
            currencyType: product.currency,
            listPrice: product.price,
            salePrice: product.salePrice,
            vatRate: product.vatRate,
            cargoCompanyId: 10,
            images: product.images,
            attributes: product.attributes,
          },
          // Include variants if they exist
          variants: product.variants || null,
        }),
      });

      const sendResult = await sendResponse.json();

      if (!sendResponse.ok) {
        throw new Error(sendResult.error || 'Ürün gönderilemedi');
      }

      const batchId = sendResult.batchRequestId;
      setBatchRequestId(batchId);
      
      // Update product status to 'pending'
      await fetch('/api/v1/temp-products/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          status: 'pending',
          batchRequestId: batchId,
        }),
      });
      
      setIsSending(false);

      // Step 2: Check batch status
      setStep('checking');
      setIsChecking(true);

      // Wait 2 seconds before checking (give Trendyol time to process)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const checkResponse = await fetch(`/api/v1/trendyol/check-batch/${batchId}`);
      const checkResult = await checkResponse.json();

      setIsChecking(false);
      setStep('result');

      if (checkResult.status === 'PROCESSING') {
        // Still processing, keep status as pending
        setResult({
          success: false,
          message: 'Ürün hala işleniyor. Lütfen birkaç dakika sonra kontrol edin.',
          errors: `Batch ID: ${batchId}`,
        });
      } else if (checkResult.success) {
        // Update status to approved
        await fetch('/api/v1/temp-products/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            status: 'approved',
            batchRequestId: batchId,
          }),
        });
        
        setResult({
          success: true,
          message: checkResult.message,
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        // Update status to failed with reasons
        await fetch('/api/v1/temp-products/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            status: 'failed',
            batchRequestId: batchId,
            failureReasons: checkResult.errors ? [checkResult.errors] : [],
          }),
        });
        
        setResult({
          success: false,
          message: checkResult.message,
          errors: checkResult.errors,
        });
      }
    } catch (error) {
      console.error('Send to Trendyol error:', error);
      setIsSending(false);
      setIsChecking(false);
      setStep('result');
      setResult({
        success: false,
        message: 'Bir hata oluştu',
        errors: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    }
  };

  const handleClose = () => {
    if (!isSending && !isChecking) {
      setStep('confirm');
      setResult(null);
      setBatchRequestId(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <h2 className="text-2xl font-bold">Trendyol&apos;a Gönder</h2>
            </div>
            {step === 'confirm' && (
              <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Dikkat!</h3>
                    <p className="text-sm text-yellow-800">
                      Bu ürünü Trendyol&apos;a göndermek üzeresiniz. Bu işlem geri alınamaz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">Ürün Bilgileri</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Ürün Adı:</span>
                    <p className="font-semibold text-gray-900 mt-1">{product.title}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">SKU:</span>
                    <p className="font-semibold text-gray-900 mt-1">{product.master_sku}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Barkod:</span>
                    <p className="font-semibold text-gray-900 mt-1">{product.barcode}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fiyat:</span>
                    <p className="font-semibold text-gray-900 mt-1">{product.price.toFixed(2)} {product.currency}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Stok:</span>
                    <p className="font-semibold text-gray-900 mt-1">{product.stock} adet</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Görseller:</span>
                    <p className="font-semibold text-gray-900 mt-1">{product.images.length} adet</p>
                  </div>
                  {product.variants && product.variants.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Varyantlar:</span>
                      <p className="font-semibold text-purple-700 mt-1">
                        {product.variants.length} farklı varyant (Toplam {product.variants.reduce((sum, v) => sum + v.quantity, 0)} adet stok)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">İşlem Süreci:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Ürün Trendyol&apos;a gönderilecek</li>
                      <li>İşlem durumu kontrol edilecek</li>
                      <li>Başarılı olursa Trendyol onayı bekleyecek</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ürün Gönderiliyor...</h3>
              <p className="text-gray-600">Lütfen bekleyin, ürün Trendyol&apos;a gönderiliyor.</p>
            </div>
          )}

          {step === 'checking' && (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <svg className="w-16 h-16 text-blue-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">İşlem Durumu Kontrol Ediliyor...</h3>
              <p className="text-gray-600">Batch ID: {batchRequestId}</p>
            </div>
          )}

          {step === 'result' && result && (
            <div className="text-center py-12">
              {result.success ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 mb-3">Başarılı!</h3>
                  <p className="text-gray-700 text-lg mb-2">{result.message}</p>
                  <p className="text-sm text-gray-500">Pencere otomatik kapanacak...</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-red-600 mb-3">Hata!</h3>
                  <p className="text-gray-700 text-lg mb-4">{result.message}</p>
                  {result.errors && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                      <p className="text-sm font-medium text-red-900 mb-2">Hata Detayları:</p>
                      <p className="text-sm text-red-700">{result.errors}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'confirm' && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            >
              İptal
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Evet, Gönder
            </button>
          </div>
        )}

        {step === 'result' && !result?.success && (
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-center">
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-lg"
            >
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
