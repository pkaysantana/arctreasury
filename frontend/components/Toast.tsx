"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle2, XCircle, Loader2, X } from "lucide-react";

type ToastType = "success" | "error" | "loading";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type: ToastType) => number;
    dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(
        (message: string, type: ToastType) => {
            const id = nextId++;
            setToasts((prev) => [...prev, { id, message, type }]);
            if (type !== "loading") {
                setTimeout(() => dismiss(id), 4000);
            }
            return id;
        },
        [dismiss],
    );

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const icon = {
        success: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />,
        error: <XCircle size={18} className="text-red-400 shrink-0" />,
        loading: <Loader2 size={18} className="text-blue-400 animate-spin shrink-0" />,
    }[toast.type];

    const border = {
        success: "border-emerald-500/30",
        error: "border-red-500/30",
        loading: "border-blue-500/30",
    }[toast.type];

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 bg-[#111113] border ${border} rounded-xl px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 max-w-sm ${visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
        >
            {icon}
            <p className="text-sm text-zinc-200 flex-1">{toast.message}</p>
            <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={14} />
            </button>
        </div>
    );
}
