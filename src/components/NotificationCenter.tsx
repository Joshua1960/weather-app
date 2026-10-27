import React, { useState, useEffect } from 'react';
import { NotificationItem, UserPreferences } from '../types/weather';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onAddNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  userPreferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  locationName: string;
  currentTemperature?: number;
  isBright?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onDismiss,
  onClearAll,
  onAddNotification: _onAddNotification,
  userPreferences,
  onUpdatePreferences,
  locationName,
  currentTemperature: _currentTemperature,
  isBright = false,
}) => {
  const [nativePermission, setNativePermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const targetAlert = userPreferences.targetTempAlert || {
    enabled: true,
    targetTemp: 30,
    condition: 'reaches_or_above',
  };

  const [targetTemp, setTargetTemp] = useState<number>(targetAlert.targetTemp);
  const [isEnabled, setIsEnabled] = useState<boolean>(targetAlert.enabled);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNativePermission(Notification.permission);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userPreferences.targetTempAlert) {
      setTargetTemp(userPreferences.targetTempAlert.targetTemp);
      setIsEnabled(userPreferences.targetTempAlert.enabled);
    }
  }, [userPreferences.targetTempAlert]);

  if (!isOpen) return null;

  const requestPermissionIfNeeded = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        setNativePermission(perm);
        return perm === 'granted';
      } catch (e) {
        console.error(e);
        return false;
      }
    }
    return Notification.permission === 'granted';
  };

  const handleSaveTargetAlert = async (newTemp: number, newEnabled: boolean) => {
    setTargetTemp(newTemp);
    setIsEnabled(newEnabled);

    if (newEnabled) {
      await requestPermissionIfNeeded();
    }

    onUpdatePreferences({
      notificationsEnabled: newEnabled,
      targetTempAlert: {
        enabled: newEnabled,
        targetTemp: newTemp,
        condition: 'reaches_or_above',
      },
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/40 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-xl border shadow-2xl overflow-hidden font-mono text-xs ${
          isBright
            ? 'border-neutral-300 bg-white text-neutral-900'
            : 'border-neutral-800 bg-neutral-950 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            isBright ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800 bg-neutral-900/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider uppercase text-xs sm:text-sm">
              Weather & Temperature Alerts
            </span>
          </div>
          <button
            onClick={onClose}
            className={`font-mono text-[11px] px-2 py-0.5 rounded transition-colors ${
              isBright ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Close ✕
          </button>
        </div>

        {/* Browser Permission Banner */}
        {nativePermission !== 'granted' && (
          <div
            className={`p-3 border-b text-xs flex items-center justify-between ${
              isBright ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            <span>Allow notifications in your browser to receive instant alerts.</span>
            <button
              onClick={requestPermissionIfNeeded}
              className="ml-2 rounded px-2.5 py-1 text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Enable
            </button>
          </div>
        )}

        {/* Mark Temperature Alert Section */}
        <div className={`p-4 border-b space-y-3 ${
          isBright ? 'border-neutral-200 bg-neutral-50/40' : 'border-neutral-800/80 bg-neutral-900/30'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">
                Set a Temperature Notice
              </div>
              <div className={`text-[11px] mt-0.5 ${isBright ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Get notified on your device when it reaches this degree in {locationName}.
              </div>
            </div>

            {/* Enable Toggle */}
            <button
              onClick={() => handleSaveTargetAlert(targetTemp, !isEnabled)}
              className={`px-3 py-1.5 rounded-sm font-bold text-xs transition-colors shrink-0 ${
                isEnabled
                  ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                  : isBright
                  ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {isEnabled ? 'ALERTS ON' : 'ALERTS OFF'}
            </button>
          </div>

          {/* Clean Stepper */}
          <div className={`p-3 rounded-sm border ${
            isBright ? 'border-neutral-200 bg-white' : 'border-neutral-800 bg-neutral-950'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isBright ? 'text-neutral-600' : 'text-neutral-400'}`}>
                Notify me when it hits:
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveTargetAlert(Math.max(targetTemp - 1, -20), isEnabled)}
                  className={`flex h-8 w-8 items-center justify-center rounded-sm border font-bold text-base transition-colors ${
                    isBright ? 'border-neutral-300 hover:bg-neutral-100 text-neutral-800' : 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                  }`}
                  title="Decrease 1°C"
                >
                  -
                </button>

                <div className={`flex items-baseline font-mono text-2xl font-bold px-2 ${
                  isBright ? 'text-neutral-950' : 'text-white'
                }`}>
                  <span>{targetTemp}</span>
                  <span className="text-sm font-normal text-neutral-400">°C</span>
                </div>

                <button
                  onClick={() => handleSaveTargetAlert(Math.min(targetTemp + 1, 55), isEnabled)}
                  className={`flex h-8 w-8 items-center justify-center rounded-sm border font-bold text-base transition-colors ${
                    isBright ? 'border-neutral-300 hover:bg-neutral-100 text-neutral-800' : 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                  }`}
                  title="Increase 1°C"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification History Feed */}
        <div className="p-3">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-neutral-200 dark:border-neutral-800">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isBright ? 'text-neutral-600' : 'text-neutral-400'}`}>
              Alert History
            </span>
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className={`text-[10px] font-mono transition-colors ${
                  isBright ? 'text-neutral-500 hover:text-rose-600' : 'text-neutral-400 hover:text-rose-400'
                }`}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className={`py-6 text-center font-sans text-xs ${isBright ? 'text-neutral-500' : 'text-neutral-500'}`}>
                No recent alerts. When {locationName} reaches {targetTemp}°C, you will be notified here.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-sm border flex items-start justify-between gap-2 ${
                    isBright ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800/80 bg-neutral-900/40'
                  }`}
                >
                  <div>
                    <h4 className={`font-semibold text-xs ${isBright ? 'text-neutral-900' : 'text-neutral-200'}`}>
                      {item.title}
                    </h4>
                    <p className={`font-sans text-[11px] leading-relaxed mt-0.5 ${isBright ? 'text-neutral-600' : 'text-neutral-400'}`}>
                      {item.body}
                    </p>
                    <span className={`text-[9px] font-mono ${isBright ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {item.timestamp}
                    </span>
                  </div>

                  <button
                    onClick={() => onDismiss(item.id)}
                    className={`font-mono text-[10px] p-1 shrink-0 ${
                      isBright ? 'text-neutral-400 hover:text-neutral-800' : 'text-neutral-500 hover:text-neutral-200'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
