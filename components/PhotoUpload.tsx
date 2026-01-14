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
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        setPreview(result);
        setIsCropping(true);
        // Reset crop area
        setCropArea({ x: 50, y: 50, width: 200, height: 200 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropAreaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropArea.x,
      y: e.clientY - cropArea.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - container.left - dragStart.x;
    const newY = e.clientY - container.top - dragStart.y;

    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(newX, container.width - prev.width)),
      y: Math.max(0, Math.min(newY, container.height - prev.height)),
    }));
  }, [isDragging, dragStart]);

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

  const handleResize = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = cropArea.width;
    const startHeight = cropArea.height;
    const startCropX = cropArea.x;
    const startCropY = cropArea.y;
    const container = containerRef.current?.getBoundingClientRect();

    if (!container) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startCropX;
      let newY = startCropY;

      if (corner.includes('right')) {
        newWidth = Math.max(100, Math.min(startWidth + deltaX, container.width - startCropX));
      }
      if (corner.includes('left')) {
        newWidth = Math.max(100, startWidth - deltaX);
        newX = Math.max(0, startCropX + deltaX);
      }
      if (corner.includes('bottom')) {
        newHeight = Math.max(100, Math.min(startHeight + deltaY, container.height - startCropY));
      }
      if (corner.includes('top')) {
        newHeight = Math.max(100, startHeight - deltaY);
        newY = Math.max(0, startCropY + deltaY);
      }

      setCropArea({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
      
      const scaleX = img.width / imgRect.width;
      const scaleY = img.height / imgRect.height;

      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      ctx.drawImage(
        img,
        cropArea.x * scaleX,
        cropArea.y * scaleY,
        cropArea.width * scaleX,
        cropArea.height * scaleY,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      onChange(croppedImage);
      setPreview(croppedImage);
      setIsCropping(false);
    };
    img.src = preview;
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const editPhoto = () => {
    setIsCropping(true);
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
              <div
                ref={containerRef}
                className="relative w-64 h-64 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  ref={imageRef}
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
                  style={{
                    left: `${cropArea.x}px`,
                    top: `${cropArea.y}px`,
                    width: `${cropArea.width}px`,
                    height: `${cropArea.height}px`,
                  }}
                  onMouseDown={handleCropAreaMouseDown}
                >
                  <div 
                    className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
                    onMouseDown={(e) => handleResize(e, 'top-left')}
                  />
                  <div 
                    className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
                    onMouseDown={(e) => handleResize(e, 'top-right')}
                  />
                  <div 
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
                    onMouseDown={(e) => handleResize(e, 'bottom-left')}
                  />
                  <div 
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                    onMouseDown={(e) => handleResize(e, 'bottom-right')}
                  />
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                  <button
                    onClick={cropImage}
                    className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors"
                  >
                    Crop
                  </button>
                  <button
                    onClick={cancelCrop}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Profile"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-lg leading-none"
                >
                  ×
                </button>
                <button
                  onClick={editPhoto}
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
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
