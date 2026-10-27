import React from 'react';
import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  LocationItem,
  UserPreferences,
} from '../types/weather';
import {
  formatTemperature,
  formatWindSpeed,
  getWindDirectionLabel,
  getActualWeatherImage,
} from '../utils/weatherUtils';
import { MapPin } from 'lucide-react';
import { WeatherIcon } from './WeatherIcon';

interface HeroCurrentProps {
  location: LocationItem;
  current: CurrentWeather;
  todayDaily?: DailyForecastItem;
  airQuality: AirQualityData;
  userPreferences: UserPreferences;
  isBright?: boolean;
}

export const HeroCurrent: React.FC<HeroCurrentProps> = ({
  location,
  current,
  todayDaily,
  airQuality,
  userPreferences,
  isBright = false,
}) => {
  const tempFormatted = formatTemperature(current.temperature, userPreferences.tempUnit, false);
  const feelsLikeFormatted = formatTemperature(current.apparentTemperature, userPreferences.tempUnit, true);
  const windFormatted = formatWindSpeed(current.windSpeed, userPreferences.windUnit);
  const windDir = getWindDirectionLabel(current.windDirection);
  const actualWeatherImage = getActualWeatherImage(current.weatherCode, current.isDay);

  // Layman descriptions
  const getWindDescription = (speed: number) => {
    if (speed < 6) return 'Calm';
    if (speed < 15) return 'Gentle breeze';
    if (speed < 28) return 'Moderate breeze';
    return 'Strong wind';
  };

  const getHumidityDescription = (hum: number) => {
    if (hum >= 75) return 'Humid & sticky';
    if (hum <= 40) return 'Dry air';
    return 'Comfortable';
  };

  const getUvDescription = (uv: number) => {
    if (uv <= 2) return 'Low (no burn risk)';
    if (uv <= 5) return 'Moderate (mild sun)';
    if (uv <= 7) return 'High (wear hat/shade)';
    return 'Very high (use sunscreen)';
  };

  const getAirQualityDescription = (aqi: number) => {
    if (aqi <= 50) return 'Good (clean fresh air)';
    if (aqi <= 100) return 'Moderate (fine for most)';
    return 'Unhealthy (sensitive groups take care)';
  };

  const getPressureDescription = (pressure: number) => {
    if (pressure >= 1013) return 'Stable & calm';
    return 'Rain/clouds likely';
  };

  return (
    <section
      className={`relative overflow-hidden rounded-xl border p-5 sm:p-6 transition-colors flex flex-col justify-center h-full min-h-[220px] ${
        isBright
          ? 'border-neutral-300/80 bg-white/85 shadow-xs text-neutral-900'
          : 'border-neutral-800/80 bg-neutral-950/85 text-neutral-100'
      }`}
    >
      {/* Actual photographic image of the sky/weather condition on the right side */}
      <div className="absolute top-0 right-0 bottom-0 w-1/2 sm:w-7/12 pointer-events-none select-none overflow-hidden">
        <img
          src={actualWeatherImage.url}
          alt={actualWeatherImage.alt}
          className="h-full w-full object-cover object-center transform scale-105 transition-all duration-700 brightness-95"
          loading="eager"
        />
        {/* Seamless directional gradient blend into card text area */}
        <div
          className={`absolute inset-0 ${
            isBright
              ? 'bg-gradient-to-r from-white via-white/70 via-35% to-transparent'
              : 'bg-gradient-to-r from-neutral-950 via-neutral-950/75 via-35% to-transparent'
          }`}
        />
        {/* Soft edge shading */}
        <div
          className={`absolute inset-0 ${
            isBright
              ? 'bg-gradient-to-t from-white/50 via-transparent to-white/30'
              : 'bg-gradient-to-t from-neutral-950/70 via-transparent to-neutral-950/50'
          }`}
        />
      </div>

      <div className="relative z-10 my-auto space-y-4 sm:space-y-5">
        {/* Main Temperature & Location Info */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {/* Temperature */}
          <div
            className={`flex items-baseline font-mono font-light tracking-tighter text-6xl sm:text-7xl lg:text-7xl shrink-0 transition-colors ${
              isBright ? 'text-neutral-950' : 'text-white'
            }`}
          >
            <span>{tempFormatted}</span>
            <span
              className={`font-extralight text-4xl sm:text-5xl ${
                isBright ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            >
              °
            </span>
          </div>

          {/* Right Beside Temperature: Location, Condition, Feels Like */}
          <div className="flex flex-col gap-1 pb-1">
            {/* Location Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <MapPin
                className={`h-4 w-4 shrink-0 ${
                  isBright ? 'text-emerald-600' : 'text-emerald-400'
                }`}
              />
              <h1
                className={`font-sans font-bold text-base sm:text-xl tracking-tight transition-colors ${
                  isBright ? 'text-neutral-900' : 'text-white'
                }`}
              >
                {location.name}
              </h1>
              {location.country && (
                <span
                  className={`font-mono text-xs font-normal ${
                    isBright ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  / {[location.admin1, location.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {/* Condition Text & Feels Like In Plain English */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <WeatherIcon
                  weatherCode={current.weatherCode}
                  isDay={current.isDay}
                  className={`h-4 w-4 ${isBright ? 'text-neutral-800' : 'text-neutral-200'}`}
                />
                <span
                  className={`font-sans text-sm sm:text-base font-medium transition-colors ${
                    isBright ? 'text-neutral-800' : 'text-neutral-200'
                  }`}
                >
                  {current.conditionText}
                </span>
              </div>

              <span className="text-neutral-400">·</span>

              <span className={`font-sans text-xs sm:text-sm ${isBright ? 'text-neutral-600' : 'text-neutral-300'}`}>
                Feels like <strong className={isBright ? 'text-neutral-900' : 'text-white'}>{feelsLikeFormatted}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Layman-Friendly Weather Details Strip */}
        <div
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3.5 font-mono text-[11px] sm:text-xs transition-colors ${
            isBright
              ? 'border-neutral-200 text-neutral-600'
              : 'border-neutral-800/80 text-neutral-400'
          }`}
        >
          <div>
            <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>WIND:</span>{' '}
            <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
              {windFormatted} ({getWindDescription(current.windSpeed)} from {windDir})
            </span>
          </div>
          <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
            |
          </div>
          <div>
            <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>HUMIDITY:</span>{' '}
            <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
              {current.humidity}% ({getHumidityDescription(current.humidity)})
            </span>
          </div>
          <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
            |
          </div>
          <div>
            <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>SUN INTENSITY (UV):</span>{' '}
            <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
              {current.uvIndex} · {getUvDescription(current.uvIndex)}
            </span>
          </div>
          <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
            |
          </div>
          <div>
            <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>AIR CLEANLINESS:</span>{' '}
            <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
              {getAirQualityDescription(airQuality.usAqi)}
            </span>
          </div>
          <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
            |
          </div>
          <div>
            <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>ATMOSPHERE:</span>{' '}
            <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
              {current.surfacePressure} hPa ({getPressureDescription(current.surfacePressure)})
            </span>
          </div>
          {todayDaily?.sunset && (
            <>
              <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
                |
              </div>
              <div>
                <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>SUNSET:</span>{' '}
                <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
                  {todayDaily.sunset} (Dusk)
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
