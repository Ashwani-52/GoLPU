import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';

export default function LocationInput({ label, value, onChange, locations, placeholder, icon: Icon = MapPin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter locations based on search
  const filteredLocations = locations.filter(loc => 
    loc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      
      <div 
        className="relative flex items-center glass-input rounded-xl overflow-hidden cursor-text"
        onClick={() => setIsOpen(true)}
      >
        <div className="pl-4 pr-3 text-saffron-500">
          <Icon size={18} />
        </div>
        
        <input
          type="text"
          className="w-full bg-transparent py-3.5 pr-4 text-white text-sm focus:outline-none placeholder-gray-500"
          placeholder={placeholder}
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            onChange(e.target.value); // keep the parent state updated somewhat, though mostly we select from list
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch(value); // Initialize search with current value
          }}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-navy-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up origin-top">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((loc, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                  onClick={() => {
                    onChange(loc);
                    setSearch('');
                    setIsOpen(false);
                  }}
                >
                  <MapPin size={14} className="text-gray-500" />
                  {loc}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No locations found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
