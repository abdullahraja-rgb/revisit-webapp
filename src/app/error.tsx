"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

// This component is automatically used by Next.js for client-side errors
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const iconRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const detailsRef = useRef(null);
  const detailsContentRef = useRef(null);
  const buttonsRef = useRef(null);

  useEffect(() => {
    // Log the error to the console for debugging
    console.error("Error caught by error.tsx:", error);

    // Initial animations
    gsap.fromTo(
      iconRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5 }
    );

    gsap.fromTo(
      titleRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.2 }
    );

    gsap.fromTo(
      descRef.current,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.4 }
    );

    gsap.fromTo(detailsRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.6 });

    gsap.fromTo(
      buttonsRef.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.7 }
    );
  }, [error]);

  // Toggle details animation
  useEffect(() => {
    if (isExpanded && detailsContentRef.current) {
      gsap.fromTo(
        detailsContentRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.3 }
      );
    } else if (!isExpanded && detailsContentRef.current) {
      gsap.to(detailsContentRef.current, { height: 0, opacity: 0, duration: 0.3 });
    }
  }, [isExpanded]);

  const getErrorDetails = () => {
    // Check if error message contains any of these status codes
    const message = error.message || "";

    if (message.includes("401")) {
      return {
        title: "Unauthorized",
        description: "You don't have permission to access this resource.",
        icon: "🔒",
      };
    } else if (message.includes("403")) {
      return {
        title: "Forbidden",
        description: "You're not allowed to access this page.",
        icon: "⛔",
      };
    } else if (message.includes("404")) {
      return {
        title: "Not Found",
        description: "The page you're looking for doesn't exist.",
        icon: "🔍",
      };
    } else if (message.includes("500")) {
      return {
        title: "Server Error",
        description: "Our servers are having issues right now.",
        icon: "⚠️",
      };
    } else {
      return {
        title: "Something went wrong",
        description: "An unexpected error occurred.",
        icon: "❌",
      };
    }
  };

  const errorInfo = getErrorDetails();

  const animateButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 });
  };

  const animateButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.2 });
  };

  const animateButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
  };

  return (
    <div className="flex-col-center gap-6 min-h-dvh px-4 py-10">
      <div ref={iconRef} className="text-6xl mb-2">
        {errorInfo.icon}
      </div>

      <h1 ref={titleRef} className="text-3xl font-bold text-center">
        {errorInfo.title}
      </h1>

      <p ref={descRef} className="text-center text-lg max-w-md">
        {errorInfo.description}
      </p>

      <div ref={detailsRef} className="mt-2 mb-4">
        <div className="flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-pri-600 underline text-sm"
          >
            {isExpanded ? "Hide technical details" : "Show technical details"}
          </button>
        </div>

        <div
          ref={detailsContentRef}
          style={{ height: 0 }}
          className="mt-4 p-4 bg-fg rounded-md text-sm font-mono max-w-[300px] w-full overflow-x-auto overflow-y-hidden scrollbar-visible"
        >
          <p>{error.stack || error.message}</p>
        </div>
      </div>

      <div ref={buttonsRef} className="flex gap-3 mt-2">
        <button
          onMouseEnter={animateButtonHover}
          onMouseLeave={animateButtonLeave}
          onMouseDown={animateButtonClick}
          onClick={() => {
            reset();
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          className="bg-pri text-text px-6 py-3 rounded-md cursor-pointer font-medium shadow-md hover:shadow-lg transition-all"
        >
          Try again
        </button>

        <button
          onMouseEnter={animateButtonHover}
          onMouseLeave={animateButtonLeave}
          onMouseDown={animateButtonClick}
          onClick={() => (window.location.href = "/")}
          className="border border-pri text-pri px-6 py-3 rounded-md cursor-pointer font-medium shadow-sm hover:shadow-md transition-all"
        >
          Go to home
        </button>
      </div>
    </div>
  );
}
