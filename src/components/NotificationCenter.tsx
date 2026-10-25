import React, { useState, useEffect } from 'react';
import { NotificationItem, UserPreferences } from '../types/weather';
import { playNotificationTone, sendNativeNotification } from '../utils/weatherUtils';

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
  isBright?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onDismiss,
  onClearAll,
  onAddNotification,
  userPreferences,
  onUpdatePreferences,
  locationName,
  isBright = false,
}) => {
  const [nativePermission, setNativePermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const isEnabled = userPreferences.notificationsEnabled;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNativePermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePush = async () => {
    if (!isEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        try {
          const perm = await Notification.requestPermission();
          setNativePermission(perm);
          if (perm === 'granted') {
            playNotificationTone('success');
            sendNativeNotification('Push Notifications Active', `Weather alerts are now active for ${locationName}.`);
            onAddNotification({
              title: 'Weather Alerts Active',
              body: `Push notifications are enabled for ${locationName}.`,
              type: 'info',
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
      onUpdatePreferences({ notificationsEnabled: true });
    } else {
      onUpdatePreferences({ notificationsEnabled: false });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/40 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm rounded-sm border shadow-2xl overflow-hidden font-mono text-xs ${
          isBright
            ? 'border-neutral-300 bg-white text-neutral-900'
            : 'border-neutral-800 bg-neutral-950 text-neutral-100'
        }`}
      >
        {/* Simple Header */}
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            isBright ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800 bg-neutral-900/80'
          }`}
        >
          <span className="font-bold tracking-wider uppercase">
            Push Notifications
          </span>
          <button
            onClick={onClose}
            className={`font-mono text-[11px] ${
              isBright ? 'text-neutral-500 hover:text-neutral-900' : 'text-neutral-500 hover:text-neutral-200'
            }`}
          >
            Close
          </button>
        </div>

        {/* Minimal Control: Toggle */}
        <div
          className={`border-b p-4 ${
            isBright ? 'border-neutral-200 bg-neutral-50/50' : 'border-neutral-800/80 bg-neutral-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-sm">
                Weather Alerts
              </div>
              <div className={`text-[11px] ${isBright ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {isEnabled ? `Active for ${locationName}` : 'Notifications turned off'}
              </div>
            </div>

            <button
              onClick={handleTogglePush}
              className={`px-3 py-1.5 rounded-sm font-bold text-xs transition-colors ${
                isEnabled
                  ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                  : isBright
                  ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="max-h-64 overflow-y-auto p-3 divide-y divide-neutral-200 dark:divide-neutral-900">
          {notifications.length === 0 ? (
            <div className={`py-6 text-center font-sans text-xs ${isBright ? 'text-neutral-500' : 'text-neutral-500'}`}>
              No recent notifications.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className="group flex items-start justify-between py-2.5 first:pt-0 last:pb-0"
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
                  className={`font-mono text-[10px] p-1 ml-2 shrink-0 ${
                    isBright ? 'text-neutral-400 hover:text-neutral-800' : 'text-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  Dismiss
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            className={`flex items-center justify-end border-t px-4 py-2 ${
              isBright ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-800 bg-neutral-900/60'
            }`}
          >
            <button
              onClick={onClearAll}
              className={`text-[10px] font-mono transition-colors ${
                isBright ? 'text-neutral-500 hover:text-rose-600' : 'text-neutral-400 hover:text-rose-400'
              }`}
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
