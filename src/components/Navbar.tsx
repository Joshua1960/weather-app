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
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onUseGeolocation: () => void;
  isGeolocating: boolean;
  isUsingCurrentLocation: boolean;
  isBright?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCity: _currentCity,
  onSelectCity,
  userPreferences: _userPreferences,
  onUpdatePreferences: _onUpdatePreferences,
  unreadNotificationsCount,
  onOpenNotifications,
  onToggleChat: _onToggleChat,
  isChatOpen: _isChatOpen,
  onUseGeolocation: _onUseGeolocation,
  isGeolocating: _isGeolocating,
  isUsingCurrentLocation: _isUsingCurrentLocation,
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

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-500 ${
        isBright
          ? 'border-neutral-300/80 bg-white/70 text-neutral-900 shadow-xs'
          : 'border-neutral-800/80 bg-neutral-950/85 text-neutral-100'
      }`}
    >
      <div className="w-full px-[4vw] flex items-center justify-between py-2.5">
        {/* Left: App Title & Crest Logo */}
        <div className="flex items-center gap-2.5 text-left shrink-0">
          <img
            src="/assets/aistudio/gci-logo_bfc3d977.png"
            alt="GCI Crest"
            className="h-7 w-7 object-contain shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-sans font-bold text-sm sm:text-base tracking-tight leading-none">
              GCI Meteo
            </span>
            <span className="font-mono text-[9px] text-emerald-500 uppercase tracking-wider font-semibold mt-0.5">
              Byte Busters · GCI
            </span>
          </div>
        </div>

        {/* Center: Search Input with increased size and border-radius */}
        <div ref={searchRef} className="relative mx-3 max-w-sm sm:max-w-md flex-1">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search place or landmark (e.g. Bodija, UI, Lagos)..."
              className={`w-full rounded-full border py-2 sm:py-2.5 pr-14 pl-4 font-mono text-xs sm:text-sm focus:outline-none transition-all shadow-xs ${
                isBright
                  ? 'border-neutral-300 bg-white/90 text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20'
                  : 'border-neutral-700/80 bg-neutral-900/90 text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium px-1.5 py-0.5 rounded cursor-pointer ${
                  isBright ? 'text-neutral-500 hover:text-neutral-900' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown with increased border radius */}
          {isSearchOpen && (searchResults.length > 0 || isSearching) && (
            <div
              className={`absolute top-full left-0 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border shadow-2xl z-50 p-1.5 backdrop-blur-md ${
                isBright
                  ? 'border-neutral-300 bg-white/95 text-neutral-900'
                  : 'border-neutral-800 bg-neutral-900/95 text-neutral-100'
              }`}
            >
              {isSearching ? (
                <div className="px-4 py-3 font-mono text-xs text-neutral-500">
                  Searching index...
                </div>
              ) : (
                searchResults.map((loc, idx) => (
                  <button
                    key={`${loc.name}-${loc.latitude}-${idx}`}
                    onClick={() => handleSelectResult(loc)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left font-mono text-xs transition-colors cursor-pointer ${
                      isBright
                        ? 'hover:bg-neutral-100 text-neutral-900'
                        : 'hover:bg-neutral-800 text-neutral-200'
                    }`}
                  >
                    <span className="font-semibold text-xs sm:text-sm">{loc.name}</span>
                    <span className="text-[11px] text-neutral-400 truncate max-w-[140px]">
                      {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: Push Alerts */}
        <div className="flex items-center gap-1.5 sm:gap-2">

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

        </div>
      </div>
    </header>
  );
};
