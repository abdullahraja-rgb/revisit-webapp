"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Home,
  Users,
  FileText,
  Upload,
  // Ruler,
  // Move3D,
  Settings,
  ChevronLeft,
  ChevronRight,
  // RotateCw,
  // ZoomIn,
  // Triangle,
  // Square,
} from "lucide-react";
import { clsx } from "clsx";
// import { useViewerStore } from "@/stores/viewerStore";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onUploadModel?: () => void;
  onGenerateReport?: () => void;
}

const navigationItems = [
  { icon: Home, label: "Dashboard", active: true, action: null },
  { icon: Users, label: "Patients", active: false, action: null },
  { icon: FileText, label: "Reports", active: false, action: "generateReport" },
  { icon: Upload, label: "Upload Model", active: false, action: "uploadModel" },
];

// const viewTools = [
//   { icon: RotateCw, label: "Orbit", key: "orbit" as const },
//   { icon: Move3D, label: "Pan", key: "pan" as const },
//   { icon: ZoomIn, label: "Zoom", key: "zoom" as const },
// ];

// const measurementTools = [
//   { icon: Ruler, label: "Distance", type: "distance" as const },
//   { icon: Triangle, label: "Angle", type: "angle" as const },
//   { icon: Square, label: "Area", type: "area" as const },
// ];

export function Sidebar({ collapsed, onToggle, onUploadModel, onGenerateReport }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const textElementsRef = useRef<(HTMLElement | SVGElement)[]>([]);
  const iconsRef = useRef<(HTMLElement | SVGElement)[]>([]);

  // Zustand store
  // const { activeTools, setActiveTool, setMeasurementType, clearMeasurementPoints } =
  //   useViewerStore();

  // Animation timeline
  useEffect(() => {
    if (!sidebarRef.current) return;

    const tl = gsap.timeline();
    const sidebar = sidebarRef.current;
    const textElements = textElementsRef.current;
    const icons = iconsRef.current;

    if (collapsed) {
      // Collapse animation
      tl.to(textElements, {
        opacity: 0,
        x: -10,
        duration: 0.2,
        stagger: 0.02,
        ease: "power2.out",
      })
        .to(
          sidebar,
          {
            width: "4rem", // w-16 = 64px = 4rem
            duration: 0.4,
            ease: "power2.inOut",
          },
          "-=0.1"
        )
        .to(
          icons,
          {
            x: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.2"
        );
    } else {
      // Expand animation
      tl.to(sidebar, {
        width: "16rem", // w-64 = 256px = 16rem
        duration: 0.4,
        ease: "power2.inOut",
      })
        .to(
          icons,
          {
            x: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.3"
        )
        .to(
          textElements,
          {
            opacity: 1,
            x: 0,
            duration: 0.3,
            stagger: 0.03,
            ease: "power2.out",
          },
          "-=0.2"
        );
    }

    return () => {
      tl.kill();
    };
  }, [collapsed]);

  const addToTextRefs = (el: HTMLElement | SVGElement | null) => {
    if (el && !textElementsRef.current.includes(el)) {
      textElementsRef.current.push(el);
    }
  };

  const addToIconRefs = (el: HTMLElement | SVGElement | null) => {
    if (el && !iconsRef.current.includes(el)) {
      iconsRef.current.push(el);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="bg-white border-r border-gray-200 flex flex-col overflow-hidden"
      style={{ width: collapsed ? "4rem" : "16rem" }}
    >
      {/* Toggle Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div>
          <h3
            ref={addToTextRefs}
            className={clsx(
              "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3",
              collapsed && "opacity-0"
            )}
            style={{ display: collapsed ? "none" : "block" }}
          >
            Navigation
          </h3>
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.action === "uploadModel" && onUploadModel) onUploadModel();
                  if (item.action === "generateReport" && onGenerateReport) onGenerateReport();
                }}
                className={clsx(
                  "w-full flex items-center text-sm font-medium rounded-lg transition-colors",
                  collapsed ? "justify-center p-2" : "px-3 py-2",
                  item.active ? "bg-pri-lighter/10 text-pri" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon ref={addToIconRefs} className="w-5 h-5 flex-shrink-0" />
                <span
                  ref={addToTextRefs}
                  className={clsx("ml-3", collapsed && "opacity-0")}
                  style={{ display: collapsed ? "none" : "inline" }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Separator */}
        {/* <div className={clsx("my-4", collapsed ? "border-t border-gray-200" : "")}>
          {collapsed && <div className="h-4"></div>}
        </div> */}

        {/* <div>
          <h3
            ref={addToTextRefs}
            className={clsx(
              "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3",
              collapsed && "opacity-0"
            )}
            style={{ display: collapsed ? "none" : "block" }}
          >
            View Tools
          </h3>
          <div className="space-y-2">
            {viewTools.map((tool) => (
              <button
                key={tool.label}
                onClick={() => setActiveTool(tool.key, !activeTools[tool.key])}
                className={clsx(
                  "w-full flex items-center text-sm font-medium rounded-lg transition-colors",
                  collapsed ? "justify-center p-2" : "px-3 py-2",
                  activeTools[tool.key]
                    ? "bg-pri-lighter/10 text-pri"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <tool.icon ref={addToIconRefs} className="w-5 h-5 flex-shrink-0" />
                <span
                  ref={addToTextRefs}
                  className={clsx("ml-3", collapsed && "opacity-0")}
                  style={{ display: collapsed ? "none" : "inline" }}
                >
                  {tool.label}
                </span>
              </button>
            ))}
          </div>
        </div> */}

        {/* Separator */}
        {/* <div className={clsx("my-4", collapsed ? "border-t border-gray-200" : "")}>
          {collapsed && <div className="h-4"></div>}
        </div> */}

        {/* <div>
          <h3
            ref={addToTextRefs}
            className={clsx(
              "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3",
              collapsed && "opacity-0"
            )}
            style={{ display: collapsed ? "none" : "block" }}
          >
            Measurement Tools
          </h3>
          <div className="space-y-2">
            {measurementTools.map((tool) => (
              <button
                key={tool.label}
                onClick={() => {
                  setMeasurementType(tool.type);
                  setActiveTool("measure", true);
                  clearMeasurementPoints();
                }}
                className={clsx(
                  "w-full flex items-center text-sm font-medium rounded-lg transition-colors",
                  collapsed ? "justify-center p-2" : "px-3 py-2",
                  activeTools.measure && activeTools.measurementType === tool.type
                    ? "bg-pri-lighter/10 text-pri"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <tool.icon ref={addToIconRefs} className="w-5 h-5 flex-shrink-0" />
                <span
                  ref={addToTextRefs}
                  className={clsx("ml-3", collapsed && "opacity-0")}
                  style={{ display: collapsed ? "none" : "inline" }}
                >
                  {tool.label}
                </span>
              </button>
            ))}
          </div>
        </div> */}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <button
          className={clsx(
            "w-full flex items-center text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
            collapsed ? "justify-center p-2" : "px-3 py-2"
          )}
        >
          <Settings ref={addToIconRefs} className="w-5 h-5 flex-shrink-0" />
          <span
            ref={addToTextRefs}
            className={clsx("ml-3", collapsed && "opacity-0")}
            style={{ display: collapsed ? "none" : "inline" }}
          >
            Settings
          </span>
        </button>
      </div>
    </div>
  );
}
