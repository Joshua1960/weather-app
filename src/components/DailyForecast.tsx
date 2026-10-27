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
  return (
    <section
      className={`rounded-xl border p-5 sm:p-6 transition-colors ${
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
          7-Day Weather Forecast
        </h2>
        <span className={`text-[11px] font-mono ${isBright ? 'text-neutral-500' : 'text-neutral-400'}`}>
          High & Low Temperatures
        </span>
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
              className={`flex items-center justify-between py-3 px-1.5 transition-colors ${
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
              <div className="flex items-baseline gap-2 min-w-[120px] sm:min-w-[140px]">
                <span
                  className={`font-semibold text-xs sm:text-sm ${
                    isToday
                      ? isBright
                        ? 'text-emerald-700 font-bold'
                        : 'text-emerald-400 font-bold'
                      : isBright
                      ? 'text-neutral-800'
                      : 'text-neutral-200'
                  }`}
                >
                  {isToday ? 'Today' : day.dayName}
                </span>
                <span
                  className={`text-[10px] ${
                    isBright ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  {day.fullDate}
                </span>
              </div>

              {/* Weather Icon and Condition in Plain English */}
              <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start px-2">
                <WeatherIcon
                  weatherCode={day.weatherCode}
                  isDay={true}
                  className={`h-4 w-4 shrink-0 ${
                    isBright ? 'text-neutral-700' : 'text-neutral-300'
                  }`}
                />
                <span className={`text-xs hidden sm:inline ${isBright ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  {day.conditionText}
                </span>
                {day.precipitationProbabilityMax > 20 && (
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 hidden md:inline">
                    ({day.precipitationProbabilityMax}% rain chance)
                  </span>
                )}
              </div>

              {/* High / Low Temperature with clear labels */}
              <div className="text-right shrink-0">
                <span
                  className={`font-bold text-xs sm:text-sm ${
                    isBright ? 'text-neutral-950' : 'text-neutral-100'
                  }`}
                >
                  {formatTemperature(day.temperatureMax, userPreferences.tempUnit)}
                </span>
                <span className={`text-xs ml-1.5 ${isBright ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  / {formatTemperature(day.temperatureMin, userPreferences.tempUnit)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
