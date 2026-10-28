import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import {
  ChatMessage,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationItem,
} from '../types/weather';
import { sendChatMessage } from '../services/weatherService';
import { generateOfflineChatReply } from '../utils/aiFallback';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationItem;
  current: CurrentWeather;
  todayDaily?: DailyForecastItem;
  upcomingHours?: HourlyForecastItem[];
  forecastDays?: DailyForecastItem[];
  hourlySummary?: string;
  isBright?: boolean;
}

const QUICK_PROMPTS = [
  'What should I wear today?',
  'Best time for a run?',
  'Will it rain this evening?',
  'Compare today vs tomorrow',
  'Outdoor dining viability?',
  'How is the air quality?',
];

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onClose,
  location,
  current,
  todayDaily,
  upcomingHours,
  forecastDays,
  hourlySummary: _hourlySummary,
  isBright = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Hello. I am GCI Meteo. Ask me about weather conditions, daily planning, or any questions you have. How can I assist you?',
      timestamp: 'Now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Click outside and Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const weatherContext = {
    city: location.name,
    country: location.country,
    admin1: location.admin1,
    localTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
    current: {
      temperature: current.temperature,
      apparentTemperature: current.apparentTemperature,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      precipitation: current.precipitation,
      uvIndex: current.uvIndex,
      surfacePressure: current.surfacePressure,
      cloudCover: current.cloudCover,
      conditionText: current.conditionText,
      dayNightStatus: current.isDay ? 'Daytime' : 'Nighttime',
      temperatureFormatted: `${current.temperature}°C`,
      apparentTemperatureFormatted: `${current.apparentTemperature}°C`,
      humidityFormatted: `${current.humidity}%`,
      windSpeedFormatted: `${current.windSpeed} km/h`,
      surfacePressureFormatted: `${current.surfacePressure} hPa`,
    },
    today: todayDaily ? {
      maxTemp: todayDaily.temperatureMax,
      minTemp: todayDaily.temperatureMin,
      precipitationProbability: todayDaily.precipitationProbabilityMax,
      maxTempFormatted: `${todayDaily.temperatureMax}°C`,
      minTempFormatted: `${todayDaily.temperatureMin}°C`,
      precipitationProbabilityFormatted: `${todayDaily.precipitationProbabilityMax}%`,
      sunrise: todayDaily.sunrise,
      sunset: todayDaily.sunset,
      uvIndexMax: todayDaily.uvIndexMax,
    } : undefined,
    upcomingHours: upcomingHours?.slice(0, 8).map((h) => ({
      time: h.time,
      temp: `${h.temperature}°C`,
      temperature: h.temperature,
      condition: h.conditionText,
      rainChance: `${h.precipitationProbability}%`,
      precipitationProbability: h.precipitationProbability,
    })),
    tomorrow: forecastDays?.[1] ? {
      maxTemp: `${forecastDays[1].temperatureMax}°C`,
      minTemp: `${forecastDays[1].temperatureMin}°C`,
      condition: forecastDays[1].conditionText,
      rainChance: `${forecastDays[1].precipitationProbabilityMax}%`,
    } : undefined,
  };

  const handleSend = async (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const replyText = await sendChatMessage(newHistory, weatherContext);
      const modelMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.warn('Chat request fallback:', err);
      const fallbackReply = generateOfflineChatReply(userText, weatherContext);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        content: 'Hello. I am GCI Meteo. Ask me about weather conditions, daily planning, or any questions you have. How can I assist you?',
        timestamp: 'Now',
      },
    ]);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-[8vw] sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex flex-col w-full max-w-lg sm:max-w-xl h-full max-h-[84vh] sm:h-[620px] sm:max-h-[88vh] rounded-xl sm:rounded-lg border shadow-2xl overflow-hidden transition-all duration-200 ${
          isBright
            ? 'bg-white text-neutral-900 border-neutral-300 shadow-xl'
            : 'bg-neutral-950 text-neutral-100 border-neutral-800 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-3.5 backdrop-blur-md ${
            isBright ? 'border-neutral-200 bg-neutral-50/90' : 'border-neutral-800 bg-neutral-900/90'
          }`}
        >
          <div className="flex items-center gap-2">
            <div>
              <div className="font-bold tracking-wider uppercase text-xs sm:text-sm">
                <span>GCI METEO</span>
              </div>
              <div className={`text-[10px] ${isBright ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Real-time weather insights & advice
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              className={`text-[11px] px-2 py-1 rounded transition-colors ${
                isBright
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Reset conversation"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className={`text-sm px-2 py-1 rounded font-bold transition-colors ${
                isBright
                  ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Active Context Bar */}
        <div
          className={`flex items-center justify-between border-b px-4 py-2 text-[11px] ${
            isBright
              ? 'border-neutral-200 bg-neutral-100/70 text-neutral-700'
              : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className={`font-semibold ${isBright ? 'text-neutral-900' : 'text-white'}`}>
              {location.name}
            </span>
            <span className="text-neutral-400">·</span>
            <span>{current.temperature}°C</span>
            <span className="text-neutral-400">·</span>
            <span>{current.conditionText}</span>
          </div>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">ESC to close</span>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-neutral-400 mb-1">
                  <span className="font-semibold">{isUser ? 'YOU' : 'GCI METEO'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-lg p-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-neutral-900 text-white font-normal dark:bg-neutral-100 dark:text-neutral-950'
                      : isBright
                      ? 'border border-neutral-200 bg-neutral-50 text-neutral-800 shadow-xs'
                      : 'border border-neutral-800 bg-neutral-900/80 text-neutral-200'
                  }`}
                >
                  <div className="space-y-1">
                    {m.content.split('\n').map((line, lIdx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={lIdx} className="h-1.5" />;
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      const renderedLine = parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={pIdx} className="font-bold">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      });
                      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                        return (
                          <div key={lIdx} className="flex items-start gap-1.5 ml-2">
                            <span className="text-neutral-400 mt-1 text-[8px]">●</span>
                            <span>{renderedLine.slice(1)}</span>
                          </div>
                        );
                      }
                      return <p key={lIdx}>{renderedLine}</p>;
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="text-xs py-2 text-neutral-400 animate-pulse">
              <span>GCI Meteo is analyzing conditions...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div
          className={`border-t p-2 sm:p-2.5 ${
            isBright ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800/80 bg-neutral-900/30'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className={`whitespace-nowrap rounded border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40 shrink-0 ${
                  isBright
                    ? 'border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-100 text-neutral-700'
                    : 'border-neutral-800 bg-neutral-900/80 hover:border-neutral-700 hover:text-neutral-200 text-neutral-400'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className={`flex items-center gap-2 border-t p-3 sm:p-3.5 ${
            isBright ? 'border-neutral-200 bg-white' : 'border-neutral-800 bg-neutral-900/90'
          }`}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${location.name}'s weather or plans...`}
            className={`flex-1 rounded border py-2 px-3 text-xs sm:text-sm focus:outline-none transition-colors ${
              isBright
                ? 'border-neutral-300 bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-600 focus:bg-white'
                : 'border-neutral-800 bg-neutral-950 text-neutral-200 placeholder:text-neutral-500 focus:border-emerald-500'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`px-3.5 py-2 rounded font-bold text-xs transition-colors disabled:opacity-40 ${
              isBright
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : 'bg-neutral-100 text-neutral-950 hover:bg-neutral-300'
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
