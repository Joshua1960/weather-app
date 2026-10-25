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

  // Generate real-time advisory & recommendation based on current climate telemetry
  const temp = current?.temperature ?? 20;
  const condition = current?.conditionText || 'Clear';
  const humidity = current?.humidity ?? 50;
  const wind = current?.windSpeed ?? 10;
  const uv = current?.uvIndex ?? 2;
  const isRain = (current?.precipitation ?? 0) > 0 || (current?.weatherCode ?? 0) >= 51;

  let advisoryHeadline = 'Optimal Outdoor Comfort';
  let advisoryBadgeColor = isBright
    ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let advisoryText = `Atmospheric baseline is mild at ${temp}°C with ${humidity}% humidity and light wind (${wind} km/h). Low precipitation risk offers an ideal window for sports, walks, and outdoor routines.`;
  let recommendedActivities = 'Running, cycling, outdoor tennis, walking, and park activities.';
  let recommendedAttire = advisory?.clothingRecommendation || (temp >= 24
    ? 'Lightweight breathable attire, sunglasses, and sun protection.'
    : temp >= 16
    ? 'Comfortable activewear, breathable mid-layer, and light trainers.'
    : 'Layered clothing with a wind-resistant shell and insulated top.');
  let optimalWindow = '07:00 – 10:30 & 16:00 – 19:00';

  if (isRain) {
    advisoryHeadline = 'Precipitation & Wet Surfaces';
    advisoryBadgeColor = isBright
      ? 'text-amber-800 bg-amber-100 border-amber-300'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    advisoryText = `Damp weather with active precipitation (${current?.precipitation || 0.4} mm/h) and ${humidity}% humidity. Traction is reduced on pavements; outdoor endurance workouts may cause rapid chilling.`;
    recommendedActivities = 'Indoor gym training, swimming, yoga, and indoor cultural visits.';
    recommendedAttire = 'Waterproof shell, water-resistant footwear, and umbrella.';
    optimalWindow = 'Postpone prolonged outdoor activities until precipitation clears.';
  } else if (temp >= 28) {
    advisoryHeadline = 'Warm Thermals & Sun Exposure';
    advisoryBadgeColor = isBright
      ? 'text-amber-800 bg-amber-100 border-amber-300'
      : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    advisoryText = `Elevated thermal baseline at ${temp}°C (feels like ${current?.apparentTemperature ?? temp}°C) with UV index of ${uv}. Direct sunlight causes increased cardiovascular load and moisture depletion.`;
    recommendedActivities = 'Early morning jogs, water sports, indoor training, and shaded leisure.';
    recommendedAttire = 'Featherweight moisture-wicking fabrics, cap, sunglasses, and SPF 30+.';
    optimalWindow = 'Early morning (06:30 – 08:30) or after sunset when heat dissipates.';
  } else if (temp <= 12) {
    advisoryHeadline = 'Brisk & Cool Climate';
    advisoryBadgeColor = isBright
      ? 'text-blue-800 bg-blue-100 border-blue-300'
      : 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    advisoryText = `Chilly ambient conditions at ${temp}°C with ${wind} km/h breezes. Sustained low temperatures require warm-ups to prevent muscle strain.`;
    recommendedActivities = 'Brisk walking, road running with thermal layers, and indoor court sports.';
    recommendedAttire = 'Thermal base-layer, windbreaker, fleece, and light gloves if cycling.';
    optimalWindow = '11:00 – 15:30 during peak solar warming.';
  } else if (current?.weatherCode === 2 || current?.weatherCode === 3) {
    advisoryHeadline = 'Cloudy & Stable Air';
    advisoryBadgeColor = isBright
      ? 'text-neutral-800 bg-neutral-200 border-neutral-300'
      : 'text-neutral-300 bg-neutral-800 border-neutral-700';
    advisoryText = `Cloud cover with diffused sunlight and stable barometric pressure (${current?.surfacePressure ?? 1013} hPa). Excellent visual comfort for distance running and cycling without solar glare.`;
    recommendedActivities = 'Long-distance running, road cycling, hiking, and outdoor photography.';
    optimalWindow = '08:00 – 17:00 throughout daylight hours.';
  }

  // If Gemini provided a personalized summary, integrate it into the advisory
  if (advisory?.overallSummary) {
    advisoryText = advisory.overallSummary;
  }
  if (advisory?.clothingRecommendation) {
    recommendedAttire = advisory.clothingRecommendation;
  }

  // Only display a custom card if user searched one
  const activeCustomActivity = searchedActivityName && advisory?.advisories && advisory.advisories.length > 0
    ? advisory.advisories[0]
    : null;

  return (
    <section
      className={`rounded-sm border p-4 sm:p-5 transition-colors ${
        isBright
          ? 'border-neutral-300/80 bg-white/75 shadow-xs text-neutral-900'
          : 'border-neutral-800/80 bg-neutral-900/30 text-neutral-100'
      }`}
    >
      {/* Section Title */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
          isBright ? 'border-neutral-200' : 'border-neutral-800/60'
        }`}
      >
        <h2
          className={`font-mono text-xs font-bold tracking-wider uppercase ${
            isBright ? 'text-neutral-800' : 'text-neutral-200'
          }`}
        >
          AI Activity Advisory
        </h2>

        <button
          onClick={() => onRefresh(searchedActivityName || undefined)}
          disabled={isLoading}
          className={`font-mono text-xs transition-colors disabled:opacity-50 ${
            isBright
              ? 'text-neutral-600 hover:text-neutral-950 font-medium'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Recalibrate AI analysis"
        >
          <span>{isLoading ? 'Recalibrating...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Weather Advisory Card */}
      <div
        className={`mt-3.5 rounded-sm border p-3.5 transition-colors ${
          isBright
            ? 'border-neutral-200/90 bg-white/90 shadow-xs'
            : 'border-neutral-800/70 bg-neutral-900/50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`font-bold text-sm tracking-tight ${
              isBright ? 'text-neutral-950' : 'text-white'
            }`}
          >
            Advisory: {condition} ({temp}°)
          </span>
          <span className={`rounded border px-2 py-0.5 text-[11px] font-bold ${advisoryBadgeColor}`}>
            {advisoryHeadline}
          </span>
        </div>

        <p
          className={`mt-2 text-xs leading-relaxed ${
            isBright ? 'text-neutral-700' : 'text-neutral-300'
          }`}
        >
          {advisoryText}
        </p>

        <div
          className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-[11px] ${
            isBright
              ? 'border-neutral-200 text-neutral-500'
              : 'border-neutral-800/60 text-neutral-400'
          }`}
        >
          <span>SUITABLE WINDOW</span>
          <span className={`font-semibold ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
            {optimalWindow}
          </span>
        </div>
      </div>

      {/* Weather Recommendation Box */}
      <div
        className={`mt-3 space-y-2 rounded-sm border p-3.5 text-xs transition-colors ${
          isBright
            ? 'border-neutral-200 bg-white/80 text-neutral-800'
            : 'border-neutral-800/60 bg-neutral-900/40 text-neutral-200'
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`font-semibold shrink-0 uppercase tracking-wider text-[11px] ${
              isBright ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            Recommended:
          </span>
          <span className="leading-relaxed">
            {recommendedAttire}
          </span>
        </div>

        <div className="flex items-start gap-2 pt-1 border-t border-dashed border-neutral-200 dark:border-neutral-800">
          <span
            className={`font-semibold shrink-0 uppercase tracking-wider text-[11px] ${
              isBright ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            Suggested:
          </span>
          <span className="leading-relaxed">
            {recommendedActivities}
          </span>
        </div>
      </div>

      {/* Searched Custom Activity Result (if queried) */}
      {activeCustomActivity && (
        <div
          className={`mt-3.5 rounded-sm border p-3.5 font-mono text-xs transition-colors ${
            isBright
              ? 'border-neutral-200/90 bg-white/90 shadow-xs'
              : 'border-neutral-800/70 bg-neutral-900/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`font-bold text-sm tracking-tight ${
                isBright ? 'text-neutral-950' : 'text-white'
              }`}
            >
              {activeCustomActivity.name}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`rounded border px-2 py-0.5 text-[11px] font-bold ${getRatingStyle(
                  activeCustomActivity.rating
                )}`}
              >
                {activeCustomActivity.rating.toUpperCase()} · {activeCustomActivity.score}% VIABILITY
              </span>
              <button
                onClick={() => setSearchedActivityName(null)}
                className={`text-[10px] px-1 hover:text-rose-500 ${isBright ? 'text-neutral-400' : 'text-neutral-500'}`}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>

          <p
            className={`mt-2 font-sans text-xs leading-relaxed ${
              isBright ? 'text-neutral-700' : 'text-neutral-200'
            }`}
          >
            {activeCustomActivity.verdict}
          </p>

          <div
            className={`mt-3 flex items-center justify-between border-t pt-2 text-[11px] ${
              isBright
                ? 'border-neutral-200 text-neutral-500'
                : 'border-neutral-800/60 text-neutral-500'
            }`}
          >
            <span>OPTIMAL WINDOW</span>
            <span className={`font-medium ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
              {activeCustomActivity.bestTimeWindow}
            </span>
          </div>
        </div>
      )}

      {/* Custom Activity Inline Form */}
      <form onSubmit={handleCustomSubmit} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Analyze a specific activity (e.g. 'Tennis', 'Cycling', 'Hiking')..."
          className={`flex-1 rounded-sm border py-1.5 px-3 font-mono text-xs focus:outline-none transition-colors ${
            isBright
              ? 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500 focus:border-neutral-700'
              : 'border-neutral-800 bg-neutral-950 text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-600'
          }`}
        />
        <button
          type="submit"
          disabled={isLoading || !customInput.trim()}
          className={`rounded-sm px-3.5 py-1.5 font-mono text-xs font-bold transition-colors disabled:opacity-40 ${
            isBright
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-neutral-100 text-neutral-950 hover:bg-neutral-300'
          }`}
        >
          <span>Analyze</span>
        </button>
      </form>
    </section>
  );
};
