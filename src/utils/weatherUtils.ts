// WMO Weather Interpretation Codes (WW)
export function getWeatherInterpretation(code: number, isDay = true): {
  label: string;
  shortDesc: string;
  iconName: string;
} {
  switch (code) {
    case 0:
      return {
        label: isDay ? 'Clear sky' : 'Clear night',
        shortDesc: 'Unobstructed sky',
        iconName: isDay ? 'Sun' : 'Moon',
      };
    case 1:
      return {
        label: isDay ? 'Mainly clear' : 'Clear skies',
        shortDesc: 'Isolated high cirrus',
        iconName: isDay ? 'SunMedium' : 'MoonStar',
      };
    case 2:
      return {
        label: 'Partly cloudy',
        shortDesc: 'Scattered cumulus clouds',
        iconName: 'CloudSun',
      };
    case 3:
      return {
        label: 'Cloudy',
        shortDesc: 'Dense cloud cover',
        iconName: 'Cloud',
      };
    case 45:
    case 48:
      return {
        label: 'Fog & Rime',
        shortDesc: 'Reduced surface visibility',
        iconName: 'CloudFog',
      };
    case 51:
    case 53:
    case 55:
      return {
        label: 'Light drizzle',
        shortDesc: 'Fine persistent droplets',
        iconName: 'CloudDrizzle',
      };
    case 56:
    case 57:
      return {
        label: 'Freezing drizzle',
        shortDesc: 'Freezing glaze potential',
        iconName: 'CloudSnow',
      };
    case 61:
      return {
        label: 'Slight rain',
        shortDesc: 'Scattered gentle rainfall',
        iconName: 'CloudRain',
      };
    case 63:
      return {
        label: 'Moderate rain',
        shortDesc: 'Steady precipitation',
        iconName: 'CloudRain',
      };
    case 65:
      return {
        label: 'Heavy rain',
        shortDesc: 'Intense precipitation',
        iconName: 'CloudRainWind',
      };
    case 66:
    case 67:
      return {
        label: 'Freezing rain',
        shortDesc: 'Icy surface hazard',
        iconName: 'CloudSnow',
      };
    case 71:
    case 73:
    case 75:
      return {
        label: 'Snowfall',
        shortDesc: 'Accumulating snow crystals',
        iconName: 'Snowflake',
      };
    case 77:
      return {
        label: 'Snow grains',
        shortDesc: 'Fine granular frozen precip',
        iconName: 'Snowflake',
      };
    case 80:
    case 81:
    case 82:
      return {
        label: 'Rain showers',
        shortDesc: 'Transient convective bursts',
        iconName: 'CloudSunRain',
      };
    case 85:
    case 86:
      return {
        label: 'Snow showers',
        shortDesc: 'Intermittent snow squalls',
        iconName: 'CloudSnow',
      };
    case 95:
      return {
        label: 'Thunderstorm',
        shortDesc: 'Convective lightning & gusts',
        iconName: 'CloudLightning',
      };
    case 96:
    case 99:
      return {
        label: 'Severe thunderstorm with hail',
        shortDesc: 'Violent squalls and hail',
        iconName: 'Zap',
      };
    default:
      return {
        label: 'Atmospheric variance',
        shortDesc: 'Variable local conditions',
        iconName: 'Cloud',
      };
  }
}

export function formatTemperature(celsius: number, unit: 'C' | 'F' = 'C', showUnit = true): string {
  const value = unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
  const rounded = Math.round(value);
  return showUnit ? `${rounded}°${unit}` : `${rounded}°`;
}

export function formatWindSpeed(kmh: number, unit: 'kmh' | 'mph' | 'ms' = 'kmh'): string {
  if (unit === 'mph') {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  if (unit === 'ms') {
    return `${(kmh / 3.6).toFixed(1)} m/s`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatPrecipitation(mm: number, unit: 'mm' | 'in' = 'mm'): string {
  if (unit === 'in') {
    return `${(mm * 0.0393701).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function getWindDirectionLabel(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

export function getAirQualityStatus(aqi: number): {
  statusText: string;
  statusColor: string;
  description: string;
} {
  if (aqi <= 50) {
    return {
      statusText: 'Excellent',
      statusColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      description: 'Air quality is satisfactory with minimal pollution risk.',
    };
  }
  if (aqi <= 100) {
    return {
      statusText: 'Moderate',
      statusColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      description: 'Acceptable; unusually sensitive individuals may notice mild effects.',
    };
  }
  if (aqi <= 150) {
    return {
      statusText: 'Unhealthy for Sensitive Groups',
      statusColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      description: 'Active children and adults with respiratory issues should limit prolonged outdoor exertion.',
    };
  }
  if (aqi <= 200) {
    return {
      statusText: 'Unhealthy',
      statusColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      description: 'Everyone may experience health effects; sensitive groups more severely.',
    };
  }
  return {
    statusText: 'Hazardous',
    statusColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    description: 'Health warning of emergency conditions. Entire population is likely affected.',
  };
}

export interface WeatherTheme {
  themeName: 'sunny-hot' | 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'night';
  isBright: boolean;
  bgGradient: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  pillBg: string;
  accentColor: string;
}

export function getWeatherTheme(current: {
  weatherCode: number;
  isDay: boolean;
  temperature: number;
} | null): WeatherTheme {
  if (!current) {
    return {
      themeName: 'night',
      isBright: false,
      bgGradient: 'bg-neutral-950',
      cardBg: 'bg-neutral-900/40',
      cardBorder: 'border-neutral-800/80',
      textPrimary: 'text-neutral-100',
      textSecondary: 'text-neutral-300',
      textMuted: 'text-neutral-500',
      pillBg: 'bg-neutral-800/80',
      accentColor: 'text-emerald-400',
    };
  }

  const { weatherCode, isDay, temperature } = current;

  // Night time when not daylight
  if (!isDay) {
    return {
      themeName: 'night',
      isBright: false,
      bgGradient: 'bg-gradient-to-b from-slate-950 via-neutral-950 to-indigo-950/40',
      cardBg: 'bg-neutral-900/50 backdrop-blur-md',
      cardBorder: 'border-neutral-800/80',
      textPrimary: 'text-neutral-100',
      textSecondary: 'text-neutral-300',
      textMuted: 'text-neutral-500',
      pillBg: 'bg-neutral-800/80',
      accentColor: 'text-emerald-400',
    };
  }

  // Thunderstorm / Severe Storm
  if (weatherCode >= 95) {
    return {
      themeName: 'rainy',
      isBright: false,
      bgGradient: 'bg-gradient-to-b from-slate-900 via-neutral-900 to-indigo-950',
      cardBg: 'bg-neutral-900/60 backdrop-blur-md',
      cardBorder: 'border-neutral-800',
      textPrimary: 'text-neutral-100',
      textSecondary: 'text-neutral-300',
      textMuted: 'text-neutral-400',
      pillBg: 'bg-neutral-800/80',
      accentColor: 'text-amber-400',
    };
  }

  // Rain / Drizzle / Shower
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return {
      themeName: 'rainy',
      isBright: false,
      bgGradient: 'bg-gradient-to-b from-slate-900 via-slate-800 to-neutral-900',
      cardBg: 'bg-slate-900/60 backdrop-blur-md',
      cardBorder: 'border-slate-800',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
      pillBg: 'bg-slate-800/80',
      accentColor: 'text-sky-400',
    };
  }

  // Snow / Freezing (< 0°C or snow codes)
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86) || temperature <= 0) {
    return {
      themeName: 'snowy',
      isBright: true,
      bgGradient: 'bg-gradient-to-b from-sky-100 via-slate-100 to-blue-50',
      cardBg: 'bg-white/80 backdrop-blur-md',
      cardBorder: 'border-sky-200/90',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-500',
      pillBg: 'bg-white/90',
      accentColor: 'text-sky-600',
    };
  }

  // Cloudy / Fog (Codes 2, 3, 45, 48)
  if (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) {
    return {
      themeName: 'cloudy',
      isBright: true,
      bgGradient: 'bg-gradient-to-b from-slate-300 via-neutral-200 to-zinc-300',
      cardBg: 'bg-white/75 backdrop-blur-md',
      cardBorder: 'border-slate-300/90',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-700',
      textMuted: 'text-slate-500',
      pillBg: 'bg-white/90',
      accentColor: 'text-slate-800',
    };
  }

  // Sunny / Clear Sky (Codes 0, 1) or warm daylight
  if (temperature >= 26) {
    return {
      themeName: 'sunny-hot',
      isBright: true,
      bgGradient: 'bg-gradient-to-b from-amber-100 via-amber-50 to-orange-50/70',
      cardBg: 'bg-white/80 backdrop-blur-md',
      cardBorder: 'border-amber-200/80',
      textPrimary: 'text-neutral-900',
      textSecondary: 'text-neutral-700',
      textMuted: 'text-neutral-500',
      pillBg: 'bg-white/90',
      accentColor: 'text-amber-600',
    };
  }

  // Standard Sunny / Clear daylight
  return {
    themeName: 'sunny',
    isBright: true,
    bgGradient: 'bg-gradient-to-b from-sky-100 via-blue-50 to-amber-50/60',
    cardBg: 'bg-white/80 backdrop-blur-md',
    cardBorder: 'border-sky-200/80',
    textPrimary: 'text-neutral-900',
    textSecondary: 'text-neutral-700',
    textMuted: 'text-neutral-500',
    pillBg: 'bg-white/90',
    accentColor: 'text-sky-600',
  };
}

// Crisp, precision Swiss audio chime synthesized via Web Audio API
export function playNotificationTone(type: 'alert' | 'info' | 'success' = 'info') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'alert') {
      // Two-tone warning beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.08);

      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);
    } else {
      // Single clean bell strike
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    }
  } catch {
    // Audio context may be restricted before user interaction, safely ignore
  }
}

// Request and dispatch Native Web Push / Browser Notifications
export async function sendNativeNotification(title: string, body: string, icon = '/favicon.ico') {
  if (!('Notification' in window)) return false;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: false,
      });
      return true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon,
          badge: icon,
        });
        return true;
      }
    }
  } catch (err) {
    console.warn('Native notification dispatch error:', err);
  }
  return false;
}

export interface ActualWeatherImageInfo {
  url: string;
  alt: string;
  label: string;
}

/**
 * Returns a real high-resolution photograph (NOT an illustration or drawing)
 * representing the current sky and weather condition.
 */
export function getActualWeatherImage(code: number, isDay = true): ActualWeatherImageInfo {
  // Sunny / Clear Day
  if ((code === 0 || code === 1) && isDay) {
    return {
      url: 'https://images.unsplash.com/photo-1617155093730-a8bf47be792d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of blazing bright sun in the sky',
      label: 'Bright Sun',
    };
  }

  // Clear Night
  if ((code === 0 || code === 1) && !isDay) {
    return {
      url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of starry night sky with moon',
      label: 'Clear Night Sky',
    };
  }

  // Partly Cloudy
  if (code === 2) {
    return {
      url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of sunlit clouds in the sky',
      label: 'Sunlit Clouds',
    };
  }

  // Cloudy / Overcast
  if (code === 3) {
    return {
      url: 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of dense clouds covering the sky',
      label: 'Cloudy Sky',
    };
  }

  // Fog & Mist
  if (code === 45 || code === 48) {
    return {
      url: 'https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of real atmospheric fog and mist',
      label: 'Fog & Mist',
    };
  }

  // Rain, Drizzle, Showers
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return {
      url: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of real rainfall and water droplets',
      label: 'Rainfall',
    };
  }

  // Freezing Rain & Icy precipitation
  if ([56, 57, 66, 67].includes(code)) {
    return {
      url: 'https://images.unsplash.com/photo-1516431883659-655d41c09bf9?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of icy freezing precipitation',
      label: 'Freezing Rain',
    };
  }

  // Snow & Snow Showers
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      url: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of real falling snow',
      label: 'Snowfall',
    };
  }

  // Thunderstorm / Severe Storm with hail
  if ([95, 96, 99].includes(code)) {
    return {
      url: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1200&q=80',
      alt: 'Actual photograph of real thunderstorm and lightning strike',
      label: 'Thunderstorm',
    };
  }

  // Default fallback based on day/night
  return {
    url: isDay
      ? 'https://images.unsplash.com/photo-1617155093730-a8bf47be792d?auto=format&fit=crop&w=1200&q=80'
      : 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    alt: 'Actual photograph of the sky',
    label: isDay ? 'Sun' : 'Night Sky',
  };
}
