// client/src/components/ImageUpload.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageUpload = ({ onImageSelect, currentImage, onRemoveImage }) => {
  const [preview, setPreview] = useState(currentImage || '');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
      
      // Pass file to parent
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleRemoveImage = () => {
    setPreview('');
    onRemoveImage();
  };

  return (
    <div className="image-upload-container">
      <label className="form-label">Featured Image</label>
      
      {preview ? (
        <div className="image-preview">
          <img 
            src={preview} 
            alt="Preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              borderRadius: '8px',
              marginBottom: '1rem'
            }} 
          />
          <button 
            type="button" 
            onClick={handleRemoveImage}
            className="btn btn-danger"
            style={{ fontSize: '0.8rem' }}
          >
            🗑️ Remove Image
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          style={{
            border: '2px dashed #ddd',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#f8f9fa' : 'transparent',
            borderColor: isDragActive ? '#4361ee' : '#ddd',
            transition: 'all 0.3s ease'
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div>
              <div className="loading"></div>
              <p>Uploading image...</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <div>
                  <p>Drag & drop an image here, or click to select</p>
                  <p style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.5rem' }}>
                    Supports: JPEG, JPG, PNG, GIF, WEBP (Max: 5MB)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;