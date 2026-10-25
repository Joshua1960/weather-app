import React, { useState, useEffect, useRef } from 'react';
import { LocationItem, UserPreferences } from '../types/weather';
import { searchLocations } from '../services/weatherService';

interface NavbarProps {
  currentCity: LocationItem;
  onSelectCity: (city: LocationItem) => void;
  userPreferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onUseGeolocation: () => void;
  isGeolocating: boolean;
  isUsingCurrentLocation: boolean;
  isBright?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity,
  onSelectCity,
  userPreferences,
  onUpdatePreferences,
  unreadNotificationsCount,
  onOpenNotifications,
  onToggleChat,
  isChatOpen,
  onUseGeolocation,
  isGeolocating,
  isUsingCurrentLocation,
  isBright = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (loc: LocationItem) => {
    onSelectCity(loc);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  const toggleTempUnit = () => {
    onUpdatePreferences({ tempUnit: userPreferences.tempUnit === 'C' ? 'F' : 'C' });
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-500 ${
        isBright
          ? 'border-neutral-300/80 bg-white/70 text-neutral-900 shadow-xs'
          : 'border-neutral-800/80 bg-neutral-950/85 text-neutral-100'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        {/* Left: App Title */}
        <div className="flex items-center gap-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-sm font-mono text-xs font-bold ${
              isBright ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-950'
            }`}
          >
            GCI
          </div>
          <span className="font-sans font-bold text-sm sm:text-base tracking-tight">
            GCI Weather App
          </span>
        </div>

        {/* Center: Minimal Search Input */}
        <div ref={searchRef} className="relative mx-3 max-w-xs flex-1">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search location..."
              className={`w-full rounded-sm border py-1 pr-12 pl-3 font-mono text-xs focus:outline-none transition-colors ${
                isBright
                  ? 'border-neutral-300 bg-white/80 text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-700'
                  : 'border-neutral-800 bg-neutral-900/80 text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-600 focus:bg-neutral-900'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`absolute right-2 text-[10px] ${
                  isBright ? 'text-neutral-500 hover:text-neutral-900' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (searchResults.length > 0 || isSearching) && (
            <div
              className={`absolute top-full left-0 mt-1 max-h-64 w-full overflow-y-auto rounded-sm border shadow-xl z-50 ${
                isBright
                  ? 'border-neutral-300 bg-white text-neutral-900'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-100'
              }`}
            >
              {isSearching ? (
                <div className="px-3 py-2 font-mono text-xs text-neutral-500">
                  Searching index...
                </div>
              ) : (
                searchResults.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${loc.latitude}-${idx}`}
                    onClick={() => handleSelectResult(loc)}
                    className={`flex w-full items-center justify-between border-b px-3 py-2 text-left font-mono text-xs transition-colors last:border-0 ${
                      isBright
                        ? 'border-neutral-100 hover:bg-neutral-100 text-neutral-900'
                        : 'border-neutral-800/40 hover:bg-neutral-800 text-neutral-200'
                    }`}
                  >
                    <span className="font-medium">{loc.name}</span>
                    <span className="text-[11px] text-neutral-500 truncate max-w-[120px]">
                      {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Unit Toggle, Push Alerts, AI Chat (Pref removed as requested) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Unit Toggle */}
          <button
            onClick={toggleTempUnit}
            className={`flex h-7 items-center rounded-sm border px-2 font-mono text-xs font-semibold transition-colors ${
              isBright
                ? 'border-neutral-300 bg-white/80 text-neutral-800 hover:bg-white'
                : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
            title="Toggle Celsius / Fahrenheit"
          >
            <span>°{userPreferences.tempUnit}</span>
          </button>

          {/* Notifications / Alerts */}
          <button
            onClick={onOpenNotifications}
            className={`relative flex h-7 items-center rounded-sm border px-2.5 font-mono text-xs transition-colors ${
              isBright
                ? 'border-neutral-300 bg-white/80 text-neutral-800 hover:bg-white'
                : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 hover:text-neutral-200'
            }`}
            title="Push alerts"
          >
            <span>Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="ml-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-mono font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* AI Chat */}
          <button
            onClick={onToggleChat}
            className={`flex h-7 items-center rounded-sm border px-2.5 font-mono text-xs transition-colors ${
              isChatOpen
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold'
                : isBright
                ? 'border-neutral-300 bg-white/80 text-neutral-800 hover:bg-white'
                : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
            title="Ask AI Weather Bestie"
          >
            <span>AI Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};
