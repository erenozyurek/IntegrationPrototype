'use client';

import { useState } from 'react';

const DEFAULT_JSON = `[
  {
    "categoryId": 18021982,
    "merchant": "3f95e71f-c39e-4266-9eb4-c154807e87f7",
    "attributes": {
      "merchantSku": "SAMPLE-SKU-INT-0",
      "VaryantGroupID": "Hepsiburada0",
      "Barcode": "1234567891234",
      "UrunAdi": "Roth Tyler",
      "UrunAciklamasi": "Duis enim duis magna ex veniam elit id Lorem cillum minim nisi id aliquip. Laboris magna id est et deserunt adipisicing tempor eu ea officia ipsum deserunt.",
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

interface ApiResponse {
  success: boolean;
  message: string;
  statusCode?: number;
  data?: any;
  errors?: string[];
  timestamp: string;
  trackingId?: string;
}

interface TrackingResponse {
  success: boolean;
  message: string;
  trackingId: string;
  summary?: any;
  statusCounts?: Record<string, number>;
  data?: any;
  errors?: string[];
  timestamp: string;
}

export default function HbImportTester() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingId, setTrackingId] = useState('');
  const [trackingResponse, setTrackingResponse] = useState<TrackingResponse | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

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
      const apiResponse = await fetch('/api/hb-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedJson),
      });

      const data: ApiResponse = await apiResponse.json();
      setResponse(data);
      
      // If successful and we got a trackingId, save it for later queries
      if (data.success && data.data?.trackingId) {
        setTrackingId(data.data.trackingId);
      }
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

  const handleCheckTracking = async () => {
    if (!trackingId.trim()) {
      setTrackingResponse({
        success: false,
        message: '❌ Tracking ID boş olamaz',
        trackingId: '',
        errors: ['Lütfen geçerli bir tracking ID girin'],
        timestamp: new Date().toISOString(),
      });
      return;
    }

    setIsTrackingLoading(true);
    setTrackingResponse(null);

    try {
      const apiResponse = await fetch(`/api/hb-tracking/${trackingId}?page=0&size=20`, {
        method: 'GET',
      });

      const data: TrackingResponse = await apiResponse.json();
      setTrackingResponse(data);
    } catch (error) {
      setTrackingResponse({
        success: false,
        message: '❌ İstek gönderilirken hata oluştu',
        trackingId: trackingId,
        errors: [error instanceof Error ? error.message : 'Bilinmeyen hata'],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-900 mb-2 flex items-center gap-3">
            🏪 Hepsiburada Product Import Tester
          </h1>
          <p className="text-orange-700">
            Sol tarafta ürün JSON verisini düzenleyin, "Hepsiburada'ya Yükle" butonuna basın ve sağ tarafta API yanıtını görün.
          </p>
          <p className="text-sm text-orange-600 mt-2">
            📍 API Endpoint: <code className="bg-orange-200 px-2 py-1 rounded">mpop-sit.hepsiburada.com/product/api/products/import?version=1</code>
          </p>
          <p className="text-xs text-orange-500 mt-1">
            ⚙️ Format: <strong>multipart/form-data</strong> (JSON dosyası olarak yüklenir: integrator.json)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
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
                🚀 Hepsiburada'ya Yükle
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🔄 Sıfırla
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - JSON Editor */}
          <div className="bg-white rounded-xl shadow-2xl p-6 border-2 border-orange-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📝 JSON Editör
            </h2>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-[600px] font-mono text-sm p-4 border-2 border-orange-300 rounded-lg focus:ring-4 focus:ring-orange-500 focus:border-orange-500 resize-none"
              placeholder="JSON verinizi buraya yazın..."
              spellCheck={false}
            />
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
              💡 <span>İpucu: JSON verisini düzenleyip "Hepsiburada'ya Gönder" butonuna basın.</span>
            </p>
          </div>

          {/* Right Side - Response Viewer */}
          <div className="bg-white rounded-xl shadow-2xl p-6 border-2 border-orange-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📊 API Yanıtı
            </h2>
            
            {!response && !isLoading && (
              <div className="flex items-center justify-center h-[600px] text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-lg mb-2 font-semibold">Henüz istek gönderilmedi</p>
                  <p className="text-sm">Sol taraftaki JSON'ı düzenleyip "Hepsiburada'ya Gönder" butonuna basın</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <svg className="animate-spin h-16 w-16 text-orange-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600 font-semibold">Hepsiburada API'ye istek gönderiliyor...</p>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {/* Status Message */}
                <div className={`p-4 rounded-lg border-2 ${
                  response.success 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <p className={`font-bold text-lg ${
                    response.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {response.message}
                  </p>
                  {response.statusCode && (
                    <p className="text-sm text-gray-600 mt-2">
                      📡 HTTP Status: <span className="font-mono font-semibold">{response.statusCode}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    🕐 {new Date(response.timestamp).toLocaleString('tr-TR')}
                  </p>
                </div>

                {/* Errors */}
                {response.errors && response.errors.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <h3 className="font-bold text-red-800 mb-3 text-lg">❌ Hatalar:</h3>
                    <ul className="space-y-2">
                      {response.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded border-l-4 border-red-500">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* API Response Data */}
                {response.data && (
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">📄 API Yanıt Verisi:</h3>
                    <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Success Tips */}
                {response.success && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                    <h3 className="font-bold text-green-800 mb-2">✅ Başarılı!</h3>
                    <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                      <li>Ürün Hepsiburada test sistemine gönderildi</li>
                      <li>Test panelinden (merchant-sit.hepsiburada.com) ürünü kontrol edebilirsiniz</li>
                      <li>API yanıtındaki detayları yukarıda inceleyebilirsiniz</li>
                    </ul>
                    {response.data?.trackingId && (
                      <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
                        <p className="text-sm font-semibold text-blue-900 mb-1">🎯 Tracking ID:</p>
                        <p className="text-xs font-mono text-blue-800 bg-white p-2 rounded border border-blue-200 break-all">
                          {response.data.trackingId}
                        </p>
                        <p className="text-xs text-blue-700 mt-2">
                          ⬇️ Bu tracking ID'yi aşağıdaki "Tracking ID ile Ürün Durumu Sorgulama" bölümünde kullanabilirsiniz
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Tips */}
                {!response.success && (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <h3 className="font-bold text-blue-800 mb-2">💡 Hata Düzeltme İpuçları:</h3>
                    
                    {/* Check for 403 Forbidden */}
                    {response.statusCode === 403 && (
                      <div className="bg-red-50 border border-red-300 rounded p-3 mb-3">
                        <p className="font-semibold text-red-800 mb-2">🔒 ERİŞİM ENGELLENDİ (403 Forbidden)</p>
                        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                          <li><strong>Authentication bilgileri hatalı olabilir</strong></li>
                          <li>Merchant ID ve Servis Anahtarı sıralaması kontrol ediliyor</li>
                          <li>API endpoint doğrulaması yapılıyor</li>
                          <li>Test ortamı credentials'ları güncellenmiş olmalı</li>
                          <li>Sayfayı yenileyip tekrar deneyin</li>
                        </ul>
                      </div>
                    )}
                    
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Zorunlu alanların (Barcode, merchantSku, UrunAdi) dolu olduğunu kontrol edin</li>
                      <li>Merchant ID'nin doğru olduğundan emin olun</li>
                      <li>Fiyat formatının "130,50" şeklinde (virgül ile) olduğunu kontrol edin</li>
                      <li>Görsel URL'lerinin erişilebilir olduğunu doğrulayın</li>
                      <li>CategoryId'nin geçerli bir Hepsiburada kategorisi olduğunu kontrol edin</li>
                      <li>Düzeltme yaptıktan sonra tekrar "Hepsiburada'ya Gönder" butonuna basın</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tracking Status Section */}
        <div className="mt-8 bg-white border-2 border-blue-300 rounded-xl p-6 shadow-xl">
          <h3 className="font-bold text-blue-900 mb-3 text-xl flex items-center gap-2">
            🔍 Tracking ID ile Ürün Durumu Sorgulama
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Ürün gönderimi sonrası aldığınız tracking ID'yi buraya girerek ürünlerinizin durumunu kontrol edebilirsiniz.
          </p>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Tracking ID girin (örn: d290f1ee-6c54-4b01-90e6-d701748f0851)"
              className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <button
              onClick={handleCheckTracking}
              disabled={isTrackingLoading || !trackingId.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isTrackingLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sorgulanıyor...
                </>
              ) : (
                <>
                  🔍 Durumu Sorgula
                </>
              )}
            </button>
          </div>

          {/* Tracking Response */}
          {trackingResponse && (
            <div className="mt-4 space-y-4">
              {/* Status Message */}
              <div className={`p-4 rounded-lg border-2 ${
                trackingResponse.success 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <p className={`font-bold text-lg ${
                  trackingResponse.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {trackingResponse.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  🕐 {new Date(trackingResponse.timestamp).toLocaleString('tr-TR')}
                </p>
              </div>

              {/* Summary */}
              {trackingResponse.summary && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-blue-800 mb-3">📊 Özet Bilgiler:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-gray-600 text-xs">Toplam Ürün</p>
                      <p className="text-2xl font-bold text-blue-900">{trackingResponse.summary.totalElements}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-gray-600 text-xs">Toplam Sayfa</p>
                      <p className="text-2xl font-bold text-blue-900">{trackingResponse.summary.totalPages}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-gray-600 text-xs">Mevcut Sayfa</p>
                      <p className="text-2xl font-bold text-blue-900">{trackingResponse.summary.currentPage + 1}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Counts */}
              {trackingResponse.statusCounts && Object.keys(trackingResponse.statusCounts).length > 0 && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <h4 className="font-bold text-purple-800 mb-3">📈 Ürün Statü Dağılımı:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(trackingResponse.statusCounts).map(([status, count]) => (
                      <div key={status} className="bg-white p-3 rounded border border-purple-200">
                        <p className="text-xs text-gray-600 truncate">{status}</p>
                        <p className="text-xl font-bold text-purple-900">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {trackingResponse.errors && trackingResponse.errors.length > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <h4 className="font-bold text-red-800 mb-3">❌ Hatalar:</h4>
                  <ul className="space-y-2">
                    {trackingResponse.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded border-l-4 border-red-500">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Data */}
              {trackingResponse.data && (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-3">📄 Detaylı Veri:</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-xs font-mono bg-gray-900 text-green-400 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(trackingResponse.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Product Status Guide */}
              {trackingResponse.success && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-800 mb-2">📖 Ürün Statüleri:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li><strong>Incelenecek:</strong> Ürün giriş ekibinin kontrolü için bekliyor</li>
                    <li><strong>Ürün bilgileri eksik:</strong> Eksik bilgiler var, güncelleme gerekli</li>
                    <li><strong>Katalog Sürecinde:</strong> İşleme alındı (güncelleme gönderilemez)</li>
                    <li><strong>Eşleşen:</strong> HB katalogunda bulundu, onay/red gerekli</li>
                    <li><strong>Satışa Hazır:</strong> Ürün kataloğa eklendi ve listing yaratıldı</li>
                    <li><strong>Görev açılmış:</strong> Hatalı bilgiler var, güncelleme gerekli</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white border-2 border-orange-300 rounded-xl p-6 shadow-xl">
          <h3 className="font-bold text-orange-900 mb-3 text-xl">ℹ️ Önemli Bilgiler</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-orange-800 mb-2">🔐 Kimlik Bilgileri:</h4>
              <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                <li><strong>Merchant ID (Username):</strong> 3f95e71f-c39e...</li>
                <li><strong>Secret Key (Password):</strong> d8rCXfXqWJW2</li>
                <li><strong>API:</strong> Product Import (Test Ortamı)</li>
                <li><strong>User-Agent:</strong> aserai_dev</li>
                <li><strong>Format:</strong> multipart/form-data</li>
                <li><strong>File Name:</strong> integrator.json</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-800 mb-2">📌 Notlar:</h4>
              <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                <li>Bu test arayüzü Hepsiburada SIT (test) ortamı ile çalışır</li>
                <li>Ürünler gerçek sisteme değil test sistemine gönderilir</li>
                <li>Test paneli: merchant-sit.hepsiburada.com</li>
                <li>Hata alırsanız JSON'ı düzeltip sayfa yenilemeden tekrar gönderebilirsiniz</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
