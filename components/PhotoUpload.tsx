'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface PhotoUploadProps {
  value?: string;
  onChange: (base64Image: string) => void;
  error?: string;
}

export default function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isCropping, setIsCropping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [tempPreview, setTempPreview] = useState<string | null>(null); // Store existing image when uploading
  const dragStartRef = useRef({ x: 0, y: 0, imageX: 0, imageY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cropSize = 300; // Fixed circular crop size

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Store existing preview if it exists
        if (preview && !tempPreview) {
          setTempPreview(preview);
        }
        setPreview(result);
        setIsCropping(true);
        setShowMenu(false);
        // Reset position to center (0, 0 means centered since we use translate from center)
        setImagePosition({ x: 0, y: 0 });
        setScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleImageMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    // Store the initial mouse position and current image position in ref
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      imageX: imagePosition.x,
      imageY: imagePosition.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    // Calculate the delta (change) from the initial mouse position
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Update position: initial image position + delta
    setImagePosition({
      x: dragStartRef.current.imageX + deltaX,
      y: dragStartRef.current.imageY + deltaY,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoom = (direction: 'in' | 'out') => {
    setScale((prev) => {
      const newScale = direction === 'in' ? prev * 1.1 : prev * 0.9;
      return Math.max(0.5, Math.min(3, newScale)); // Limit zoom between 0.5x and 3x
    });
  };

  const cropImage = () => {
    if (!preview || !imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const imgRect = imageRef.current!.getBoundingClientRect();
      
      // The crop circle is centered in the container
      const cropCenterX = containerRect.left + containerRect.width / 2;
      const cropCenterY = containerRect.top + containerRect.height / 2;
      const cropRadius = cropSize / 2;

      // Calculate scale factors (accounting for CSS scale transform)
      const scaleX = (img.width / imgRect.width) / scale;
      const scaleY = (img.height / imgRect.height) / scale;

      // Calculate where the crop circle is relative to the image
      // The image is positioned at: center of container + imagePosition offset
      const cropLeftInViewport = cropCenterX - cropRadius;
      const cropTopInViewport = cropCenterY - cropRadius;
      
      // Convert viewport coordinates to image coordinates
      const imageLeft = (cropLeftInViewport - imgRect.left) * scaleX;
      const imageTop = (cropTopInViewport - imgRect.top) * scaleY;
      const cropWidth = cropSize * scaleX;
      const cropHeight = cropSize * scaleY;

      // Set canvas size
      canvas.width = cropSize;
      canvas.height = cropSize;

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, 2 * Math.PI);
      ctx.clip();

      // Draw the cropped image
      ctx.drawImage(
        img,
        imageLeft,
        imageTop,
        cropWidth,
        cropHeight,
        0,
        0,
        cropSize,
        cropSize
      );

      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      onChange(croppedImage);
      setPreview(croppedImage);
      setTempPreview(null); // Clear temp preview after successful crop
      setIsCropping(false);
    };
    img.src = preview;
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setImagePosition({ x: 0, y: 0 });
    setScale(1);
    
    // If there was a previous image, restore it; otherwise clear
    if (tempPreview) {
      setPreview(tempPreview);
      setTempPreview(null);
    } else {
      setPreview(null);
      onChange('');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = () => {
    setPreview(null);
    setTempPreview(null);
    onChange('');
    setShowMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    setShowMenu(false);
    fileInputRef.current?.click();
  };

  const handleView = () => {
    setShowMenu(false);
    setShowViewModal(true);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-rose-400 bg-gray-50'
            }`}
          >
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="text-xs text-gray-500">Upload Photo</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {isCropping ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-90">
                <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
                  {/* Close Button (X) - Top Left */}
                  <button
                    onClick={cancelCrop}
                    className="absolute top-4 left-4 z-20 w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* "Drag the image to adjust" Text - Top Left */}
                  <div className="absolute top-4 left-14 z-20 text-white text-sm">
                    Drag the image to adjust
                  </div>

                  {/* Upload Icon - Top Right */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-white hover:bg-gray-700 rounded-full transition-colors"
                    title="Upload new image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </button>

                  {/* Zoom Controls - Right Side */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-3">
                    <button
                      onClick={() => handleZoom('in')}
                      className="w-10 h-10 flex items-center justify-center bg-gray-700 bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-all"
                      title="Zoom in"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleZoom('out')}
                      className="w-10 h-10 flex items-center justify-center bg-gray-700 bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-all"
                      title="Zoom out"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Crop Container */}
                  <div
                    ref={containerRef}
                    className="relative w-full h-full flex items-center justify-center overflow-hidden"
                  >
                    {/* Circular Crop Overlay */}
                    <div
                      className="absolute z-10 border-4 border-white rounded-full pointer-events-none"
                      style={{
                        width: `${cropSize}px`,
                        height: `${cropSize}px`,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                      }}
                    />

                    {/* Draggable Image */}
                    <div
                      className="absolute cursor-move"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${imagePosition.x}px), calc(-50% + ${imagePosition.y}px)) scale(${scale})`,
                        transformOrigin: 'center center',
                      }}
                      onMouseDown={handleImageMouseDown}
                    >
                      <img
                        ref={imageRef}
                        src={preview}
                        alt="Preview"
                        className="max-w-none select-none"
                        style={{
                          width: `${cropSize * 2}px`,
                          height: 'auto',
                          display: 'block',
                        }}
                        draggable={false}
                      />
                    </div>
                  </div>

                  {/* Confirm Button (Green Checkmark) - Bottom Right */}
                  <button
                    onClick={cropImage}
                    className="absolute bottom-6 right-6 z-20 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg"
                    title="Confirm crop"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  onClick={() => setShowMenu(!showMenu)}
                  className="cursor-pointer relative"
                >
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                  />
                </div>
                
                {/* Options Menu */}
                {showMenu && (
                  <div
                    ref={menuRef}
                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 rounded-lg shadow-xl z-30 min-w-[180px] overflow-hidden"
                  >
                    {/* View Photo */}
                    <button
                      onClick={handleView}
                      className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View photo</span>
                    </button>

                    {/* Upload Photo */}
                    <button
                      onClick={handleUpload}
                      className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Upload photo</span>
                    </button>

                    {/* Separator */}
                    <div className="h-px bg-gray-600"></div>

                    {/* Remove Photo */}
                    <button
                      onClick={removePhoto}
                      className="w-full px-4 py-3 flex items-center gap-3 text-red-400 hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove photo</span>
                    </button>
                  </div>
                )}

                {/* View Modal */}
                {showViewModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
                    onClick={() => setShowViewModal(false)}
                  >
                    <div className="relative max-w-4xl max-h-[90vh] p-4">
                      <button
                        onClick={() => setShowViewModal(false)}
                        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 rounded-full transition-colors bg-gray-800"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <img
                        src={preview || ''}
                        alt="Full view"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
