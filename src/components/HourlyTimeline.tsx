import React, { useState, useRef } from 'react';
import { HourlyForecastItem, UserPreferences } from '../types/weather';
import { formatTemperature } from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';

interface HourlyTimelineProps {
  hourly: HourlyForecastItem[];
  userPreferences: UserPreferences;
  isBright?: boolean;
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({
  hourly,
  userPreferences,
  isBright = false,
}) => {
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  if (!hourly || hourly.length === 0) return null;

  const temps = hourly.map((h) => h.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = Math.max(maxTemp - minTemp, 1);
  const activeHour = hourly[selectedHourIdx] || hourly[0];

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
        <div className="flex items-center gap-3">
          <h2
            className={`font-mono text-xs font-bold tracking-wider uppercase ${
              isBright ? 'text-neutral-800' : 'text-neutral-200'
            }`}
          >
            Hourly Forecast (Next 24 Hours)
          </h2>
        </div>

        <div className={`font-mono text-xs ${isBright ? 'text-neutral-600' : 'text-neutral-400'}`}>
          <span>
            {selectedHourIdx === 0 ? 'Right now' : activeHour.timeFormatted}:{' '}
            <strong className={isBright ? 'text-neutral-950 font-bold' : 'text-white'}>
              {formatTemperature(activeHour.temperature, userPreferences.tempUnit)}
            </strong>{' '}
            · {activeHour.conditionText} (Chance of rain: {activeHour.precipitationProbability}%)
          </span>
        </div>
      </div>

      <div className="relative mt-3">
        {/* Exactly 8 hours visible on desktop with the rest in overflow */}
        <div
          ref={timelineRef}
          className="flex items-end gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scroll-smooth"
        >
          {hourly.map((item, idx) => {
            const isSelected = idx === selectedHourIdx;
            const isNow = idx === 0;
            const normalizedHeight = Math.round(((item.temperature - minTemp) / tempRange) * 28) + 10;

            return (
              <button
                key={item.time}
                onClick={() => setSelectedHourIdx(idx)}
                className={`group flex flex-col items-center shrink-0 w-[calc((100%-1.5rem)/4)] sm:w-[calc((100%-2.5rem)/6)] md:w-[calc((100%-3.5rem)/8)] rounded-sm p-1.5 font-mono transition-all ${
                  isSelected
                    ? isBright
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-neutral-800 text-white'
                    : isBright
                    ? 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
                }`}
              >
                <span
                  className={`text-[10px] ${
                    isNow
                      ? isBright
                        ? isSelected ? 'text-emerald-300 font-bold' : 'text-emerald-600 font-bold'
                        : 'text-emerald-400 font-bold'
                      : ''
                  }`}
                >
                  {isNow ? 'NOW' : item.timeFormatted}
                </span>

                <div className="my-1.5 flex h-5 w-5 items-center justify-center">
                  <WeatherIcon
                    weatherCode={item.weatherCode}
                    isDay={item.isDay}
                    className={`h-3.5 w-3.5 ${
                      isSelected
                        ? 'text-white'
                        : isBright
                        ? 'text-neutral-700'
                        : 'text-neutral-300'
                    }`}
                  />
                </div>

                <span
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-white'
                      : isBright
                      ? 'text-neutral-900'
                      : 'text-neutral-100'
                  }`}
                >
                  {formatTemperature(item.temperature, userPreferences.tempUnit)}
                </span>

                {/* Thermal height bar */}
                <div className="my-1 flex h-10 w-full items-end justify-center">
                  <div
                    style={{ height: `${normalizedHeight}px` }}
                    className={`w-1.5 rounded-t-sm transition-all ${
                      isSelected
                        ? isBright
                          ? 'bg-white'
                          : 'bg-neutral-200'
                        : isBright
                        ? 'bg-neutral-300 group-hover:bg-neutral-400'
                        : 'bg-neutral-700 group-hover:bg-neutral-500'
                    }`}
                  />
                </div>

                {/* Rain Probability */}
                <div className="flex items-center gap-0.5 text-[9px]">
                  {item.precipitationProbability > 0 && (
                    <span
                      className={
                        item.precipitationProbability > 30
                          ? isBright
                            ? isSelected ? 'text-sky-300 font-bold' : 'text-sky-600 font-bold'
                            : 'text-sky-400 font-semibold'
                          : isBright
                          ? isSelected ? 'text-neutral-300' : 'text-neutral-400'
                          : 'text-neutral-500'
                      }
                    >
                      {item.precipitationProbability}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
