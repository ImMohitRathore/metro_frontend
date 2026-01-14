'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomFormFieldProps {
  id?: string;
  name: string;
  label?: string;
  type?: 'select' | 'text' | 'email' | 'date' | 'number' | 'textarea' | 'password';
  value: string | number | '';
  options?: Option[];
  placeholder?: string;
  onChange: (name: string, value: string | number) => void;
  onTextChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
}

export default function CustomFormField({
  id,
  name,
  label,
  type = 'select',
  value,
  options = [],
  placeholder = 'Select an option',
  onChange,
  onTextChange,
  error,
  className = '',
  disabled = false,
  rows = 4,
  maxLength,
}: CustomFormFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected option label for select type
  const selectedOption = type === 'select' ? options.find((opt) => opt.value === value) : null;

  // Filter options based on search term using useMemo
  const filteredOptions = useMemo(() => {
    if (type !== 'select' || searchTerm.trim() === '') {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, options, type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (type !== 'select') return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [type]);

  const handleSelect = (option: Option) => {
    onChange(name, option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onTextChange) {
      onTextChange(e);
    } else {
      onChange(name, e.target.value);
    }
  };

  // Render input/textarea fields
  if (type !== 'select') {
    const inputClasses = `w-full px-3 py-3 border ${
      error ? 'border-red-300' : 'border-gray-300'
    } rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 ${
      disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
    } ${className}`;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id || name} className="block text-sm font-bold text-gray-900 mb-2">
            {label}
          </label>
        )}
        {type === 'textarea' ? (
          <textarea
            id={id || name}
            name={name}
            value={value as string}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            maxLength={maxLength}
            className={`${inputClasses} resize-none`}
          />
        ) : (
          <input
            id={id || name}
            name={name}
            type={type}
            value={value as string}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={inputClasses}
          />
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Render select dropdown
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={id || name} className="block text-sm font-bold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`relative w-full px-3 py-3 border ${
          error ? 'border-red-300' : 'border-gray-300'
        } rounded-lg text-gray-900 bg-white text-left focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 pr-12 flex items-center justify-between ${
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform absolute right-3 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 placeholder:text-gray-400"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                    value === option.value ? 'bg-rose-50 text-rose-600' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
