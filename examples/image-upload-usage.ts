// AddProductForm'da resim yükleme örneği

// Tek resim yükleme
async function handleImageUpload(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/v1/upload/image', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('Yüklenen resim URL:', data.url);
      console.log('Dosya path:', data.path);
      // URL'i state'e kaydet veya veritabanına kaydet
      return data;
    } else {
      alert('Hata: ' + data.error);
    }
  } catch (error) {
    console.error('Upload hatası:', error);
    alert('Resim yüklenirken bir hata oluştu');
  }
}

// Çoklu resim yükleme
async function handleMultipleImageUpload(files: File[]) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await fetch('/api/v1/upload/image', {
      method: 'PUT',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('Yüklenen resimler:', data.files);
      console.log(`${data.uploaded}/${data.total} dosya başarıyla yüklendi`);
      
      if (data.errors && data.errors.length > 0) {
        console.warn('Bazı dosyalar yüklenemedi:', data.errors);
      }
      
      return data.files;
    }
  } catch (error) {
    console.error('Upload hatası:', error);
  }
}

// Resim silme
async function handleImageDelete(path: string) {
  try {
    const response = await fetch('/api/v1/upload/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('Resim silindi');
      return true;
    } else {
      alert('Hata: ' + data.error);
      return false;
    }
  } catch (error) {
    console.error('Silme hatası:', error);
    return false;
  }
}

// Kullanım örneği
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
  if (files.length === 1) {
    // Tek dosya
    const result = await handleImageUpload(files[0]);
    if (result) {
      setImageUrl(result.url);
      setImagePath(result.path); // Silmek için path'i sakla
    }
  } else if (files.length > 1) {
    // Çoklu dosya
    const results = await handleMultipleImageUpload(files);
    if (results) {
      setImageUrls(results.map(r => r.url));
      setImagePaths(results.map(r => r.path));
    }
  }
};
