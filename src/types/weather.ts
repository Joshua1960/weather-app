export interface LocationItem {
  id?: number | string;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isFavorite?: boolean;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  conditionText: string;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  surfacePressure: number;
  cloudCover: number;
  isDay: boolean;
  uvIndex: number;
  dewPoint?: number;
  visibilityKm?: number;
}

export interface HourlyForecastItem {
  time: string;
  timeFormatted: string;
  hour: number;
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  conditionText: string;
  windSpeed: number;
  uvIndex: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  fullDate: string;
  weatherCode: number;
  conditionText: string;
  temperatureMax: number;
  temperatureMin: number;
  apparentTemperatureMax: number;
  apparentTemperatureMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

export interface AirQualityData {
  usAqi: number;
  europeanAqi?: number;
  pm2_5: number;
  pm10: number;
  ozone: number;
  nitrogenDioxide: number;
  sulphurDioxide: number;
  carbonMonoxide: number;
  statusText: string;
  statusColor: string;
  description: string;
}

export interface YesterdayDelta {
  yesterdayTemp: number;
  deltaC: number;
  formattedDelta: string;
  conversationalSummary: string;
}

export interface ActivityAdvisoryItem {
  name: string;
  rating: 'Optimal' | 'Good' | 'Fair' | 'Caution' | 'Avoid';
  score: number;
  bestTimeWindow: string;
  verdict: string;
  keyFactor: string;
  category?: string;
}

export interface AIAdvisoryResponse {
  overallSummary: string;
  clothingRecommendation: string;
  advisories: ActivityAdvisoryItem[];
  generatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'rain' | 'extreme_temp' | 'uv' | 'aqi' | 'briefing' | 'info';
  read: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface UserPreferences {
  tempUnit: 'C' | 'F';
  windUnit: 'kmh' | 'mph' | 'ms';
  precipUnit: 'mm' | 'in';
  theme: 'dark' | 'light' | 'oled';
  pinnedCities: LocationItem[];
  activeCity: LocationItem;
  favoriteActivities: string[];
  notificationsEnabled: boolean;
  alertRules: {
    rainAlert: boolean;
    tempAlert: boolean;
    highUvAlert: boolean;
    aqiAlert: boolean;
    morningBriefing: boolean;
  };
  dashboardWidgets: {
    hero: boolean;
    deltaSummary: boolean;
    advisory: boolean;
    hourlyTimeline: boolean;
    weeklyForecast: boolean;
    atmosphericMetrics: boolean;
    airQuality: boolean;
    sunMoon: boolean;
  };
}
