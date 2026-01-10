import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
        remove: removeToast
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastContainer({ toasts, onRemove }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }) {
    const { id, message, type } = toast;

    const configs = {
        success: {
            icon: CheckCircle,
            bg: 'bg-green-900/95 border-green-600',
            iconColor: 'text-green-400',
            textColor: 'text-green-100'
        },
        error: {
            icon: XCircle,
            bg: 'bg-red-900/95 border-red-600',
            iconColor: 'text-red-400',
            textColor: 'text-red-100'
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-yellow-900/95 border-yellow-600',
            iconColor: 'text-yellow-400',
            textColor: 'text-yellow-100'
        },
        info: {
            icon: Info,
            bg: 'bg-blue-900/95 border-blue-600',
            iconColor: 'text-blue-400',
            textColor: 'text-blue-100'
        }
    };

    const config = configs[type] || configs.info;
    const Icon = config.icon;

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300 ${config.bg}`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <p className={`text-sm flex-1 ${config.textColor}`}>{message}</p>
            <button
                onClick={() => onRemove(id)}
                className="text-neutral-400 hover:text-white p-1 -mr-1 -mt-1"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default ToastContext;
