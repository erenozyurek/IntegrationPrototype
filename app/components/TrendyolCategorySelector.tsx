'use client';

import { useState } from 'react';

interface Props {
  aseraiCategoryId: string;
  onCategorySelect: (data: { trendyolCategoryId: string; trendyolCategoryName: string; trendyolCategoryPath: string }) => void;
}

export default function TrendyolCategorySelector({ aseraiCategoryId, onCategorySelect }: Props) {
  const [level1, setLevel1] = useState<number | null>(null);
  const [level2, setLevel2] = useState<number | null>(null);
  const [level3, setLevel3] = useState<number | null>(null);

  // Elektronik: Telefonlar -> Cep Telefonu (2 seviye)
  if (aseraiCategoryId === 'electronics' || aseraiCategoryId === 'elektronik') {
    return (
      <div className="space-y-6">
        {/* Level 1: Telefonlar */}
        {!level1 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">1. Alt Kategori</h3>
            <div className="space-y-2">
              <button
                onClick={() => setLevel1(2)}
                className="w-full text-left px-4 py-3 rounded-lg border-2 bg-white hover:bg-gray-50 border-gray-300 transition-all"
              >
                Telefonlar
              </button>
            </div>
          </div>
        )}

        {/* Level 2: Cep Telefonu */}
        {level1 === 2 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">2. Ürün Kategorisi</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  console.log('🔘 Cep Telefonu butonuna tıklandı!');
                  setLevel2(3);
                  const categoryData = {
                    trendyolCategoryId: '3',
                    trendyolCategoryName: 'Cep Telefonu',
                    trendyolCategoryPath: 'Elektronik > Telefonlar > Cep Telefonu',
                  };
                  console.log('📤 onCategorySelect çağrılıyor:', categoryData);
                  onCategorySelect(categoryData);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  level2 === 3
                    ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-300'
                }`}
              >
                Cep Telefonu
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {level2 === 3 && (
          <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-900">Kategori Seçildi</p>
                <p className="text-sm text-green-700">
                  Elektronik {'>'} Telefonlar {'>'} Cep Telefonu
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Giyim: Erkek -> Erkek Giyim -> Erkek T-Shirt (3 seviye)
  if (aseraiCategoryId === 'clothing' || aseraiCategoryId === 'giyim') {
    return (
      <div className="space-y-6">
        {/* Level 1: Erkek */}
        {!level1 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">1. Alt Kategori</h3>
            <div className="space-y-2">
              <button
                onClick={() => setLevel1(5)}
                className="w-full text-left px-4 py-3 rounded-lg border-2 bg-white hover:bg-gray-50 border-gray-300 transition-all"
              >
                Erkek
              </button>
            </div>
          </div>
        )}

        {/* Level 2: Erkek Giyim */}
        {level1 === 5 && !level2 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">2. Alt Kategori</h3>
            <div className="space-y-2">
              <button
                onClick={() => setLevel2(6)}
                className="w-full text-left px-4 py-3 rounded-lg border-2 bg-white hover:bg-gray-50 border-gray-300 transition-all"
              >
                Erkek Giyim
              </button>
            </div>
          </div>
        )}

        {/* Level 3: Erkek T-Shirt */}
        {level2 === 6 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">3. Ürün Kategorisi</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setLevel3(7);
                  onCategorySelect({
                    trendyolCategoryId: '7',
                    trendyolCategoryName: 'Erkek T-Shirt',
                    trendyolCategoryPath: 'Giyim > Erkek > Erkek Giyim > Erkek T-Shirt',
                  });
                }}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  level3 === 7
                    ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-300'
                }`}
              >
                Erkek T-Shirt
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {level3 === 7 && (
          <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <div>
                <p className="font-semibold text-green-900">Kategori Seçildi</p>
                <p className="text-sm text-green-700">
                  Giyim {'>'} Erkek {'>'} Erkek Giyim {'>'} Erkek T-Shirt
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-gray-500 text-sm p-4">
      Lütfen önce bir ana kategori seçin (Elektronik veya Giyim)
    </div>
  );
}
