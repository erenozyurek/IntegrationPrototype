'use client';

import { useState, useMemo, useRef } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

// Sample data - replace with real data from API/database
const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: 299.99,
    category: 'Electronics',
    stock: 45,
    image: '🎧',
  },
  {
    id: 2,
    name: 'Smart Watch Series 5',
    price: 399.99,
    category: 'Electronics',
    stock: 23,
    image: '⌚',
  },
  {
    id: 3,
    name: 'Ergonomic Office Chair',
    price: 449.99,
    category: 'Furniture',
    stock: 12,
    image: '🪑',
  },
  {
    id: 4,
    name: 'Mechanical Keyboard',
    price: 149.99,
    category: 'Electronics',
    stock: 67,
    image: '⌨️',
  },
  {
    id: 5,
    name: 'Designer Backpack',
    price: 89.99,
    category: 'Accessories',
    stock: 34,
    image: '🎒',
  },
  {
    id: 6,
    name: 'Coffee Maker Pro',
    price: 179.99,
    category: 'Home & Kitchen',
    stock: 28,
    image: '☕',
  },
];

export default function ProductsGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    category: '',
    stock: 0,
    image: '',
  });
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image: product.image,
    });
    setEditImagePreview(null);
    setEditImageFile(null);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setEditImagePreview(null);
    setEditImageFile(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving product:', editingProduct?.id, editForm);
    console.log('Image file:', editImageFile);
    // Here you would update the product in your database/state
    handleCloseModal();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleEditImageClick = () => {
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
      editFileInputRef.current.click();
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Lütfen bir resim dosyası seçin');
        return;
      }

      setEditImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditImage = () => {
    setEditImagePreview(null);
    setEditImageFile(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(sampleProducts.map(p => p.category)));
    return ['all', ...uniqueCategories];
  }, []);

  // Filter products based on selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return sampleProducts;
    }
    return sampleProducts.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Ürünler</h2>
        <p className="text-gray-600">Tüm ürünlerinizi görüntüleyin ve yönetin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 mb-1">Toplam Ürün</p>
              <p className="text-3xl font-bold text-indigo-900">{filteredProducts.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Toplam Stok</p>
              <p className="text-3xl font-bold text-purple-900">
                {filteredProducts.reduce((acc, p) => acc + p.stock, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">Kategoriler</p>
              <p className="text-3xl font-bold text-emerald-900">
                {new Set(sampleProducts.map(p => p.category)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
            Kategori Filtrele:
          </label>
        </div>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white shadow-sm hover:border-indigo-300 min-w-[200px]"
        >
          <option value="all">Tüm Kategoriler</option>
          {categories.filter(cat => cat !== 'all').map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Filtreyi Temizle
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
          >
            {/* Product Image Area */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 h-48 flex items-center justify-center border-b border-gray-200 group-hover:from-indigo-50 group-hover:to-purple-50 transition-colors">
              <span className="text-6xl">{product.image}</span>
            </div>

            {/* Product Info */}
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500">{product.category}</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₺{product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${product.stock > 20 ? 'bg-emerald-500' : product.stock > 10 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">{product.stock} stokta</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditClick(product)}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  Düzenle
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Ürün Düzenle</h3>
                  <p className="text-sm text-gray-500">Ürün bilgilerini güncelleyin</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6">
              <div className="space-y-6">
                {/* Product Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Ürün Görseli
                  </label>
                  
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                  />

                  {!editImagePreview ? (
                    <div
                      onClick={handleEditImageClick}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50 hover:bg-indigo-50"
                    >
                      <div className="flex flex-col items-center">
                        {/* Show current emoji/image if exists */}
                        {editForm.image && (
                          <div className="mb-3">
                            <span className="text-5xl">{editForm.image}</span>
                            <p className="text-xs text-gray-500 mt-2">Mevcut görsel</p>
                          </div>
                        )}
                        <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium text-indigo-600">Yeni görsel yüklemek için tıklayın</span>
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF (Max. 5MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{editImageFile?.name}</p>
                            <p className="text-xs text-gray-500">
                              {editImageFile && (editImageFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleEditImageClick}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-700"
                          >
                            Değiştir
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveEditImage}
                            className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium text-red-600"
                          >
                            Kaldır
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="edit-category"
                      name="category"
                      value={editForm.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
                    >
                      <option value="">Kategori seçin</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Clothing">Clothing</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 mb-2">
                      Fiyat (₺) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="edit-price"
                      name="price"
                      value={editForm.price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  {/* Stock */}
                  <div className="md:col-span-2">
                    <label htmlFor="edit-stock" className="block text-sm font-medium text-gray-700 mb-2">
                      Stok <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="edit-stock"
                      name="stock"
                      value={editForm.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200 hover:shadow-xl"
                  >
                    Değişiklikleri Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
