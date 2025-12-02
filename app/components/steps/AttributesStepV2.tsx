'use client';

import { useState, useEffect } from 'react';
import type { ProductFormData } from '../NewProductForm';

interface AttributesStepProps {
  formData: ProductFormData;
  updateFormData: (updates: Partial<ProductFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TrendyolAttribute {
  categoryId: number;
  attribute: {
    id: number;
    name: string;
  };
  required: boolean;
  allowCustom: boolean;
  varianter: boolean;
  slicer: boolean;
  attributeValues?: Array<{
    id: number;
    name: string;
  }>;
}

interface HepsiburadaAttribute {
  id: string;
  name: string;
  displayName?: string;
  type: 'string' | 'integer' | 'enum' | 'boolean' | 'video' | 'text' | 'numeric' | 'list' | 'multiList';
  mandatory: boolean;
  multiValue: boolean;
  allowCustomValue?: boolean;
  varianter?: boolean;
  values?: Array<{
    id: string;
    name: string;
  }>;
}

interface TemuAttribute {
  attrId: number;
  attrName: string;
  attrNameEn?: string;
  inputType: 'text' | 'select' | 'multiSelect' | 'number' | 'date';
  required: boolean;
  isVariant: boolean;
  isSku: boolean;
  maxLength?: number;
  options?: Array<{
    optionId: number;
    optionValue: string;
    optionValueEn?: string;
  }>;
}

interface ProductVariant {
  id: string;
  combination: Record<number, { attributeId: number; attributeValueId: number; value: string }>;
  barcode: string;
  stockCode: string;
  quantity: number;
  listPrice: number;
  salePrice: number;
}

export default function AttributesStepV2({
  formData,
  updateFormData,
  onNext,
}: AttributesStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Trendyol states - Separate variant and non-variant attributes
  const [variantAttributes, setVariantAttributes] = useState<TrendyolAttribute[]>([]);
  const [regularAttributes, setRegularAttributes] = useState<TrendyolAttribute[]>([]);
  
  // Selected values for variant attributes (multi-select)
  const [selectedVariantValues, setSelectedVariantValues] = useState<Record<number, number[]>>({});
  
  // Values for regular attributes
  const [regularFormValues, setRegularFormValues] = useState<Record<number, {attributeValueId?: number; customValue?: string}>>({});
  
  // Generated variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [showVariantManager, setShowVariantManager] = useState(false);

  // Hepsiburada states
  const [hbIsLoading, setHbIsLoading] = useState(false);
  const [hbAttributes, setHbAttributes] = useState<HepsiburadaAttribute[]>([]);
  const [hbFormValues, setHbFormValues] = useState<Record<string, { valueId?: string; customValue?: string; selectedValues?: string[] }>>({});
  const [hbErrors, setHbErrors] = useState<Record<string, string>>({});
  
  // Temu states
  const [temuIsLoading, setTemuIsLoading] = useState(false);
  const [temuAttributes, setTemuAttributes] = useState<TemuAttribute[]>([]);
  const [temuFormValues, setTemuFormValues] = useState<Record<number, { optionId?: number; customValue?: string; selectedOptions?: number[] }>>({});
  const [temuErrors, setTemuErrors] = useState<Record<number, string>>({});
  
  // Active tab for marketplaces
  const [activeTab, setActiveTab] = useState<'trendyol' | 'hepsiburada' | 'temu'>('trendyol');
  
  // Check which marketplaces are selected
  const hasTrendyol = formData.selected_marketplaces.includes('trendyol');
  const hasHepsiburada = formData.selected_marketplaces.includes('hepsiburada');
  const hasTemu = formData.selected_marketplaces.includes('temu');

  // Fetch Trendyol attributes
  useEffect(() => {
    if (formData.trendyol_category_id && hasTrendyol) {
      fetchTrendyolAttributes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.trendyol_category_id]);
  
  // Fetch Hepsiburada attributes
  useEffect(() => {
    if (formData.hepsiburada_category_id && hasHepsiburada) {
      fetchHepsiburadaAttributes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.hepsiburada_category_id]);
  
  // Fetch Temu attributes
  useEffect(() => {
    if (formData.temu_category_id && hasTemu) {
      fetchTemuAttributes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.temu_category_id]);
  
  // Set default active tab based on selected marketplaces
  useEffect(() => {
    if (hasTrendyol && formData.trendyol_category_id) {
      setActiveTab('trendyol');
    } else if (hasHepsiburada && formData.hepsiburada_category_id) {
      setActiveTab('hepsiburada');
    } else if (hasTemu && formData.temu_category_id) {
      setActiveTab('temu');
    }
  }, [hasTrendyol, hasHepsiburada, hasTemu, formData.trendyol_category_id, formData.hepsiburada_category_id, formData.temu_category_id]);

  const fetchTrendyolAttributes = async () => {
    if (!formData.trendyol_category_id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/trendyol/attributes/${formData.trendyol_category_id}`);
      
      if (!response.ok) {
        throw new Error('Özellikler yüklenemedi');
      }

      const data = await response.json();
      const categoryAttributes = data.attributes?.categoryAttributes || [];

      // Separate variant and regular attributes
      const variantAttrs = categoryAttributes.filter((attr: TrendyolAttribute) => attr.varianter);
      const regularAttrs = categoryAttributes.filter((attr: TrendyolAttribute) => !attr.varianter);
      
      setVariantAttributes(variantAttrs);
      setRegularAttributes(regularAttrs);

      // Initialize regular form values with existing data
      const initialValues: Record<number, {attributeValueId?: number; customValue?: string}> = {};
      formData.attributes.forEach(attr => {
        if (!variantAttrs.find((va: TrendyolAttribute) => va.attribute.id === attr.attributeId)) {
          initialValues[attr.attributeId] = {
            attributeValueId: attr.attributeValueId,
            customValue: attr.customAttributeValue,
          };
        }
      });
      setRegularFormValues(initialValues);

    } catch (error) {
      console.error('Failed to fetch attributes:', error);
      alert('Kategori özellikleri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHepsiburadaAttributes = async () => {
    if (!formData.hepsiburada_category_id) return;

    console.log('🔍 [AttributesStep] Fetching Hepsiburada attributes for:', {
      categoryId: formData.hepsiburada_category_id,
      categoryName: formData.hepsiburada_category_name,
      categoryPath: formData.hepsiburada_category_path,
    });

    setHbIsLoading(true);
    try {
      const response = await fetch(`/api/v1/hepsiburada/categories/${formData.hepsiburada_category_id}/attributes`);
      
      if (!response.ok) {
        throw new Error('Hepsiburada özellikleri yüklenemedi');
      }

      const data = await response.json();
      const attributes: HepsiburadaAttribute[] = data.attributes || [];
      
      console.log('✅ [AttributesStep] Hepsiburada attributes fetched:', {
        categoryId: formData.hepsiburada_category_id,
        attributeCount: attributes.length,
        mandatoryCount: attributes.filter(a => a.mandatory).length,
        attributes: attributes.map(a => ({ id: a.id, name: a.name, mandatory: a.mandatory, type: a.type })),
      });
      
      setHbAttributes(attributes);

      // Initialize form values with existing data
      const initialValues: Record<string, { valueId?: string; customValue?: string; selectedValues?: string[] }> = {};
      formData.hepsiburada_attributes.forEach(attr => {
        const attrDef = attributes.find(a => a.id === attr.attributeId);
        if (attrDef?.multiValue) {
          initialValues[attr.attributeId] = {
            selectedValues: [attr.attributeValueId || attr.attributeValue],
          };
        } else {
          initialValues[attr.attributeId] = {
            valueId: attr.attributeValueId,
            customValue: attr.attributeValueId ? undefined : attr.attributeValue,
          };
        }
      });
      setHbFormValues(initialValues);

    } catch (error) {
      console.error('Failed to fetch Hepsiburada attributes:', error);
      alert('Hepsiburada özellikleri yüklenirken bir hata oluştu');
    } finally {
      setHbIsLoading(false);
    }
  };

  const fetchTemuAttributes = async () => {
    if (!formData.temu_category_id) return;

    console.log('🔍 [AttributesStep] Fetching Temu attributes for:', {
      categoryId: formData.temu_category_id,
      categoryName: formData.temu_category_name,
      categoryPath: formData.temu_category_path,
    });

    setTemuIsLoading(true);
    try {
      const response = await fetch(`/api/v1/temu/categories/${formData.temu_category_id}/attributes`);
      
      if (!response.ok) {
        throw new Error('Temu özellikleri yüklenemedi');
      }

      const data = await response.json();
      const attributes: TemuAttribute[] = data.attributes || [];
      
      console.log('✅ [AttributesStep] Temu attributes fetched:', {
        categoryId: formData.temu_category_id,
        attributeCount: attributes.length,
        requiredCount: attributes.filter(a => a.required).length,
        attributes: attributes.map(a => ({ attrId: a.attrId, attrName: a.attrName, required: a.required, inputType: a.inputType })),
      });
      
      setTemuAttributes(attributes);

      // Initialize form values with existing data
      const initialValues: Record<number, { optionId?: number; customValue?: string; selectedOptions?: number[] }> = {};
      formData.temu_attributes.forEach(attr => {
        const attrDef = attributes.find(a => String(a.attrId) === attr.attrId);
        if (attrDef?.inputType === 'multiSelect') {
          initialValues[Number(attr.attrId)] = {
            selectedOptions: attr.attrValueId ? [Number(attr.attrValueId)] : [],
          };
        } else if (attrDef?.inputType === 'select') {
          initialValues[Number(attr.attrId)] = {
            optionId: attr.attrValueId ? Number(attr.attrValueId) : undefined,
          };
        } else {
          initialValues[Number(attr.attrId)] = {
            customValue: attr.attrValue,
          };
        }
      });
      setTemuFormValues(initialValues);

    } catch (error) {
      console.error('Failed to fetch Temu attributes:', error);
      alert('Temu özellikleri yüklenirken bir hata oluştu');
    } finally {
      setTemuIsLoading(false);
    }
  };

  const handleTemuAttributeChange = (
    attrId: number,
    value: { optionId?: number; customValue?: string; selectedOptions?: number[] }
  ) => {
    setTemuFormValues(prev => ({
      ...prev,
      [attrId]: value,
    }));

    setTemuErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[attrId];
      return newErrors;
    });
  };

  const toggleTemuMultiValue = (attrId: number, optionId: number) => {
    setTemuFormValues(prev => {
      const current = prev[attrId]?.selectedOptions || [];
      const isSelected = current.includes(optionId);
      
      return {
        ...prev,
        [attrId]: {
          ...prev[attrId],
          selectedOptions: isSelected
            ? current.filter(id => id !== optionId)
            : [...current, optionId],
        },
      };
    });
  };

  const handleHbAttributeChange = (
    attributeId: string,
    value: { valueId?: string; customValue?: string; selectedValues?: string[] }
  ) => {
    setHbFormValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));

    setHbErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[attributeId];
      return newErrors;
    });
  };

  const toggleHbMultiValue = (attributeId: string, valueId: string) => {
    setHbFormValues(prev => {
      const current = prev[attributeId]?.selectedValues || [];
      const isSelected = current.includes(valueId);
      
      return {
        ...prev,
        [attributeId]: {
          selectedValues: isSelected
            ? current.filter(id => id !== valueId)
            : [...current, valueId]
        }
      };
    });
  };

  const toggleVariantValue = (attributeId: number, valueId: number) => {
    setSelectedVariantValues(prev => {
      const current = prev[attributeId] || [];
      const isSelected = current.includes(valueId);
      
      return {
        ...prev,
        [attributeId]: isSelected 
          ? current.filter(id => id !== valueId)
          : [...current, valueId]
      };
    });
  };

  const generateVariants = () => {
    // Get all variant attribute combinations
    const attributeIds = Object.keys(selectedVariantValues).map(Number);
    
    if (attributeIds.length === 0) {
      alert('Lütfen en az bir varyant özelliği seçin');
      return;
    }

    // Check if all variant attributes have selected values
    for (const attrId of attributeIds) {
      if (selectedVariantValues[attrId].length === 0) {
        alert('Tüm varyant özellikleri için en az bir değer seçin');
        return;
      }
    }

    // Generate all combinations
    const combinations = generateCombinations(attributeIds, selectedVariantValues);
    
    // Create variant objects
    const newVariants: ProductVariant[] = combinations.map((combo, index) => {
      return {
        id: `variant-${Date.now()}-${index}`,
        combination: combo,
        barcode: '',
        stockCode: `${formData.master_sku || 'SKU'}-${index + 1}`,
        quantity: 0,
        listPrice: formData.price || 0,
        salePrice: formData.price || 0,
      };
    });

    setVariants(newVariants);
    setShowVariantManager(true);
  };

  const generateCombinations = (
    attributeIds: number[],
    selectedValues: Record<number, number[]>
  ): Record<number, { attributeId: number; attributeValueId: number; value: string }>[] => {
    if (attributeIds.length === 0) return [];
    
    const [firstAttrId, ...restAttrIds] = attributeIds;
    const firstValues = selectedValues[firstAttrId];
    
    if (restAttrIds.length === 0) {
      // Base case: only one attribute left
      return firstValues.map(valueId => {
        const attr = variantAttributes.find(a => a.attribute.id === firstAttrId);
        const value = attr?.attributeValues?.find(v => v.id === valueId);
        return {
          [firstAttrId]: {
            attributeId: firstAttrId,
            attributeValueId: valueId,
            value: value?.name || '',
          }
        };
      });
    }
    
    // Recursive case: combine first attribute with rest
    const restCombinations = generateCombinations(restAttrIds, selectedValues);
    const allCombinations: Record<number, { attributeId: number; attributeValueId: number; value: string }>[] = [];
    
    for (const valueId of firstValues) {
      const attr = variantAttributes.find(a => a.attribute.id === firstAttrId);
      const value = attr?.attributeValues?.find(v => v.id === valueId);
      
      for (const restCombo of restCombinations) {
        allCombinations.push({
          [firstAttrId]: {
            attributeId: firstAttrId,
            attributeValueId: valueId,
            value: value?.name || '',
          },
          ...restCombo
        });
      }
    }
    
    return allCombinations;
  };

  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, ...updates } : v));
  };

  const handleRegularAttributeChange = (attributeId: number, value: {attributeValueId?: number; customValue?: string}) => {
    setRegularFormValues(prev => ({
      ...prev,
      [attributeId]: value,
    }));

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[attributeId];
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors: Record<number, string> = {};
    const newHbErrors: Record<string, string> = {};
    let isValid = true;

    // Validate Trendyol attributes only if Trendyol is selected
    if (hasTrendyol && formData.trendyol_category_id) {
      // Validate regular required attributes
      regularAttributes.forEach(attr => {
        if (attr.required) {
          const value = regularFormValues[attr.attribute.id];
          if (!value || (!value.attributeValueId && !value.customValue)) {
            newErrors[attr.attribute.id] = 'Bu alan zorunludur';
          }
        }
      });

      // Validate variant attributes (if variants exist)
      if (variantAttributes.length > 0) {
        variantAttributes.forEach(attr => {
          if (attr.required) {
            const selectedValues = selectedVariantValues[attr.attribute.id];
            if (!selectedValues || selectedValues.length === 0) {
              newErrors[attr.attribute.id] = 'En az bir değer seçmelisiniz';
            }
          }
        });

        // If there are variant attributes, variants must be generated
        if (variants.length === 0) {
          alert('Varyant özellikleri seçtiniz. Lütfen "Varyant Kombinasyonlarını Oluştur" butonuna tıklayın.');
          return false;
        }

        // Validate each variant
        for (const variant of variants) {
          if (!variant.barcode || variant.barcode.trim() === '') {
            alert('Tüm varyantlar için barkod girilmelidir');
            return false;
          }
          if (variant.quantity < 0) {
            alert('Stok miktarı negatif olamaz');
            return false;
          }
          if (variant.listPrice <= 0 || variant.salePrice <= 0) {
            alert('Fiyatlar 0\'dan büyük olmalıdır');
            return false;
          }
          if (variant.salePrice > variant.listPrice) {
            alert('İndirimli fiyat, liste fiyatından yüksek olamaz');
            return false;
          }
        }
      }
    }

    // Validate Hepsiburada attributes only if Hepsiburada is selected
    if (hasHepsiburada && formData.hepsiburada_category_id) {
      hbAttributes.forEach(attr => {
        if (attr.mandatory) {
          const value = hbFormValues[attr.id];
          
          if (attr.multiValue) {
            // Multi-value attributes must have at least one selection
            if (!value?.selectedValues || value.selectedValues.length === 0) {
              newHbErrors[attr.id] = 'En az bir değer seçmelisiniz';
            }
          } else if (attr.type === 'list') {
            // List type must have a selection
            if (!value?.valueId && !value?.customValue) {
              newHbErrors[attr.id] = 'Bu alan zorunludur';
            }
          } else {
            // Text/numeric must have a value
            if (!value?.customValue?.trim()) {
              newHbErrors[attr.id] = 'Bu alan zorunludur';
            }
          }
        }
      });
    }

    // Validate Temu attributes only if Temu is selected
    const newTemuErrors: Record<number, string> = {};
    if (hasTemu && formData.temu_category_id) {
      temuAttributes.forEach(attr => {
        if (attr.required) {
          const value = temuFormValues[attr.attrId];
          
          if (attr.inputType === 'multiSelect') {
            // Multi-select must have at least one selection
            if (!value?.selectedOptions || value.selectedOptions.length === 0) {
              newTemuErrors[attr.attrId] = 'En az bir değer seçmelisiniz';
            }
          } else if (attr.inputType === 'select') {
            // Select must have a selection
            if (!value?.optionId) {
              newTemuErrors[attr.attrId] = 'Bu alan zorunludur';
            }
          } else {
            // Text/number must have a value
            if (!value?.customValue?.trim()) {
              newTemuErrors[attr.attrId] = 'Bu alan zorunludur';
            }
          }
        }
      });
    }

    // Show errors if any
    if (Object.keys(newErrors).length > 0 || Object.keys(newHbErrors).length > 0 || Object.keys(newTemuErrors).length > 0) {
      if (Object.keys(newErrors).length > 0) {
        alert('Lütfen tüm zorunlu Trendyol özelliklerini doldurun!');
        setActiveTab('trendyol');
      } else if (Object.keys(newHbErrors).length > 0) {
        alert('Lütfen tüm zorunlu Hepsiburada özelliklerini doldurun!');
        setActiveTab('hepsiburada');
      } else if (Object.keys(newTemuErrors).length > 0) {
        alert('Lütfen tüm zorunlu Temu özelliklerini doldurun!');
        setActiveTab('temu');
      }
      isValid = false;
    }

    setErrors(newErrors);
    setHbErrors(newHbErrors);
    setTemuErrors(newTemuErrors);
    return isValid;
  };

  const handleNext = () => {
    if (!validate()) {
      return;
    }

    // Convert Trendyol regular attributes to API format
    const regularAttributesArray = Object.entries(regularFormValues).map(([attrId, value]) => ({
      attributeId: Number(attrId),
      ...(value.attributeValueId ? { attributeValueId: value.attributeValueId } : {}),
      ...(value.customValue ? { customAttributeValue: value.customValue } : {}),
    }));

    // Convert Hepsiburada attributes to API format
    const hbAttributesArray = Object.entries(hbFormValues).map(([attrId, value]) => {
      const attrDef = hbAttributes.find(a => a.id === attrId);
      const attrName = attrDef?.displayName || attrDef?.name || '';

      if (value.selectedValues && value.selectedValues.length > 0) {
        // Multi-value: return multiple entries
        return value.selectedValues.map(valId => {
          const valueDef = attrDef?.values?.find(v => v.id === valId);
          return {
            attributeId: attrId,
            attributeName: attrName,
            attributeValue: valueDef?.name || valId,
            attributeValueId: valId,
          };
        });
      } else {
        // Single value
        const valueDef = attrDef?.values?.find(v => v.id === value.valueId);
        return [{
          attributeId: attrId,
          attributeName: attrName,
          attributeValue: value.customValue || valueDef?.name || '',
          attributeValueId: value.valueId,
        }];
      }
    }).flat().filter(attr => attr.attributeValue); // Remove empty attributes

    // Convert Temu attributes to API format
    const temuAttributesArray = Object.entries(temuFormValues).map(([attrId, value]) => {
      const attrDef = temuAttributes.find(a => a.attrId === Number(attrId));
      const attrName = attrDef?.attrName || '';

      if (value.selectedOptions && value.selectedOptions.length > 0) {
        // Multi-select: return multiple entries
        return value.selectedOptions.map(optId => {
          const optDef = attrDef?.options?.find(o => o.optionId === optId);
          return {
            attrId: attrId,
            attrName: attrName,
            attrValue: optDef?.optionValue || String(optId),
            attrValueId: String(optId),
          };
        });
      } else if (value.optionId) {
        // Single select
        const optDef = attrDef?.options?.find(o => o.optionId === value.optionId);
        return [{
          attrId: attrId,
          attrName: attrName,
          attrValue: optDef?.optionValue || String(value.optionId),
          attrValueId: String(value.optionId),
        }];
      } else {
        // Text/number value
        return [{
          attrId: attrId,
          attrName: attrName,
          attrValue: value.customValue || '',
        }];
      }
    }).flat().filter(attr => attr.attrValue); // Remove empty attributes

    updateFormData({ 
      attributes: regularAttributesArray,
      hepsiburada_attributes: hbAttributesArray,
      temu_attributes: temuAttributesArray,
      variants: variants.map(v => ({
        id: v.id,
        barcode: v.barcode,
        stockCode: v.stockCode,
        quantity: v.quantity,
        listPrice: v.listPrice,
        salePrice: v.salePrice,
        variantAttributes: Object.values(v.combination).map(attr => ({
          attributeId: attr.attributeId,
          attributeValueId: attr.attributeValueId,
        })),
      }))
    });
    
    onNext();
  };

  if (isLoading || hbIsLoading || temuIsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600 font-medium">Kategori özellikleri yükleniyor...</p>
      </div>
    );
  }

  // Render Hepsiburada attribute input based on type
  const renderHbAttributeInput = (attr: HepsiburadaAttribute) => {
    const value = hbFormValues[attr.id];
    const hasError = !!hbErrors[attr.id];

    switch (attr.type) {
      case 'boolean':
        return (
          <select
            value={value?.valueId || ''}
            onChange={(e) => handleHbAttributeChange(attr.id, { valueId: e.target.value })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
          >
            <option value="">Seçin...</option>
            <option value="true">Evet</option>
            <option value="false">Hayır</option>
          </select>
        );

      case 'list':
        // If no values available, render as text input instead
        if (!attr.values || attr.values.length === 0) {
          return (
            <input
              type="text"
              value={value?.customValue || ''}
              onChange={(e) => handleHbAttributeChange(attr.id, { customValue: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                hasError ? 'border-red-500 bg-white' : 'border-gray-300'
              }`}
              placeholder={`${attr.displayName || attr.name} girin`}
            />
          );
        }
        
        if (attr.multiValue) {
          // Multi-select list
          return (
            <div className="space-y-2">
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border-2 rounded-lg ${hasError ? 'border-red-500' : 'border-gray-300'}`}>
                {attr.values?.map(v => {
                  const isSelected = value?.selectedValues?.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleHbMultiValue(attr.id, v.id)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {v.name}
                      {isSelected && (
                        <svg className="w-4 h-4 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600">
                {value?.selectedValues?.length || 0} değer seçildi
              </p>
            </div>
          );
        }
        
        // Single select list
        return (
          <select
            value={value?.valueId || ''}
            onChange={(e) => handleHbAttributeChange(attr.id, { valueId: e.target.value })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
          >
            <option value="">Seçin...</option>
            {attr.values?.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        );

      case 'multiList':
        // If no values available, render as text input instead
        if (!attr.values || attr.values.length === 0) {
          return (
            <input
              type="text"
              value={value?.customValue || ''}
              onChange={(e) => handleHbAttributeChange(attr.id, { customValue: e.target.value })}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                hasError ? 'border-red-500 bg-white' : 'border-gray-300'
              }`}
              placeholder={`${attr.displayName || attr.name} girin (virgülle ayırarak birden fazla değer girebilirsiniz)`}
            />
          );
        }
        
        return (
          <div className="space-y-2">
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border-2 rounded-lg ${hasError ? 'border-red-500' : 'border-gray-300'}`}>
              {attr.values?.map(v => {
                const isSelected = value?.selectedValues?.includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleHbMultiValue(attr.id, v.id)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {v.name}
                    {isSelected && (
                      <svg className="w-4 h-4 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-600">
              {value?.selectedValues?.length || 0} değer seçildi
            </p>
          </div>
        );

      case 'numeric':
      case 'integer':
        return (
          <input
            type="number"
            value={value?.customValue || ''}
            onChange={(e) => handleHbAttributeChange(attr.id, { customValue: e.target.value })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
            placeholder={`${attr.displayName || attr.name} girin`}
          />
        );

      case 'string':
      case 'text':
      default:
        // Text input - check if it has predefined values
        if (attr.values && attr.values.length > 0) {
          return (
            <div className="space-y-2">
              <select
                value={value?.valueId || ''}
                onChange={(e) => handleHbAttributeChange(attr.id, { valueId: e.target.value, customValue: undefined })}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                  hasError ? 'border-red-500 bg-white' : 'border-gray-300'
                }`}
              >
                <option value="">Seçin veya özel değer girin...</option>
                {attr.values.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {attr.allowCustomValue && (
                <input
                  type="text"
                  value={value?.customValue || ''}
                  onChange={(e) => handleHbAttributeChange(attr.id, { customValue: e.target.value, valueId: undefined })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="veya özel değer girin..."
                />
              )}
            </div>
          );
        }
        
        return (
          <input
            type="text"
            value={value?.customValue || ''}
            onChange={(e) => handleHbAttributeChange(attr.id, { customValue: e.target.value })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
            placeholder={`${attr.displayName || attr.name} girin`}
          />
        );
    }
  };

  // Render Temu attribute input based on type
  const renderTemuAttributeInput = (attr: TemuAttribute) => {
    const value = temuFormValues[attr.attrId];
    const hasError = !!temuErrors[attr.attrId];

    switch (attr.inputType) {
      case 'select':
        return (
          <select
            value={value?.optionId || ''}
            onChange={(e) => handleTemuAttributeChange(attr.attrId, { optionId: Number(e.target.value) })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
          >
            <option value="">Seçin...</option>
            {attr.options?.map(opt => (
              <option key={opt.optionId} value={opt.optionId}>{opt.optionValue}</option>
            ))}
          </select>
        );

      case 'multiSelect':
        return (
          <div className="space-y-2">
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border-2 rounded-lg ${hasError ? 'border-red-500' : 'border-gray-300'}`}>
              {attr.options?.map(opt => {
                const isSelected = value?.selectedOptions?.includes(opt.optionId);
                return (
                  <button
                    key={opt.optionId}
                    type="button"
                    onClick={() => toggleTemuMultiValue(attr.attrId, opt.optionId)}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.optionValue}
                    {isSelected && (
                      <svg className="w-4 h-4 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-600">
              {value?.selectedOptions?.length || 0} değer seçildi
            </p>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value?.customValue || ''}
            onChange={(e) => handleTemuAttributeChange(attr.attrId, { customValue: e.target.value })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
            placeholder={`${attr.attrName} girin`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value?.customValue || ''}
            onChange={(e) => handleTemuAttributeChange(attr.attrId, { customValue: e.target.value })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value?.customValue || ''}
            onChange={(e) => handleTemuAttributeChange(attr.attrId, { customValue: e.target.value })}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
              hasError ? 'border-red-500 bg-white' : 'border-gray-300'
            }`}
            placeholder={`${attr.attrName} girin`}
            maxLength={attr.maxLength}
          />
        );
    }
  };

  // Check if multiple marketplaces are selected
  const selectedCount = [hasTrendyol, hasHepsiburada, hasTemu].filter(Boolean).length;
  const showTabs = selectedCount > 1;

  return (
    <div className="space-y-6">
      {/* Marketplace Tabs */}
      {showTabs && (
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-4">
            <button
              onClick={() => setActiveTab('trendyol')}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'trendyol'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">T</span>
                Trendyol Özellikleri
                {regularAttributes.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {regularAttributes.length + variantAttributes.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('hepsiburada')}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'hepsiburada'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">H</span>
                Hepsiburada Özellikleri
                {hbAttributes.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {hbAttributes.length}
                  </span>
                )}
              </span>
            </button>
            {hasTemu && (
              <button
                onClick={() => setActiveTab('temu')}
                className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'temu'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">🔶</span>
                  Temu Özellikleri
                  {temuAttributes.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {temuAttributes.length}
                    </span>
                  )}
                </span>
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Trendyol Attributes Section */}
      {((hasTrendyol && !showTabs) || (showTabs && activeTab === 'trendyol')) && hasTrendyol && formData.trendyol_category_id && (
        <>
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  📋 Trendyol Varyant Yönetimi
                </h4>
                <p className="text-sm text-blue-700">
                  {variantAttributes.length > 0 ? (
                    <>Bu kategori <strong>{variantAttributes.length} adet varyant özelliği</strong> içeriyor. 
                    Her varyant kombinasyonu için ayrı stok ve fiyat belirleyeceksiniz.</>
                  ) : (
                    <>Bu kategoride varyant özelliği bulunmuyor. Standart ürün özellikleri doldurun.</>
                  )}
                </p>
              </div>
            </div>
          </div>

      {/* Variant Attributes */}
      {variantAttributes.length > 0 && !showVariantManager && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">V</span>
            Varyant Özellikleri
          </h3>
          <div className="space-y-6">
            {variantAttributes.map(attr => (
              <div key={attr.attribute.id} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                <label className="block text-sm font-bold text-purple-900 mb-3">
                  {attr.attribute.name} {attr.required && <span className="text-red-500">*</span>}
                  <span className="ml-2 text-xs font-normal text-purple-600">(Varyant belirleyici - çoklu seçim)</span>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {attr.attributeValues?.map(value => {
                    const isSelected = selectedVariantValues[attr.attribute.id]?.includes(value.id);
                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() => toggleVariantValue(attr.attribute.id, value.id)}
                        className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white border-2 border-purple-200 text-purple-700 hover:border-purple-400'
                        }`}
                      >
                        {value.name}
                        {isSelected && (
                          <svg className="w-4 h-4 inline-block ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {errors[attr.attribute.id] && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors[attr.attribute.id]}</p>
                )}

                <div className="mt-3 text-sm text-purple-700">
                  <strong>{selectedVariantValues[attr.attribute.id]?.length || 0}</strong> değer seçildi
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={generateVariants}
            className="mt-6 w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            🔄 Varyant Kombinasyonlarını Oluştur
          </button>
        </div>
      )}

      {/* Variant Manager */}
      {showVariantManager && variants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">{variants.length}</span>
              Oluşturulan Varyantlar
            </h3>
            <button
              onClick={() => {
                setShowVariantManager(false);
                setVariants([]);
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              ↺ Yeniden Oluştur
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => {
              const variantName = Object.values(variant.combination).map(v => v.value).join(' - ');
              
              return (
                <div key={variant.id} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-gray-900">{variantName}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Barkod <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.barcode}
                        onChange={(e) => updateVariant(variant.id, { barcode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Benzersiz barkod"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok Kodu
                      </label>
                      <input
                        type="text"
                        value={variant.stockCode}
                        onChange={(e) => updateVariant(variant.id, { stockCode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="SKU"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stok Miktarı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={variant.quantity}
                        onChange={(e) => updateVariant(variant.id, { quantity: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Liste Fiyatı (₺) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.listPrice}
                        onChange={(e) => updateVariant(variant.id, { listPrice: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İndirimli Fiyat (₺) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.salePrice}
                        onChange={(e) => updateVariant(variant.id, { salePrice: Number(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Attributes */}
      {regularAttributes.length > 0 && (
        <div className="space-y-6">
          {/* Required Regular Attributes */}
          {regularAttributes.filter(a => a.required).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-red-500">*</span>
                Zorunlu Genel Özellikler
              </h3>
              <div className="space-y-4">
                {regularAttributes.filter(a => a.required).map(attr => (
                  <div key={attr.attribute.id} className={errors[attr.attribute.id] ? 'bg-red-50 p-4 rounded-lg' : ''}>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      {attr.attribute.name} <span className="text-red-500">*</span>
                    </label>

                    {attr.allowCustom && (!attr.attributeValues || attr.attributeValues.length === 0) ? (
                      <input
                        type="text"
                        value={regularFormValues[attr.attribute.id]?.customValue || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { customValue: e.target.value })}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                          errors[attr.attribute.id] ? 'border-red-500 bg-white' : 'border-gray-300'
                        }`}
                        placeholder={`${attr.attribute.name} girin`}
                      />
                    ) : (
                      <select
                        value={regularFormValues[attr.attribute.id]?.attributeValueId || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { attributeValueId: Number(e.target.value) })}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${
                          errors[attr.attribute.id] ? 'border-red-500 bg-white' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Seçin...</option>
                        {attr.attributeValues?.map(val => (
                          <option key={val.id} value={val.id}>
                            {val.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {errors[attr.attribute.id] && (
                      <p className="mt-2 text-sm text-red-600 font-semibold">{errors[attr.attribute.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Regular Attributes */}
          {regularAttributes.filter(a => !a.required).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                İsteğe Bağlı Genel Özellikler
              </h3>
              <div className="space-y-4">
                {regularAttributes.filter(a => !a.required).map(attr => (
                  <div key={attr.attribute.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {attr.attribute.name}
                    </label>

                    {attr.allowCustom && (!attr.attributeValues || attr.attributeValues.length === 0) ? (
                      <input
                        type="text"
                        value={regularFormValues[attr.attribute.id]?.customValue || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { customValue: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        placeholder={`${attr.attribute.name} girin (opsiyonel)`}
                      />
                    ) : (
                      <select
                        value={regularFormValues[attr.attribute.id]?.attributeValueId || ''}
                        onChange={(e) => handleRegularAttributeChange(attr.attribute.id, { attributeValueId: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      >
                        <option value="">Seçin (opsiyonel)</option>
                        {attr.attributeValues?.map(val => (
                          <option key={val.id} value={val.id}>
                            {val.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Hepsiburada Attributes Section */}
      {((hasHepsiburada && !showTabs) || (showTabs && activeTab === 'hepsiburada')) && hasHepsiburada && formData.hepsiburada_category_id && (
        <div className="space-y-6">
          {/* Hepsiburada Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-orange-900 mb-1">
                  📋 Hepsiburada Özellikleri
                </h4>
                <p className="text-sm text-orange-700">
                  Bu kategori için <strong>{hbAttributes.length}</strong> özellik bulundu. 
                  {hbAttributes.filter(a => a.mandatory).length > 0 && (
                    <> <strong>{hbAttributes.filter(a => a.mandatory).length}</strong> tanesi zorunlu.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Hepsiburada Mandatory Attributes */}
          {hbAttributes.filter(a => a.mandatory).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-red-500">*</span>
                Zorunlu Hepsiburada Özellikleri
              </h3>
              <div className="space-y-4">
                {hbAttributes.filter(a => a.mandatory).map(attr => (
                  <div key={attr.id} className={hbErrors[attr.id] ? 'bg-red-50 p-4 rounded-lg' : ''}>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      {attr.displayName || attr.name} <span className="text-red-500">*</span>
                      {attr.varianter && (
                        <span className="ml-2 text-xs font-normal text-purple-600">(Varyant belirleyici)</span>
                      )}
                    </label>
                    
                    {renderHbAttributeInput(attr)}

                    {hbErrors[attr.id] && (
                      <p className="mt-2 text-sm text-red-600 font-semibold">{hbErrors[attr.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hepsiburada Optional Attributes */}
          {hbAttributes.filter(a => !a.mandatory).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                İsteğe Bağlı Hepsiburada Özellikleri
              </h3>
              <div className="space-y-4">
                {hbAttributes.filter(a => !a.mandatory).map(attr => (
                  <div key={attr.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {attr.displayName || attr.name}
                      {attr.varianter && (
                        <span className="ml-2 text-xs text-purple-600">(Varyant belirleyici)</span>
                      )}
                    </label>
                    
                    {renderHbAttributeInput(attr)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Temu Attributes Section */}
      {((hasTemu && !showTabs) || (showTabs && activeTab === 'temu')) && hasTemu && formData.temu_category_id && (
        <div className="space-y-6">
          {/* Temu Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-orange-900 mb-1">
                  🔶 Temu Özellikleri
                </h4>
                <p className="text-sm text-orange-700">
                  Bu kategori için <strong>{temuAttributes.length}</strong> özellik bulundu. 
                  {temuAttributes.filter(a => a.required).length > 0 && (
                    <> <strong>{temuAttributes.filter(a => a.required).length}</strong> tanesi zorunlu.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {temuIsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Temu özellikleri yükleniyor...</span>
            </div>
          ) : (
            <>
              {/* Temu Required Attributes */}
              {temuAttributes.filter(a => a.required).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-red-500">*</span>
                    Zorunlu Temu Özellikleri
                  </h3>
                  <div className="space-y-4">
                    {temuAttributes.filter(a => a.required).map(attr => (
                      <div key={attr.attrId} className={temuErrors[attr.attrId] ? 'bg-red-50 p-4 rounded-lg' : ''}>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          {attr.attrName} <span className="text-red-500">*</span>
                          {attr.isVariant && (
                            <span className="ml-2 text-xs font-normal text-purple-600">(Varyant belirleyici)</span>
                          )}
                        </label>
                        
                        {renderTemuAttributeInput(attr)}

                        {temuErrors[attr.attrId] && (
                          <p className="mt-2 text-sm text-red-600 font-semibold">{temuErrors[attr.attrId]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Temu Optional Attributes */}
              {temuAttributes.filter(a => !a.required).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    İsteğe Bağlı Temu Özellikleri
                  </h3>
                  <div className="space-y-4">
                    {temuAttributes.filter(a => !a.required).map(attr => (
                      <div key={attr.attrId}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {attr.attrName}
                          {attr.isVariant && (
                            <span className="ml-2 text-xs text-purple-600">(Varyant belirleyici)</span>
                          )}
                        </label>
                        
                        {renderTemuAttributeInput(attr)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* No Category Selected Messages */}
      {hasTrendyol && !formData.trendyol_category_id && activeTab === 'trendyol' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">Trendyol kategorisi seçilmedi. Lütfen önceki adımda kategori seçin.</p>
        </div>
      )}
      
      {hasHepsiburada && !formData.hepsiburada_category_id && activeTab === 'hepsiburada' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">Hepsiburada kategorisi seçilmedi. Lütfen önceki adımda kategori seçin.</p>
        </div>
      )}
      
      {hasTemu && !formData.temu_category_id && activeTab === 'temu' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">Temu kategorisi seçilmedi. Lütfen önceki adımda kategori seçin.</p>
        </div>
      )}

      {/* Navigation */}
      {((hasTrendyol && (variantAttributes.length === 0 || showVariantManager)) || 
        (hasHepsiburada && (!hasTrendyol || activeTab === 'hepsiburada' || variantAttributes.length === 0)) ||
        (hasTemu && (!hasTrendyol || activeTab === 'temu' || variantAttributes.length === 0))) && (
        <div className="pt-6">
          <button
            onClick={handleNext}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Devam Et →
          </button>
        </div>
      )}
    </div>
  );
}
