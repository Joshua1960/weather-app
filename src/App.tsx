import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationItem,
  NotificationItem,
  UserPreferences,
  AIAdvisoryResponse,
} from './types/weather';
import {
  fetchWeatherDetails,
  fetchAirQuality,
  getAIActivityAdvisory,
  reverseGeocodeLocation,
} from './services/weatherService';
import {
  formatTemperature,
  getWeatherTheme,
} from './utils/weatherUtils';
import { Navbar } from './components/Navbar';
import { HeroCurrent } from './components/HeroCurrent';
import { HourlyTimeline } from './components/HourlyTimeline';
import { DailyForecast } from './components/DailyForecast';
import { AIActivityAdvisory } from './components/AIActivityAdvisory';
import { NotificationCenter } from './components/NotificationCenter';
import { ChatbotDrawer } from './components/ChatbotDrawer';

const DEFAULT_PINNED_CITIES: LocationItem[] = [
  { name: 'Zurich', country: 'Switzerland', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  tempUnit: 'C',
  windUnit: 'kmh',
  precipUnit: 'mm',
  theme: 'dark',
  pinnedCities: DEFAULT_PINNED_CITIES,
  activeCity: DEFAULT_PINNED_CITIES[0],
  favoriteActivities: ['Outdoor Activities'],
  notificationsEnabled: true,
  alertRules: {
    rainAlert: true,
    tempAlert: true,
    highUvAlert: true,
    aqiAlert: true,
    morningBriefing: true,
  },
  dashboardWidgets: {
    hero: true,
    deltaSummary: true,
    advisory: true,
    hourlyTimeline: true,
    weeklyForecast: true,
    atmosphericMetrics: true,
    airQuality: true,
    sunMoon: true,
  },
};

export default function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('gci_weather_preferences');
      if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [currentCity, setCurrentCity] = useState<LocationItem>(preferences.activeCity || DEFAULT_PINNED_CITIES[0]);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState<boolean>(false);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [advisory, setAdvisory] = useState<AIAdvisoryResponse | null>(null);

  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [isLoadingAdvisory, setIsLoadingAdvisory] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isGeolocating, setIsGeolocating] = useState<boolean>(false);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const hasRequestedInitialGeo = useRef<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('gci_weather_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn(e);
    }
  }, [preferences]);

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Load weather and air quality for a given location
  const loadWeatherData = useCallback(async (cityToLoad: LocationItem) => {
    setIsLoadingWeather(true);
    setWeatherError(null);

    try {
      const [weatherRes, aqiRes] = await Promise.all([
        fetchWeatherDetails(cityToLoad),
        fetchAirQuality(cityToLoad.latitude, cityToLoad.longitude),
      ]);

      setCurrentWeather(weatherRes.current);
      setHourly(weatherRes.hourly);
      setDaily(weatherRes.daily);
      setAirQuality(aqiRes);

      loadAIAdvisory(cityToLoad, weatherRes.current, aqiRes, weatherRes.daily[0]);
    } catch (err: any) {
      console.error('Failed to load weather data:', err);
      setWeatherError('Unable to retrieve meteorological telemetries.');
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  const loadAIAdvisory = async (
    loc: LocationItem,
    cur: CurrentWeather,
    aqi: AirQualityData,
    todayD?: DailyForecastItem,
    customActivity?: string
  ) => {
    setIsLoadingAdvisory(true);
    try {
      const adv = await getAIActivityAdvisory({
        location: loc,
        current: cur,
        hourlySummary: `Next 12h: ${cur.conditionText}, ${cur.temperature}°C, Wind ${cur.windSpeed}km/h`,
        dailySummary: todayD,
        airQuality: aqi,
        activities: preferences.favoriteActivities,
        customActivity,
      });
      setAdvisory(adv);
    } catch (err) {
      console.warn('AI advisory error:', err);
    } finally {
      setIsLoadingAdvisory(false);
    }
  };

  const handleRefreshAdvisory = (customAct?: string) => {
    if (currentWeather && airQuality) {
      loadAIAdvisory(currentCity, currentWeather, airQuality, daily[0], customAct);
    }
  };

  // Acquire user's current GPS location by default
  const acquireCurrentLocation = useCallback((silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) {
        addNotification({
          title: 'Location Unavailable',
          body: 'Browser geolocation is not supported on this device.',
          type: 'info',
        });
      }
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const loc = await reverseGeocodeLocation(latitude, longitude);
          setCurrentCity(loc);
          setIsUsingCurrentLocation(true);
          updatePreferences({ activeCity: loc });
        } catch (err) {
          console.warn('Geolocation geocode failed:', err);
        } finally {
          setIsGeolocating(false);
        }
      },
      (err) => {
        setIsGeolocating(false);
        console.warn('Geolocation access fallback:', err.message);
        if (!silent) {
          addNotification({
            title: 'Location Permission Denied',
            body: 'Showing default location. You can search any city anytime.',
            type: 'info',
          });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  // Use current location by default on mount!
  useEffect(() => {
    if (!hasRequestedInitialGeo.current) {
      hasRequestedInitialGeo.current = true;
      acquireCurrentLocation(true);
    }
  }, [acquireCurrentLocation]);

  useEffect(() => {
    loadWeatherData(currentCity);
  }, [currentCity, loadWeatherData]);

  const handleSelectCity = (newCity: LocationItem) => {
    setCurrentCity(newCity);
    setIsUsingCurrentLocation(false);
    updatePreferences({ activeCity: newCity });
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  // Dynamic background based on weather and temperature
  const weatherTheme = getWeatherTheme(currentWeather);
  const isBright = weatherTheme.isBright;

  return (
    <div
      className={`min-h-screen relative flex flex-col font-sans transition-colors duration-700 selection:bg-neutral-500/20 ${
        weatherTheme.bgGradient
      } ${isBright ? 'text-neutral-900' : 'text-neutral-100'}`}
    >
      {/* Atmospheric Ambient Glows according to weather condition */}
      {(weatherTheme.themeName === 'sunny-hot' || weatherTheme.themeName === 'sunny') && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-300/35 blur-3xl" />
          <div className="absolute top-20 left-10 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        </div>
      )}
      {weatherTheme.themeName === 'cloudy' && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-slate-400/20 via-zinc-400/10 to-transparent blur-2xl" />
          <div className="absolute top-16 -left-20 h-64 w-[500px] rounded-full bg-slate-400/30 blur-3xl" />
          <div className="absolute top-32 right-0 h-64 w-[450px] rounded-full bg-zinc-400/25 blur-3xl" />
        </div>
      )}
      {weatherTheme.themeName === 'rainy' && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-20 inset-x-0 h-80 bg-gradient-to-b from-slate-700/25 to-transparent blur-2xl" />
          <div className="absolute top-40 left-1/3 h-64 w-64 rounded-full bg-sky-900/20 blur-3xl" />
        </div>
      )}

      {/* Streamlined Navbar */}
      <Navbar
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        userPreferences={preferences}
        onUpdatePreferences={updatePreferences}
        unreadNotificationsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onUseGeolocation={() => acquireCurrentLocation(false)}
        isGeolocating={isGeolocating}
        isUsingCurrentLocation={isUsingCurrentLocation}
        isBright={isBright}
      />

      {/* Main Column - Clean Centered Layout */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-4xl px-4 py-3 sm:py-5 space-y-6">
        {weatherError ? (
          <div className="rounded-sm border border-rose-500/30 bg-rose-500/10 p-5 font-mono text-xs text-rose-300 flex items-center justify-between">
            <span>{weatherError}</span>
            <button
              onClick={() => loadWeatherData(currentCity)}
              className="rounded bg-rose-500/20 px-3 py-1 font-bold text-white hover:bg-rose-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : isLoadingWeather && !currentWeather ? (
          <div className="flex flex-col items-center justify-center py-24 font-mono text-xs text-neutral-500 space-y-2">
            <span>Calibrating weather for {currentCity.name}...</span>
          </div>
        ) : currentWeather && airQuality ? (
          <>
            {/* Minimalist Hero: Temperature, Condition, and Streamlined Atmospheric Ribbon */}
            <HeroCurrent
              location={currentCity}
              current={currentWeather}
              todayDaily={daily[0]}
              airQuality={airQuality}
              userPreferences={preferences}
              isBright={isBright}
            />

            {/* AI Activity Advisory */}
            <AIActivityAdvisory
              current={currentWeather}
              advisory={advisory}
              isLoading={isLoadingAdvisory}
              onRefresh={handleRefreshAdvisory}
              locationName={currentCity.name}
              isBright={isBright}
            />

            {/* 24-Hour Forecast Timeline */}
            <HourlyTimeline
              hourly={hourly}
              userPreferences={preferences}
              isBright={isBright}
            />

            {/* 7-Day Synoptic Forecast */}
            <DailyForecast
              daily={daily}
              userPreferences={preferences}
              isBright={isBright}
            />
          </>
        ) : null}
      </main>

      {/* Persistent Floating Chat Trigger (Bottom Right) */}
      {!isChatOpen && (
        <aside aria-label="GCI Meteo AI Assistant launcher" className="fixed bottom-5 right-5 z-30">
          <button
            onClick={() => setIsChatOpen(true)}
            className={`flex items-center rounded-full border px-4 py-2 sm:px-4.5 sm:py-2.5 shadow-xl backdrop-blur-md text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
              isBright
                ? 'border-neutral-300 bg-white/95 text-neutral-900 hover:border-emerald-600 hover:bg-white shadow-md'
                : 'border-neutral-700 bg-neutral-900/95 text-neutral-100 hover:border-emerald-500 hover:bg-neutral-800 hover:text-white shadow-xl'
            }`}
          >
            <span>GCI Meteo</span>
          </button>
        </aside>
      )}

      {/* Simple Push Notifications Modal */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onClearAll={() => setNotifications([])}
        onAddNotification={addNotification}
        userPreferences={preferences}
        onUpdatePreferences={updatePreferences}
        locationName={currentCity.name}
        isBright={isBright}
      />

      {currentWeather && (
        <ChatbotDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          location={currentCity}
          current={currentWeather}
          todayDaily={daily[0]}
          isBright={isBright}
        />
      )}

      {/* Minimal Footer */}
      <footer
        className={`relative z-10 border-t py-5 font-mono text-xs transition-colors ${
          isBright
            ? 'border-neutral-300/80 bg-white/60 text-neutral-600'
            : 'border-neutral-800/60 bg-neutral-950/80 text-neutral-500'
        }`}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${isBright ? 'text-neutral-900' : 'text-neutral-300'}`}>
              GCI // WEATHER
            </span>
          </div>
          <div className={`text-[11px] ${isBright ? 'text-neutral-500' : 'text-neutral-500'}`}>
            Open-Meteo API
          </div>
        </div>
      </footer>
    </div>
  );
}
