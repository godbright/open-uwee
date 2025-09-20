"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react';

interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertContextType {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  removeAlert: (id: string) => void;
  clearAll: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = (alert: Omit<Alert, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert = { ...alert, id };
    setAlerts(prev => [...prev, newAlert]);

    // Auto-remove after duration (default 5 seconds)
    const duration = alert.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAll = () => {
    setAlerts([]);
  };

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert, clearAll }}>
      {children}
      <AlertContainer />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

function AlertContainer() {
  const { alerts, removeAlert } = useAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2 max-w-sm w-full px-4">
      {alerts.map(alert => (
        <AlertItem key={alert.id} alert={alert} onClose={() => removeAlert(alert.id)} />
      ))}
    </div>
  );
}

function AlertItem({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[alert.type];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start space-x-3">
        <Icon className="text-gray-600 w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900">{alert.title}</h4>
          {alert.message && (
            <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
          )}
          {alert.action && (
            <button
              onClick={alert.action.onClick}
              className="mt-2 text-sm font-medium text-black underline hover:no-underline"
            >
              {alert.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// Helper hooks for common alert types
export function useSuccessAlert() {
  const { addAlert } = useAlert();
  return (title: string, message?: string) => 
    addAlert({ type: 'success', title, message });
}

export function useErrorAlert() {
  const { addAlert } = useAlert();
  return (title: string, message?: string) => 
    addAlert({ type: 'error', title, message });
}

export function useWarningAlert() {
  const { addAlert } = useAlert();
  return (title: string, message?: string) => 
    addAlert({ type: 'warning', title, message });
}

export function useInfoAlert() {
  const { addAlert } = useAlert();
  return (title: string, message?: string) => 
    addAlert({ type: 'info', title, message });
}