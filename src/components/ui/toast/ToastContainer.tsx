"use client";

import React from "react";
import { useToast } from "@/contexts/ToastContext";
import Toast from "./Toast"; // Assuming this is the component for a single toast message

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    // This is the container that positions the toasts on the screen
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2" aria-live="polite">
      {/* This is where the list is rendered.
        The `key` prop is essential here. It must be unique for each toast.
        We are using `toast.id`, which is guaranteed to be unique by our ToastContext.
      */}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
