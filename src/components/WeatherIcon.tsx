import React from 'react';
import {
  Sun,
  SunMedium,
  Moon,
  MoonStar,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Zap,
  Snowflake,
  Wind,
  Droplets,
  HelpCircle,
} from 'lucide-react';

interface WeatherIconProps {
  iconName?: string;
  weatherCode?: number;
  isDay?: boolean;
  className?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  iconName,
  weatherCode,
  isDay = true,
  className = 'w-6 h-6',
}) => {
  // If weatherCode is provided, resolve directly
  if (weatherCode !== undefined) {
    switch (weatherCode) {
      case 0:
        return isDay ? <Sun className={className} /> : <Moon className={className} />;
      case 1:
        return isDay ? <SunMedium className={className} /> : <MoonStar className={className} />;
      case 2:
        return isDay ? <CloudSun className={className} /> : <CloudMoon className={className} />;
      case 3:
        return <Cloud className={className} />;
      case 45:
      case 48:
        return <CloudFog className={className} />;
      case 51:
      case 53:
      case 55:
        return <CloudDrizzle className={className} />;
      case 61:
      case 63:
      case 80:
      case 81:
        return <CloudRain className={className} />;
      case 65:
      case 82:
        return <CloudRainWind className={className} />;
      case 56:
      case 57:
      case 66:
      case 67:
      case 71:
      case 73:
      case 75:
      case 77:
      case 85:
      case 86:
        return <Snowflake className={className} />;
      case 95:
      case 96:
      case 99:
        return <CloudLightning className={className} />;
      default:
        return <Cloud className={className} />;
    }
  }

  // Fallback map based on iconName string
  switch (iconName) {
    case 'Sun':
      return <Sun className={className} />;
    case 'Moon':
      return <Moon className={className} />;
    case 'SunMedium':
      return <SunMedium className={className} />;
    case 'MoonStar':
      return <MoonStar className={className} />;
    case 'CloudSun':
      return <CloudSun className={className} />;
    case 'Cloud':
      return <Cloud className={className} />;
    case 'CloudRain':
      return <CloudRain className={className} />;
    case 'CloudRainWind':
      return <CloudRainWind className={className} />;
    case 'CloudDrizzle':
      return <CloudDrizzle className={className} />;
    case 'CloudFog':
      return <CloudFog className={className} />;
    case 'CloudSnow':
    case 'Snowflake':
      return <Snowflake className={className} />;
    case 'CloudLightning':
    case 'Zap':
      return <CloudLightning className={className} />;
    default:
      return <Cloud className={className} />;
  }
};
