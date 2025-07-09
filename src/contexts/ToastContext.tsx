"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Toast, ToastAction, ToastContextType, ToastState } from "../../types/global";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Reducer for managing toast state
const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload.id),
      };
    default:
      return state;
  }
};

// Create the provider component
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    dispatch({
      type: "ADD_TOAST",
      payload: { id, ...toast },
    });
  };

  const removeToast = (id: string) => {
    dispatch({
      type: "REMOVE_TOAST",
      payload: { id },
    });
  };

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// Custom hook for using the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
