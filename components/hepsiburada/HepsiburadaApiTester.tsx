'use client';

import { useState } from 'react';
import { HepsiburadaListingTestResponse } from '@/lib/integrations/hepsiburada/types';

const DEFAULT_JSON = `[
  {
    "categoryId": 18021982,
    "merchant": "6fc6d90d-ee1d-4372-b3a6-264b1275e9ff",
    "attributes": {
      "merchantSku": "SAMPLE-SKU-INT-0",
      "VaryantGroupID": "Hepsiburada0",
      "Barcode": "1234567891234",
      "UrunAdi": "Roth Tyler",
      "UrunAciklamasi": "Ürün açıklaması test...",
      "Marka": "Nike",
      "GarantiSuresi": 24,
      "kg": "1",
      "tax_vat_rate": "5",
      "price": "130,50",
      "stock": "13",
      "Image1": "https://productimages.hepsiburada.net/s/27/552/10194862145586.jpg",
      "Image2": "https://productimages.hepsiburada.net/s/27/552/10194862145586.jpg",
      "Image3": "https://productimages.hepsiburada.net/s/27/552/10194862145586.jpg",
      "Image4": "https://productimages.hepsiburada.net/s/27/552/10194862145586.jpg",
      "Image5": "https://productimages.hepsiburada.net/s/27/552/10194862145586.jpg",
      "Video1": "https://images.hepsiburada.net/assets/videos/ProductVideos/iphone11.mp4",
      "renk_variant_property": "Siyah",
      "ebatlar_variant_property": "Büyük Ebat"
    }
  }
]`;

export default function HepsiburadaApiTester() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON);
  const [response, setResponse] = useState<HepsiburadaListingTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    setResponse(null);

    try {
      // Validate JSON
      let parsedJson;
      try {
        parsedJson = JSON.parse(jsonInput);
      } catch (e) {
        setResponse({
          success: false,
          message: '❌ Geçersiz JSON formatı',
          errors: ['JSON verisi geçerli değil. Lütfen kontrol edin.'],
          timestamp: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }

      // Send to API
      const apiResponse = await fetch('/api/v1/hepsiburada/test-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: parsedJson }),
      });

      const data: HepsiburadaListingTestResponse = await apiResponse.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        message: '❌ İstek gönderilirken hata oluştu',
        errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setJsonInput(DEFAULT_JSON);
    setResponse(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hepsiburada API Tester
          </h1>
          <p className="text-gray-600">
            Sol tarafta ürün JSON verisini düzenleyin, sağ tarafta API yanıtını görüntüleyin.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gönderiliyor...
              </>
            ) : (
              <>
                🚀 API'ye Gönder
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            🔄 Sıfırla
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - JSON Editor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📝 JSON Editör
            </h2>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-[600px] font-mono text-sm p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="JSON verinizi buraya yazın..."
              spellCheck={false}
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 İpucu: JSON verisini düzenleyip "API'ye Gönder" butonuna basın.
            </p>
          </div>

          {/* Right Side - Response Viewer */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📊 API Yanıtı
            </h2>
            
            {!response && !isLoading && (
              <div className="flex items-center justify-center h-[600px] text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">Henüz istek gönderilmedi</p>
                  <p className="text-sm">Sol taraftaki JSON'ı düzenleyip "API'ye Gönder" butonuna basın</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600">API'ye istek gönderiliyor...</p>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-4">
                {/* Status Message */}
                <div className={`p-4 rounded-lg ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-semibold ${response.success ? 'text-green-800' : 'text-red-800'}`}>
                    {response.message}
                  </p>
                  {response.statusCode && (
                    <p className="text-sm text-gray-600 mt-1">
                      HTTP Status: {response.statusCode}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(response.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>

                {/* Errors */}
                {response.errors && response.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">❌ Hatalar:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {response.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* API Response */}
                {response.apiResponse && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">📄 API Yanıtı:</h3>
                    <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(response.apiResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Tips for fixing errors */}
                {!response.success && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">💡 Hata Düzeltme İpuçları:</h3>
                    
                    {/* Check if it's an authentication error */}
                    {response.statusCode === 401 || response.errors?.some(e => e.includes('401') || e.includes('Unauthorized') || e.includes('KİMLİK DOĞRULAMA')) ? (
                      <div className="bg-red-50 border border-red-300 rounded p-3 mb-3">
                        <p className="font-semibold text-red-800 mb-2">🔐 KİMLİK DOĞRULAMA HATASI</p>
                        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                          <li><strong>Bu bir veri hatası değil, kimlik doğrulama problemidir!</strong></li>
                          <li>.env.local dosyasındaki credentials kontrol edin (zaten yapılandırılmış olmalı)</li>
                          <li>Development sunucusunu yeniden başlattınız mı? (npm run dev)</li>
                          <li>Terminal'deki credential log'larını kontrol edin</li>
                          <li>Hepsiburada test credentials: Username=MerchantID, Password=SecretKey</li>
                        </ul>
                      </div>
                    ) : (
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>Sol taraftaki JSON'da gerekli alanları kontrol edin</li>
                        <li>Barcode, merchantSku gibi zorunlu alanların dolu olduğundan emin olun</li>
                        <li>Fiyat ve stok formatlarının doğru olduğunu kontrol edin</li>
                        <li>Görsel URL'lerinin erişilebilir olduğunu doğrulayın</li>
                        <li>Düzeltme yaptıktan sonra tekrar "API'ye Gönder" butonuna basın</li>
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Önemli Notlar</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><strong>Test Ortamı:</strong> Bu test arayüzü Hepsiburada resmi test ortamı credentials'ları ile yapılandırılmıştır.</li>
            <li><strong>Test Portal:</strong> Ürünleri merchant-sit.hepsiburada.com adresinden kontrol edebilirsiniz (sedanurtoksoz1@gmail.com / Hb12345!)</li>
            <li><strong>401 Unauthorized hatası alıyorsanız:</strong> Development sunucusunu yeniden başlatın (npm run dev)</li>
            <li>Hepsiburada API'si bazen eksik alanlar olsa bile "başarılı" yanıtı döndürebilir.</li>
            <li>API'den başarılı yanıt alsanız bile ürünün Hepsiburada test panelinde görünüp görünmediğini kontrol edin.</li>
            <li>Tüm zorunlu alanların dolu olduğundan ve formatların doğru olduğundan emin olun.</li>
            <li>Hata alırsanız, sol taraftaki JSON'ı düzeltip sayfa yenilemeden tekrar gönderebilirsiniz.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
