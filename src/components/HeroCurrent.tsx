import React from 'react';
import { MapPin } from 'lucide-react';
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
} from '../utils/weatherUtils';
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
  const feelsLikeFormatted = formatTemperature(current.apparentTemperature, userPreferences.tempUnit);
  const maxTempFormatted = todayDaily ? formatTemperature(todayDaily.temperatureMax, userPreferences.tempUnit) : '--';
  const minTempFormatted = todayDaily ? formatTemperature(todayDaily.temperatureMin, userPreferences.tempUnit) : '--';
  const windFormatted = formatWindSpeed(current.windSpeed, userPreferences.windUnit);
  const windDir = getWindDirectionLabel(current.windDirection);

  return (
    <section className="py-2 sm:py-4">
      {/* Massive Swiss Typography Temperature & Right Beside: Very Niched Location & Conditions */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-7">
        {/* Temperature */}
        <div
          className={`flex items-baseline font-mono font-light tracking-tighter text-7xl sm:text-8xl md:text-9xl shrink-0 transition-colors ${
            isBright ? 'text-neutral-950' : 'text-white'
          }`}
        >
          <span>{tempFormatted}</span>
          <span
            className={`font-extralight text-5xl sm:text-7xl ${
              isBright ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            °
          </span>
        </div>

        {/* Right Beside Temperature: Very Niched Location & Met Info */}
        <div className="flex flex-col gap-1.5 pb-1">
          {/* Location Badge (MapPin icon) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <MapPin
              className={`h-4 w-4 shrink-0 ${
                isBright ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            />
            <h1
              className={`font-sans font-bold text-lg sm:text-2xl tracking-tight transition-colors ${
                isBright ? 'text-neutral-900' : 'text-white'
              }`}
            >
              {location.name}
            </h1>
            {location.country && (
              <span
                className={`font-mono text-xs sm:text-sm font-normal ${
                  isBright ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                / {[location.admin1, location.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>

          {/* Condition Text & Weather Glyph (Weather icon) */}
          <div className="flex items-center gap-2">
            <WeatherIcon
              weatherCode={current.weatherCode}
              isDay={current.isDay}
              className={`h-5 w-5 ${isBright ? 'text-neutral-800' : 'text-neutral-200'}`}
            />
            <span
              className={`font-sans text-base sm:text-lg font-medium transition-colors ${
                isBright ? 'text-neutral-800' : 'text-neutral-200'
              }`}
            >
              {current.conditionText}
            </span>
          </div>

          {/* Thermals Range */}
          <div
            className={`font-mono text-xs ${
              isBright ? 'text-neutral-600' : 'text-neutral-400'
            }`}
          >
            Feels like {feelsLikeFormatted} · H: {maxTempFormatted} / L: {minTempFormatted}
          </div>
        </div>
      </div>

      {/* Hairline Environmental Telemetry Strip */}
      <div
        className={`mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3 font-mono text-xs transition-colors ${
          isBright
            ? 'border-neutral-300/80 text-neutral-600'
            : 'border-neutral-800/80 text-neutral-400'
        }`}
      >
        <div>
          <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>WIND:</span>{' '}
          <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
            {windFormatted} {windDir}
          </span>
        </div>
        <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
          |
        </div>
        <div>
          <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>HUMIDITY:</span>{' '}
          <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
            {current.humidity}%
          </span>
        </div>
        <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
          |
        </div>
        <div>
          <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>UV:</span>{' '}
          <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
            {current.uvIndex} ({current.uvIndex <= 2 ? 'Low' : current.uvIndex <= 5 ? 'Mod' : 'High'})
          </span>
        </div>
        <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
          |
        </div>
        <div>
          <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>AIR QUALITY:</span>{' '}
          <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
            {airQuality.usAqi} AQI ({airQuality.statusText})
          </span>
        </div>
        <div className={`hidden sm:inline ${isBright ? 'text-neutral-300' : 'text-neutral-700'}`}>
          |
        </div>
        <div>
          <span className={isBright ? 'text-neutral-500' : 'text-neutral-500'}>PRESSURE:</span>{' '}
          <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
            {current.surfacePressure} hPa
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
                {todayDaily.sunset}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
