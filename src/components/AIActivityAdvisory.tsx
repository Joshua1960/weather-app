import React, { useState } from 'react';
import { AIAdvisoryResponse, ActivityAdvisoryItem, CurrentWeather } from '../types/weather';

interface AIActivityAdvisoryProps {
  current?: CurrentWeather | null;
  advisory: AIAdvisoryResponse | null;
  isLoading: boolean;
  onRefresh: (customAct?: string) => void;
  locationName: string;
  isBright?: boolean;
}

export const AIActivityAdvisory: React.FC<AIActivityAdvisoryProps> = ({
  current,
  advisory,
  isLoading,
  onRefresh,
  locationName: _locationName,
  isBright = false,
}) => {
  const [customInput, setCustomInput] = useState<string>('');
  const [searchedActivityName, setSearchedActivityName] = useState<string | null>(null);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const query = customInput.trim();
    setSearchedActivityName(query);
    onRefresh(query);
    setCustomInput('');
  };

  const getRatingStyle = (rating: ActivityAdvisoryItem['rating']) => {
    switch (rating) {
      case 'Optimal':
        return isBright
          ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Good':
        return isBright
          ? 'text-teal-800 bg-teal-100 border-teal-300'
          : 'text-teal-400 bg-teal-500/10 border-teal-500/30';
      case 'Fair':
        return isBright
          ? 'text-blue-800 bg-blue-100 border-blue-300'
          : 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Caution':
        return isBright
          ? 'text-amber-800 bg-amber-100 border-amber-300'
          : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Avoid':
        return isBright
          ? 'text-rose-800 bg-rose-100 border-rose-300'
          : 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return isBright
          ? 'text-neutral-800 bg-neutral-100 border-neutral-300'
          : 'text-neutral-300 bg-neutral-800 border-neutral-700';
    }
  };

  const temp = current?.temperature ?? 20;
  const humidity = current?.humidity ?? 50;
  const isRain = (current?.precipitation ?? 0) > 0 || (current?.weatherCode ?? 0) >= 51;
  const isHumidWarm = temp >= 24 && humidity >= 50;

  // Simple weather meaning (merged into one cohesive flow)
  const weatherMeaning = advisory?.weatherMeaning || (
    isRain
      ? `Rain is falling at ${temp}°C, though wet surfaces and persistent moisture require careful steps outdoors.`
      : isHumidWarm
      ? `The weather is clear and warm, though the high humidity will make it feel significantly hotter than the actual temperature.`
      : temp >= 28
      ? `It feels hot and sunny at ${temp}°C, with strong daylight and warm air.`
      : temp <= 14
      ? `The weather is cool and breezy at ${temp}°C with crisp ambient air.`
      : current?.weatherCode === 2 || current?.weatherCode === 3
      ? `It is cloudy and calm at ${temp}°C with soft diffused daylight and comfortable temperatures.`
      : `The weather is pleasant and temperate at ${temp}°C with clear skies and a gentle breeze.`
  );

  // Simple wear recommendation
  const wearRecommendation = advisory?.clothingRecommendation || (
    isRain
      ? `Wear a waterproof jacket or carry an umbrella, with water-resistant footwear.`
      : isHumidWarm || temp >= 24
      ? `Wear light, breathable cotton clothing and comfortable sandals to stay cool throughout the day.`
      : temp >= 16
      ? `Wear comfortable everyday clothes like a T-shirt paired with a light jacket or knitwear.`
      : `Wear warm layers, an insulated jacket, and long trousers.`
  );

  // Simple food recommendation
  const foodRecommendation = advisory?.foodRecommendation || (
    isRain
      ? `Enjoy hot vegetable soup, spiced tea, or warm coffee to stay cozy.`
      : isHumidWarm || temp >= 24
      ? `Stay hydrated with plenty of water and enjoy refreshing fruits like watermelon or chilled coconut water.`
      : `Warm nourishing meals, fresh tea, and hearty soups are ideal today.`
  );

  const activeCustomActivity = searchedActivityName && advisory?.advisories && advisory.advisories.length > 0
    ? advisory.advisories[0]
    : null;

  return (
    <section
      className={`rounded-xl border p-5 sm:p-6 transition-colors flex flex-col justify-between h-full ${
        isBright
          ? 'border-neutral-300/80 bg-white/75 shadow-xs text-neutral-900'
          : 'border-neutral-800/80 bg-neutral-900/30 text-neutral-100'
      }`}
    >
      {/* Card Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${
          isBright ? 'border-neutral-200' : 'border-neutral-800/60'
        }`}
      >
        <h2
          className={`font-mono text-xs font-bold tracking-wider uppercase ${
            isBright ? 'text-neutral-800' : 'text-neutral-200'
          }`}
        >
          Daily Living Advice
        </h2>

        <button
          onClick={() => onRefresh(searchedActivityName || undefined)}
          disabled={isLoading}
          className={`font-mono text-xs transition-colors disabled:opacity-50 cursor-pointer ${
            isBright
              ? 'text-neutral-600 hover:text-neutral-950 font-medium'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Recalibrate advice"
        >
          <span>{isLoading ? 'Updating...' : 'Refresh Advice'}</span>
        </button>
      </div>

      {/* Merged Single Living Advisory Card */}
      <div
        className={`rounded-lg border p-4 sm:p-4.5 transition-colors my-auto space-y-3.5 ${
          isBright
            ? 'border-neutral-200/90 bg-white/85 shadow-xs'
            : 'border-neutral-800/80 bg-neutral-900/40'
        }`}
      >
        {/* Current Weather Meaning */}
        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            What Today Feels Like
          </h3>
          <p className={`mt-1 text-xs sm:text-sm leading-relaxed ${isBright ? 'text-neutral-800' : 'text-neutral-200'}`}>
            {weatherMeaning}
          </p>
        </div>

        {/* Recommended Wear */}
        <div className="border-t pt-3 border-dashed border-neutral-200 dark:border-neutral-800/80">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            What to Wear Today
          </h3>
          <p className={`mt-1 text-xs sm:text-sm leading-relaxed ${isBright ? 'text-neutral-800' : 'text-neutral-200'}`}>
            {wearRecommendation}
          </p>
        </div>

        {/* Food & Refreshment */}
        <div className="border-t pt-3 border-dashed border-neutral-200 dark:border-neutral-800/80">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Good Drinks & Meals for Today
          </h3>
          <p className={`mt-1 text-xs sm:text-sm leading-relaxed ${isBright ? 'text-neutral-800' : 'text-neutral-200'}`}>
            {foodRecommendation}
          </p>
        </div>
      </div>

      {/* Custom Activity Inline Form */}
      <div>
        {activeCustomActivity && (
          <div
            className={`mb-2.5 rounded-lg border p-3 font-mono text-xs transition-colors ${
              isBright ? 'border-neutral-200/90 bg-white/90' : 'border-neutral-800/70 bg-neutral-900/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`font-bold text-xs ${isBright ? 'text-neutral-950' : 'text-white'}`}>
                {activeCustomActivity.name}
              </span>
              <div className="flex items-center gap-2">
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${getRatingStyle(activeCustomActivity.rating)}`}>
                  {activeCustomActivity.rating} ({activeCustomActivity.score}%)
                </span>
                <button
                  onClick={() => setSearchedActivityName(null)}
                  className={`text-[10px] px-1 hover:text-rose-500 cursor-pointer ${isBright ? 'text-neutral-400' : 'text-neutral-500'}`}
                >
                  ✕
                </button>
              </div>
            </div>
            <p className={`mt-1 font-sans text-xs ${isBright ? 'text-neutral-700' : 'text-neutral-300'}`}>
              {activeCustomActivity.verdict}
            </p>
          </div>
        )}

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Check a plan (e.g. 'drying laundry', 'football match', 'morning walk')..."
            className={`flex-1 rounded-lg border py-2 px-3.5 font-mono text-xs focus:outline-none transition-colors ${
              isBright
                ? 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-700'
                : 'border-neutral-800 bg-neutral-950 text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-600'
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !customInput.trim()}
            className={`rounded-lg px-4 py-2 font-mono text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer ${
              isBright
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-950 hover:bg-neutral-300'
            }`}
          >
            Check Plan
          </button>
        </form>
      </div>
    </section>
  );
};
