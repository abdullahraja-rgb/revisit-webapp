"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";

interface ToastType {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const toastRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const progressTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRemove = useCallback(() => {
    // Clear any existing timeout to prevent multiple removal attempts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const toastElement = toastRef.current;
    if (!toastElement) return;

    // Create exit animation and then remove toast
    gsap.to(toastElement, {
      opacity: 0,
      x: 50,
      scale: 0.8,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => onRemove(toast.id),
    });
  }, [onRemove, toast.id]);

  // Set up background color based on toast type
  const getBackgroundColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-toast-success";
      case "error":
        return "bg-toast-error";
      case "warning":
        return "bg-toast-warning";
      case "info":
      default:
        return "bg-toast-info";
    }
  };

  // Get progress bar color based on toast type
  const getProgressColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-toast-success";
      case "error":
        return "bg-toast-error";
      case "warning":
        return "bg-toast-warning";
      case "info":
      default:
        return "bg-toast-info";
    }
  };

  // Get the appropriate icon based on toast type
  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 7a1 1 0 100 2h.01a1 1 0 100-2H10z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  useEffect(() => {
    const toastElement = toastRef.current;
    const progressElement = progressRef.current;
    if (!toastElement || !progressElement) return;

    // Create GSAP timeline for the toast animation
    const timeline = gsap.timeline();
    timelineRef.current = timeline;

    // Animation when toast appears
    timeline.fromTo(
      toastElement,
      {
        opacity: 0,
        x: 50,
        scale: 0.8,
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      }
    );

    // Create progress bar timeline
    const duration = toast.duration || 3000;
    const progressTimeline = gsap.timeline();

    progressTimelineRef.current = progressTimeline;

    progressTimeline.fromTo(
      progressElement,
      { width: "100%" },
      {
        width: "0%",
        duration: duration / 1000,
        ease: "linear",
      }
    );

    // Set up the timeout for toast removal
    if (toast.duration !== -1) {
      timeoutRef.current = setTimeout(() => {
        if (!isPaused) {
          handleRemove();
        }
      }, duration);
    }

    // Cleanup function that runs when the toast is removed
    return () => {
      timeline.kill();
      progressTimeline.kill();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [toast.duration, handleRemove]);

  // Effect to handle pausing and resuming the progress bar
  useEffect(() => {
    if (!progressTimelineRef.current) return;

    if (isPaused) {
      progressTimelineRef.current.pause();
      // Clear the existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      progressTimelineRef.current.play();

      // Only create a new timeout if there isn't one already
      if (!timeoutRef.current && toast.duration !== -1) {
        // Calculate remaining time based on progress
        const progress = progressTimelineRef.current.progress();
        const remainingTime = (toast.duration || 3000) * (1 - progress);

        timeoutRef.current = setTimeout(() => {
          handleRemove();
        }, remainingTime);
      }
    }
  }, [isPaused, toast.duration, handleRemove]);

  return (
    <div
      ref={toastRef}
      className="relative flex flex-col overflow-hidden rounded-md shadow-md mb-3 text-white"
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`flex items-center p-3 ${getBackgroundColor()}`}>
        <div className="flex-shrink-0 mr-2">{getIcon()}</div>
        <div className="flex-grow mr-2">{toast.message}</div>
        <button
          onClick={handleRemove}
          className="ml-auto flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div ref={progressRef} className={`h-1 ${getProgressColor()} origin-left`}></div>
    </div>
  );
};

export default Toast;
