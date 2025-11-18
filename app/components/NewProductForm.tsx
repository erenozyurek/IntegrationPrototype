'use client';

import { useState } from 'react';
import BasicInfoStep from './steps/BasicInfoStep';
import CategorySelectionStep from './steps/CategorySelectionStep';
import AttributesStepV2 from './steps/AttributesStepV2';
import PricingInventoryStep from './steps/PricingInventoryStep';
import ImagesStep from './steps/ImagesStep';
import ReviewStep from './steps/ReviewStep';

export type ProductFormData = {
  // Basic Info
  title: string;
  description: string;
  short_description: string;
  brand_id: string;
  master_sku: string;
  product_condition: 'new' | 'refurbished' | 'used';
  
  // Category
  category_id: string;
  trendyol_category_id: number | null;
  trendyol_category_name: string;
  trendyol_category_path: string;
  
  // Attributes
  attributes: Array<{
    attributeId: number;
    attributeValueId?: number;
    customAttributeValue?: string;
  }>;
  
  // Variants (for products with variant attributes)
  variants?: Array<{
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
  }>;
  
  // Pricing & Inventory
  price: number;
  cost_price: number;
  currency: 'TRY' | 'USD' | 'EUR';
  vat_rate: number;
  stock_quantity: number;
  barcode: string;
  weight_grams: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  cargo_provider_id: string;
  
  // Images
  images: Array<{
    url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
};

const INITIAL_DATA: ProductFormData = {
  title: '',
  description: '',
  short_description: '',
  brand_id: '',
  master_sku: '',
  product_condition: 'new',
  category_id: '',
  trendyol_category_id: null,
  trendyol_category_name: '',
  trendyol_category_path: '',
  attributes: [],
  price: 0,
  cost_price: 0,
  currency: 'TRY',
  vat_rate: 20,
  stock_quantity: 0,
  barcode: '',
  weight_grams: 0,
  length_cm: 0,
  width_cm: 0,
  height_cm: 0,
  cargo_provider_id: '',
  images: [],
};

type Step = {
  id: number;
  name: string;
  description: string;
  component: React.ComponentType<any>;
};

const STEPS: Step[] = [
  {
    id: 1,
    name: 'Temel Bilgiler',
    description: 'Ürün başlığı, açıklama ve marka',
    component: BasicInfoStep,
  },
  {
    id: 2,
    name: 'Kategori Seçimi',
    description: 'Trendyol kategori eşleştirme',
    component: CategorySelectionStep,
  },
  {
    id: 3,
    name: 'Ürün Özellikleri',
    description: 'Kategoriye özel özellikler ve varyant yönetimi',
    component: AttributesStepV2,
  },
  {
    id: 4,
    name: 'Fiyat & Stok',
    description: 'Fiyatlandırma ve envanter bilgileri',
    component: PricingInventoryStep,
  },
  {
    id: 5,
    name: 'Görseller',
    description: 'Ürün fotoğrafları',
    component: ImagesStep,
  },
  {
    id: 6,
    name: 'Önizleme',
    description: 'Kontrol ve kaydet',
    component: ReviewStep,
  },
];

export default function NewProductForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const result = await response.json();
      console.log('✅ Product created:', result);
      
      // Show success message
      alert('Ürün başarıyla oluşturuldu!');
      
      // Reset form or redirect
      setFormData(INITIAL_DATA);
      setCurrentStep(1);
    } catch (error) {
      console.error('❌ Failed to create product:', error);
      alert(error instanceof Error ? error.message : 'Ürün oluşturulurken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progressPercentage = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Ürün Ekle</h1>
          <p className="text-gray-600">Trendyol entegrasyonlu ürün oluşturma sihirbazı</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                      currentStep > step.id
                        ? 'bg-green-500 border-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
                <div className="mt-2">
                  <p className={`text-xs font-medium ${
                    currentStep === step.id ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {STEPS[currentStep - 1].name}
            </h2>
            <p className="text-gray-600">{STEPS[currentStep - 1].description}</p>
          </div>

          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            ← Geri
          </button>

          <div className="text-sm text-gray-500">
            Adım {currentStep} / {STEPS.length}
          </div>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              İleri →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                <>✓ Kaydet</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
