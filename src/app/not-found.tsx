"use client";

import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useEffect } from "react";

gsap.registerPlugin(useGSAP);

const NotFound = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Responsive animation settings based on screen size
  const getAnimationSettings = () => {
    const isMobile = window.innerWidth < 640;
    return {
      durationMultiplier: isMobile ? 0.8 : 1, // Slightly faster animations on mobile
      delayMultiplier: isMobile ? 0.7 : 1, // Shorter delays on mobile
    };
  };

  useGSAP(
    () => {
      const { durationMultiplier, delayMultiplier } = getAnimationSettings();

      // Create a timeline for sequenced animations
      timelineRef.current = gsap.timeline({
        repeat: 0,
        onComplete: () => {
          // Ensure button is visible after all animations
          if (buttonRef.current) {
            gsap.set(buttonRef.current, {
              opacity: 1,
              clearProps: "all", // Clear all GSAP-applied properties
            });
          }
        },
      });

      // Animate the 404 numbers
      timelineRef.current
        .from(".number-4:first-child", {
          y: -100,
          opacity: 0,
          duration: 0.8 * durationMultiplier,
          ease: "elastic.out(1, 0.5)",
        })
        .from(
          ".number-0",
          {
            scale: 0,
            opacity: 0,
            duration: 0.6 * durationMultiplier,
            ease: "back.out(1.7)",
          },
          "-=0.4"
        )
        .from(
          ".number-4:last-child",
          {
            y: 100,
            opacity: 0,
            duration: 0.8 * durationMultiplier,
            ease: "elastic.out(1, 0.5)",
          },
          "-=0.4"
        )
        .from(
          ".message",
          {
            opacity: 0,
            y: 20,
            duration: 0.6 * durationMultiplier,
            ease: "power3.out",
          },
          "-=0.2"
        )
        .from(
          ".description",
          {
            opacity: 0,
            y: 20,
            duration: 0.6 * durationMultiplier,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".home-button",
          {
            opacity: 0,
            y: 20,
            duration: 0.6 * durationMultiplier,
            ease: "power3.out",
            clearProps: "y", // Clear the y-transform after animation
          },
          "-=0.2"
        );

      // Animate the floating elements - adaptive sizes based on screen size
      const floatingElementsScale = window.innerWidth < 768 ? 0.7 : 1;

      gsap.to(".floating-circle", {
        y: -15 * floatingElementsScale,
        duration: 1.5 * durationMultiplier,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.to(".floating-square", {
        y: 15 * floatingElementsScale,
        rotate: 15,
        duration: 2 * durationMultiplier,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.5 * delayMultiplier,
      });

      gsap.to(".floating-triangle", {
        y: -20 * floatingElementsScale,
        rotate: -10,
        duration: 2.5 * durationMultiplier,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.2 * delayMultiplier,
      });

      // Subtle glow animation for the button - separate from the intro animation
      // This animation starts after a slight delay to ensure it doesn't conflict
      gsap.to(buttonRef.current, {
        boxShadow: "0 0 15px 3px rgba(2, 143, 131, 0.7)",
        duration: 1.5 * durationMultiplier,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1 * delayMultiplier, // Start after the initial animations
      });

      // Add event listener for window resize to adjust animations
      const handleResize = () => {
        // Adjust floating elements based on new screen size
        const newScale = window.innerWidth < 768 ? 0.7 : 1;

        gsap.killTweensOf(".floating-circle, .floating-square, .floating-triangle");

        gsap.to(".floating-circle", {
          y: -15 * newScale,
          duration: 1.5 * durationMultiplier,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(".floating-square", {
          y: 15 * newScale,
          rotate: 15,
          duration: 2 * durationMultiplier,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(".floating-triangle", {
          y: -20 * newScale,
          rotate: -10,
          duration: 2.5 * durationMultiplier,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    { scope: containerRef }
  );

  // Use effect to ensure button visibility even if animations fail
  useEffect(() => {
    // Safety timeout to ensure button is visible regardless of animation state
    const timer = setTimeout(() => {
      if (buttonRef.current) {
        buttonRef.current.style.opacity = "1";
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-col-center min-h-dvh w-full overflow-hidden relative p-4 px-3 sm:px-4 md:px-6"
    >
      {/* Background decorative elements - responsive sizes */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="floating-circle absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 border-pri left-[10%] top-[15%]"></div>
        <div className="floating-square absolute w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-2 border-pri right-[15%] top-[25%] rotate-12"></div>
        <div
          className="floating-triangle absolute border-2 border-pri left-[20%] bottom-[20%]"
          style={{
            width: "0",
            height: "0",
            borderWidth: "0 20px 30px 20px",
            borderColor: "transparent transparent var(--pri) transparent",
          }}
        ></div>
        {/* Responsive blur circles */}
        <div className="absolute w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-pri/5 blur-3xl left-[5%] bottom-[10%]"></div>
        <div className="absolute w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-pri/5 blur-3xl right-[5%] top-[10%]"></div>
      </div>

      {/* Main 404 content - enhanced responsiveness */}
      <div className="z-10 flex-col-center gap-4 xs:gap-6 sm:gap-8 max-w-xs xs:max-w-sm sm:max-w-md md:max-w-xl mx-auto text-center">
        <div className="flex items-center justify-center gap-1 xs:gap-2 sm:gap-4 my-4 sm:my-6">
          <span className="number-4 text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-pri">
            4
          </span>
          <span className="number-0 text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-pri relative">
            0{/* SVG face inside the 0 - responsive sizing */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 100 100"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] xs:w-[35%] sm:w-[40%] md:w-[45%] lg:w-1/2 h-auto"
            >
              <circle cx="35" cy="40" r="8" fill="currentColor" className="text-text" />
              <circle cx="65" cy="40" r="8" fill="currentColor" className="text-text" />
              <path
                d="M30 70 Q50 85 70 70"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-text"
              />
            </svg>
          </span>
          <span className="number-4 text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-pri">
            4
          </span>
        </div>

        <h1 className="message text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-text">
          Oops! Page Not Found
        </h1>

        <p className="description text-base xs:text-lg text-text/80 max-w-[90%] xs:max-w-md mx-auto">
          The page you&apos;re looking for seems to have wandered off. Perhaps it&apos;s on a
          digital vacation?
        </p>

        <div className="mt-4 sm:mt-6 md:mt-8 relative home-button-container w-full xs:w-auto">
          <button
            ref={buttonRef}
            onClick={() => router.push("/")}
            className="home-button w-fit xs:w-auto px-6 sm:px-8 py-2 sm:py-4 bg-pri text-text rounded-full font-medium text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-opacity-90 relative overflow-hidden group"
            style={{ opacity: 1 }} // Force initial opacity
          >
            <span className="relative z-10 group-hover:text-pri">Return Home</span>
            <span className="absolute inset-0 w-0 bg-white bg-opacity-30 transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
