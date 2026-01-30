'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';

// รายการยี่ห้อรถยนต์ทั้งหมดในโลก (เรียงตาม A-Z)
export const CAR_BRANDS = [
  // ยี่ห้อรถยนต์ญี่ปุ่น
  'Acura', 'Daihatsu', 'Honda', 'Infiniti', 'Isuzu', 'Lexus', 'Mazda', 'Mitsubishi', 
  'Nissan', 'Subaru', 'Suzuki', 'Toyota', 'Yamaha',
  
  // ยี่ห้อรถยนต์เกาหลี
  'Genesis', 'Hyundai', 'Kia', 'SsangYong',
  
  // ยี่ห้อรถยนต์จีน
  'BYD', 'Changan', 'Chery', 'Dongfeng', 'FAW', 'Geely', 'Great Wall', 'Haval', 
  'Hongqi', 'JAC', 'Lynk & Co', 'MG', 'Nio', 'Ora', 'Polestar', 'Xpeng',
  
  // ยี่ห้อรถยนต์อเมริกัน
  'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'GMC', 'Jeep', 
  'Lincoln', 'Ram', 'Tesla',
  
  // ยี่ห้อรถยนต์เยอรมัน
  'Audi', 'BMW', 'Mercedes-Benz', 'Mini', 'Opel', 'Porsche', 'Smart', 'Volkswagen',
  
  // ยี่ห้อรถยนต์อิตาลี
  'Alfa Romeo', 'Ferrari', 'Fiat', 'Lamborghini', 'Lancia', 'Maserati',
  
  // ยี่ห้อรถยนต์ฝรั่งเศส
  'Citroën', 'DS', 'Peugeot', 'Renault',
  
  // ยี่ห้อรถยนต์อังกฤษ
  'Aston Martin', 'Bentley', 'Jaguar', 'Land Rover', 'Lotus', 'McLaren', 'Rolls-Royce',
  
  // ยี่ห้อรถยนต์สวีเดน
  'Volvo',
  
  // ยี่ห้อรถยนต์สเปน
  'Cupra', 'Seat',
  
  // ยี่ห้อรถยนต์เช็ก
  'Skoda',
  
  // ยี่ห้อรถยนต์อินเดีย
  'Mahindra', 'Tata',
  
  // ยี่ห้อรถยนต์มาเลเซีย
  'Proton',
  
  // ยี่ห้อรถยนต์รัสเซีย
  'Lada',
  
  // ยี่ห้อรถยนต์อื่นๆ
  'Alpine', 'Bugatti', 'Lucid', 'Rivian', 'Saab', 'Pagani', 'Koenigsegg'
].sort();

interface BrandSearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function BrandSearchableDropdown({
  value,
  onChange,
  name = 'brand',
  required = false,
  placeholder = 'เช่น Toyota Camry',
  disabled = false
}: BrandSearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter brands based on search term or input value
  const filteredBrands = CAR_BRANDS.filter(brand =>
    brand.toLowerCase().includes((searchTerm || inputValue).toLowerCase())
  );

  const handleBrandSelect = (brand: string) => {
    setInputValue(brand);
    onChange(brand);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredBrands.length > 0 && isOpen) {
      e.preventDefault();
      handleBrandSelect(filteredBrands[0]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          required={required}
          disabled={disabled}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={placeholder}
          autoComplete="off"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <FontAwesomeIcon icon={faSearch} className="text-sm" />
        </div>

        {/* Clear & Dropdown Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-64 overflow-hidden">
          {/* Search in dropdown */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" 
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหายี่ห้อรถ..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                autoFocus
              />
            </div>
          </div>

          {/* Brand List */}
          <div className="overflow-y-auto max-h-52">
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandSelect(brand)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors ${
                    inputValue === brand
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {brand}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                <p>ไม่พบยี่ห้อรถที่ค้นหา</p>
                <p className="text-xs mt-1">คุณสามารถพิมพ์ยี่ห้อรถที่ต้องการได้โดยตรง</p>
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            <p>💡 พิมพ์เพื่อค้นหา หรือเลือกจากรายการ ({filteredBrands.length} รายการ)</p>
          </div>
        </div>
      )}
    </div>
  );
}

