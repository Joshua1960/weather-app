import React from 'react';
import { DailyForecastItem, UserPreferences } from '../types/weather';
import { formatTemperature } from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';

interface DailyForecastProps {
  daily: DailyForecastItem[];
  userPreferences: UserPreferences;
  isBright?: boolean;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({
  daily,
  userPreferences,
  isBright = false,
}) => {
  if (!daily || daily.length === 0) return null;

  return (
    <section
      className={`rounded-sm border p-4 sm:p-5 transition-colors ${
        isBright
          ? 'border-neutral-300/80 bg-white/75 shadow-xs text-neutral-900'
          : 'border-neutral-800/80 bg-neutral-900/30 text-neutral-100'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b pb-2.5 ${
          isBright ? 'border-neutral-200' : 'border-neutral-800/60'
        }`}
      >
        <h2
          className={`font-mono text-xs font-bold tracking-wider uppercase ${
            isBright ? 'text-neutral-800' : 'text-neutral-200'
          }`}
        >
          7-Day Synoptic Outlook
        </h2>
      </div>

      <div
        className={`divide-y font-mono text-xs ${
          isBright ? 'divide-neutral-200/80' : 'divide-neutral-800/40'
        }`}
      >
        {daily.map((day, idx) => {
          const isToday = idx === 0;

          return (
            <div
              key={day.date}
              className={`flex items-center justify-between py-2.5 px-1.5 transition-colors ${
                isBright
                  ? isToday
                    ? 'text-neutral-950 font-medium hover:bg-neutral-100/60'
                    : 'text-neutral-700 hover:bg-neutral-100/60'
                  : isToday
                  ? 'text-white hover:bg-neutral-800/30'
                  : 'text-neutral-300 hover:bg-neutral-800/30'
              }`}
            >
              {/* Day Name and Date */}
              <div className="flex items-baseline gap-2 min-w-[120px]">
                <span
                  className={`font-semibold ${
                    isToday
                      ? isBright
                        ? 'text-emerald-700'
                        : 'text-emerald-400'
                      : isBright
                      ? 'text-neutral-800'
                      : 'text-neutral-200'
                  }`}
                >
                  {day.dayName}
                </span>
                <span
                  className={`text-[10px] ${
                    isBright ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {day.fullDate}
                </span>
              </div>

              {/* Weather Glyph Icon only */}
              <div className="flex items-center justify-center">
                <WeatherIcon
                  weatherCode={day.weatherCode}
                  isDay={true}
                  className={`h-4 w-4 shrink-0 ${
                    isBright ? 'text-neutral-700' : 'text-neutral-300'
                  }`}
                />
              </div>

              {/* Single Temperature per day */}
              <div className="w-16 text-right">
                <span
                  className={`font-bold text-sm ${
                    isBright ? 'text-neutral-950' : 'text-neutral-100'
                  }`}
                >
                  {formatTemperature(day.temperatureMax, userPreferences.tempUnit)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
