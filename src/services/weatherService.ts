import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationItem,
  AIAdvisoryResponse,
  ChatMessage,
} from '../types/weather';
import {
  getAirQualityStatus,
  getWeatherInterpretation,
} from '../utils/weatherUtils';

export async function reverseGeocodeLocation(latitude: number, longitude: number): Promise<LocationItem> {
  // 1. Query server-side reverse geocoding proxy (compliant headers, fast and reliable)
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.name && data.name !== 'Current Location') {
        return data;
      }
    }
  } catch (err) {
    console.warn('Server reverse geocode failed, falling back:', err);
  }

  // 2. Direct client fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&zoom=16&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const specific =
        addr.neighbourhood ||
        addr.suburb ||
        addr.quarter ||
        addr.residential ||
        addr.borough ||
        addr.district ||
        addr.road;

      const area =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county;

      let nichedName = '';
      if (specific && area && specific.toLowerCase() !== area.toLowerCase()) {
        nichedName = `${specific}, ${area}`;
      } else if (area) {
        nichedName = area;
      } else if (specific) {
        nichedName = specific;
      } else if (data.name) {
        nichedName = data.name;
      } else {
        nichedName = addr.state || addr.country || 'Local Area';
      }

      return {
        name: nichedName,
        country: addr.country || '',
        admin1: addr.state || addr.province || addr.region || '',
        latitude,
        longitude,
        timezone: 'auto',
      };
    }
  } catch (err) {
    console.warn('Client reverse geocode fetch failed:', err);
  }

  return {
    name: 'Local Area',
    country: '',
    latitude,
    longitude,
    timezone: 'auto',
  };
}

export async function searchLocations(query: string): Promise<LocationItem[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to query geocoding service');
    const data = await res.json();

    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((r: any) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || 'auto',
    }));
  } catch (error) {
    console.error('Geocoding search failed:', error);
    return [];
  }
}

export async function fetchWeatherDetails(location: LocationItem): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}> {
  const { latitude, longitude } = location;

  // past_days=1 to get yesterday's hourly history for the precision conversational delta!
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&past_days=1&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.statusText}`);
  const data = await res.json();

  const currentRaw = data.current;
  const hourlyRaw = data.hourly;
  const dailyRaw = data.daily;

  const currentInterpretation = getWeatherInterpretation(currentRaw.weather_code, currentRaw.is_day === 1);

  // Approximate dew point using Magnus formula
  const T = currentRaw.temperature_2m;
  const RH = currentRaw.relative_humidity_2m;
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * T) / (b + T)) + Math.log(RH / 100);
  const dewPoint = Math.round(((b * alpha) / (a - alpha)) * 10) / 10;

  let currentUv = 0;
  if (hourlyRaw?.time && hourlyRaw?.uv_index) {
    const nowIso = currentRaw.time;
    const matchIdx = hourlyRaw.time.findIndex((t: string) => t.startsWith(nowIso.substring(0, 13)));
    if (matchIdx !== -1) {
      currentUv = Math.round(hourlyRaw.uv_index[matchIdx] || 0);
    }
  }

  const current: CurrentWeather = {
    temperature: Math.round(currentRaw.temperature_2m * 10) / 10,
    apparentTemperature: Math.round(currentRaw.apparent_temperature * 10) / 10,
    humidity: Math.round(currentRaw.relative_humidity_2m),
    precipitation: currentRaw.precipitation || 0,
    weatherCode: currentRaw.weather_code,
    conditionText: currentInterpretation.label,
    windSpeed: Math.round(currentRaw.wind_speed_10m),
    windDirection: Math.round(currentRaw.wind_direction_10m),
    windGusts: Math.round(currentRaw.wind_gusts_10m || currentRaw.wind_speed_10m),
    surfacePressure: Math.round(currentRaw.surface_pressure),
    cloudCover: Math.round(currentRaw.cloud_cover),
    isDay: currentRaw.is_day === 1,
    uvIndex: currentUv,
    dewPoint,
    visibilityKm: 10,
  };

  // Process 24-hour future forecast starting from current hour
  const hourlyItems: HourlyForecastItem[] = [];
  if (hourlyRaw?.time) {
    const currentPrefix = currentRaw.time.substring(0, 13);
    let startIdx = hourlyRaw.time.findIndex((t: string) => t.startsWith(currentPrefix));
    if (startIdx === -1) startIdx = 24;

    const endIdx = Math.min(startIdx + 24, hourlyRaw.time.length);
    for (let i = startIdx; i < endIdx; i++) {
      const timeStr = hourlyRaw.time[i];
      const d = new Date(timeStr);
      const hour = d.getHours();
      const code = hourlyRaw.weather_code[i];
      const isDayHour = hour >= 6 && hour < 20;

      hourlyItems.push({
        time: timeStr,
        timeFormatted: `${hour.toString().padStart(2, '0')}:00`,
        hour,
        temperature: Math.round(hourlyRaw.temperature_2m[i]),
        apparentTemperature: Math.round(hourlyRaw.apparent_temperature[i]),
        precipitationProbability: hourlyRaw.precipitation_probability ? hourlyRaw.precipitation_probability[i] || 0 : 0,
        precipitation: hourlyRaw.precipitation ? hourlyRaw.precipitation[i] || 0 : 0,
        weatherCode: code,
        conditionText: getWeatherInterpretation(code, isDayHour).label,
        windSpeed: Math.round(hourlyRaw.wind_speed_10m[i]),
        uvIndex: hourlyRaw.uv_index ? Math.round(hourlyRaw.uv_index[i]) : 0,
        isDay: isDayHour,
      });
    }
  }

  // Process 7-day daily forecast
  const dailyItems: DailyForecastItem[] = [];
  if (dailyRaw?.time) {
    const todayDateStr = currentRaw.time.substring(0, 10);
    let todayIdx = dailyRaw.time.findIndex((t: string) => t === todayDateStr);
    if (todayIdx === -1) todayIdx = 1;

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = todayIdx; i < Math.min(todayIdx + 7, dailyRaw.time.length); i++) {
      const dateStr = dailyRaw.time[i];
      const d = new Date(dateStr + 'T12:00:00');
      const dayName = i === todayIdx ? 'Today' : daysOfWeek[d.getDay()];
      const code = dailyRaw.weather_code[i];

      dailyItems.push({
        date: dateStr,
        dayName,
        fullDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weatherCode: code,
        conditionText: getWeatherInterpretation(code, true).label,
        temperatureMax: Math.round(dailyRaw.temperature_2m_max[i]),
        temperatureMin: Math.round(dailyRaw.temperature_2m_min[i]),
        apparentTemperatureMax: Math.round(dailyRaw.apparent_temperature_max[i]),
        apparentTemperatureMin: Math.round(dailyRaw.apparent_temperature_min[i]),
        precipitationSum: Math.round((dailyRaw.precipitation_sum[i] || 0) * 10) / 10,
        precipitationProbabilityMax: dailyRaw.precipitation_probability_max[i] || 0,
        windSpeedMax: Math.round(dailyRaw.wind_speed_10m_max[i]),
        uvIndexMax: Math.round(dailyRaw.uv_index_max[i] || 0),
        sunrise: dailyRaw.sunrise[i]?.substring(11, 16) || '06:00',
        sunset: dailyRaw.sunset[i]?.substring(11, 16) || '19:30',
      });
    }
  }

  return {
    current,
    hourly: hourlyItems,
    daily: dailyItems,
  };
}

export async function fetchAirQuality(latitude: number, longitude: number): Promise<AirQualityData> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Air quality fetch error');
    const data = await res.json();
    const cur = data.current || {};

    const usAqi = Math.round(cur.us_aqi ?? 35);
    const status = getAirQualityStatus(usAqi);

    return {
      usAqi,
      europeanAqi: Math.round(cur.european_aqi ?? 20),
      pm2_5: Math.round(cur.pm2_5 ?? 8),
      pm10: Math.round(cur.pm10 ?? 14),
      ozone: Math.round(cur.ozone ?? 45),
      nitrogenDioxide: Math.round(cur.nitrogen_dioxide ?? 12),
      sulphurDioxide: Math.round(cur.sulphur_dioxide ?? 4),
      carbonMonoxide: Math.round(cur.carbon_monoxide ?? 250),
      statusText: status.statusText,
      statusColor: status.statusColor,
      description: status.description,
    };
  } catch (err) {
    return {
      usAqi: 35,
      pm2_5: 8,
      pm10: 15,
      ozone: 40,
      nitrogenDioxide: 10,
      sulphurDioxide: 3,
      carbonMonoxide: 220,
      statusText: 'Good',
      statusColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      description: 'Satisfactory air quality with low particulate levels.',
    };
  }
}

export async function getAIActivityAdvisory(payload: {
  location: LocationItem;
  current: CurrentWeather;
  hourlySummary: string;
  dailySummary: any;
  airQuality: AirQualityData;
  activities: string[];
  customActivity?: string;
}): Promise<AIAdvisoryResponse> {
  const res = await fetch('/api/ai/activity-advisory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to generate AI activity advisory');
  }

  const data = await res.json();
  return {
    ...data,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function sendChatMessage(messages: ChatMessage[], weatherContext: any): Promise<string> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, weatherContext }),
  });

  if (!res.ok) {
    throw new Error('Failed to communicate with Atmosphere AI');
  }

  const data = await res.json();
  return data.reply || 'No response generated.';
}
