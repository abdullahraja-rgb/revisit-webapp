import { create } from "zustand";
import * as THREE from "three";
import { fullscreenAPI } from "@/utils/fullscreen";

export interface Measurement {
  id: string;
  type: "distance" | "angle" | "area";
  points: Array<[number, number, number]>;
  value: number;
  label: string;
  visible: boolean;
}

export interface DisplayOptions {
  showGrid: boolean;
  showAxes: boolean;
  wireframe: boolean;
  ambientLight: boolean;
  ambientLightIntensity: number;
  shadows: boolean;
  // Background options
  backgroundColor: string;
  backgroundType: "solid" | "gradient" | "environment";
  // Enhanced lighting options
  directionalLight: boolean;
  directionalLightIntensity: number;
  directionalLightPosition: [number, number, number];
  pointLight: boolean;
  pointLightIntensity: number;
  pointLightPosition: [number, number, number];
  spotLight: boolean;
  spotLightIntensity: number;
  spotLightPosition: [number, number, number];
  spotLightTarget: [number, number, number];
  spotLightAngle: number;
  // Professional grid and axis options
  gridSize: number;
  gridDivisions: number;
  gridOpacity: number;
  axisLength: number;
  axisOpacity: number;
  // Model centering
  autoCenter: boolean;
}

export interface SelectionTools {
  select: boolean;
  face: boolean;
  edge: boolean;
  vertex: boolean;
}

export interface ModelHierarchy {
  id: string;
  name: string;
  visible: boolean;
  type?: string;
  isMesh?: boolean;
  children?: ModelHierarchy[];
}

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface ModelDimensions {
  width: number;
  depth: number;
  height: number;
  surfaceArea: number;
  volume: number;
}

export interface ModelInfo {
  name: string;
  fileName: string;
  format: string;
  version?: string;
  size: number; // in bytes
  optimized?: boolean;
  vertices: number;
  faces: number;
  materials: number;
  textures: number;
  animations: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
  };
  dimensions: ModelDimensions;
}

export interface ActiveTools {
  orbit: boolean;
  pan: boolean;
  zoom: boolean;
  measure: boolean;
  measurementType: "distance" | "angle" | "area";
}

export interface ZoomOptions {
  zoomType: "scroll" | "doubleClick" | "box" | "region";
  zoomSpeed: number; // 0.1 to 2.0
  zoomToFit: boolean;
  zoomToSelection: boolean;
  smoothZoom: boolean;
  zoomLimits: {
    min: number;
    max: number;
  };
}

export interface SelectionMode {
  select: boolean;
  face: boolean;
  edge: boolean;
  vertex: boolean;
}

export interface ViewerState {
  // Model scaling factor and unit conversion
  modelScale: number;
  setModelScale: (scale: number) => void;

  // Calibration system
  isCalibrated: boolean;
  calibrationFactor: number;
  showCalibrationModal: boolean;
  setShowCalibrationModal: (show: boolean) => void;
  setCalibration: (actualMeasurement: number, deviceMeasurement: number) => void;
  resetCalibration: () => void;

  // Active tools
  activeTools: ActiveTools;
  setActiveTool: (tool: keyof Omit<ActiveTools, "measurementType">, active: boolean) => void;
  setMeasurementType: (type: "distance" | "angle" | "area") => void;
  toggleMeasurementTool: (type: "distance" | "angle" | "area") => void;

  // Zoom options
  zoomOptions: ZoomOptions;
  setZoomOption: (option: keyof ZoomOptions, value: ZoomOptions[keyof ZoomOptions]) => void;
  setZoomType: (type: ZoomOptions["zoomType"]) => void;
  zoomToFitModel: () => void;
  zoomToSelection: () => void;

  // Selection mode
  selectionMode: SelectionMode;
  setSelectionMode: (mode: keyof SelectionMode, active: boolean) => void;

  // Selected meshes
  selectedMeshes: Set<string>;
  addSelectedMesh: (meshId: string) => void;
  removeSelectedMesh: (meshId: string) => void;
  clearSelectedMeshes: () => void;

  // Display options
  displayOptions: DisplayOptions;
  setDisplayOption: (option: keyof DisplayOptions, value: boolean | number | string) => void;

  // Transform
  transform: Transform;
  setTransform: (transform: Partial<Transform>) => void;

  // Model hierarchy
  modelHierarchy: ModelHierarchy | null;
  setModelHierarchy: (hierarchy: ModelHierarchy) => void;
  toggleHierarchyVisibility: (nodeId: string) => void;

  // Model info
  modelInfo: ModelInfo | null;
  setModelInfo: (info: ModelInfo) => void;

  // Measurements
  measurements: Measurement[];
  addMeasurement: (measurement: Omit<Measurement, "id">) => void;
  clearMeasurements: () => void;
  removeMeasurement: (id: string) => void;
  toggleMeasurementVisibility: (id: string) => void;

  // Measurement points (for active measurement)
  measurementPoints: Array<[number, number, number]>;
  addMeasurementPoint: (point: [number, number, number]) => void;
  clearMeasurementPoints: () => void;
  completeMeasurement: () => void;
  cancelMeasurement: () => void;

  // Model viewer settings
  cameraPosition: [number, number, number];
  setCameraPosition: (position: [number, number, number]) => void;

  // Reset camera to default view
  resetCamera: () => void;

  // UI state
  isFullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  isFullscreenSupported: () => boolean;
  isPropertiesPanelVisible: boolean;
  togglePropertiesPanel: () => void;

  // Reset all tools
  resetTools: () => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  // Initial active tools state
  activeTools: {
    orbit: true,
    pan: false,
    zoom: true,
    measure: false,
    measurementType: "distance",
  },

  setActiveTool: (tool, active) => {
    set((state) => {
      const newActiveTools = {
        ...state.activeTools,
        [tool]: active,
      };

      // Clear measurement points when deactivating measure tool
      if (tool === "measure" && !active) {
        return {
          activeTools: newActiveTools,
          measurementPoints: [],
        };
      }

      return {
        activeTools: newActiveTools,
      };
    });
  },

  setMeasurementType: (type) => {
    set((state) => ({
      activeTools: {
        ...state.activeTools,
        measurementType: type,
      },
    }));
  },

  // Zoom options state and methods
  zoomOptions: {
    zoomType: "doubleClick",
    zoomSpeed: 1.0,
    zoomToFit: true,
    zoomToSelection: false,
    smoothZoom: true,
    zoomLimits: {
      min: 0.1,
      max: 50,
    },
  },

  setZoomOption: (option, value) => {
    set((state) => ({
      zoomOptions: {
        ...state.zoomOptions,
        [option]: value,
      },
    }));
  },

  setZoomType: (type) => {
    set((state) => ({
      zoomOptions: {
        ...state.zoomOptions,
        zoomType: type,
      },
    }));
  },

  zoomToFitModel: () => {
    // This will be handled by the camera controls in the component
    console.log("🎯 Zoom to fit model - Enhanced zoom capabilities");
  },

  zoomToSelection: () => {
    // This will be handled by the camera controls in the component
    const { selectedMeshes } = get();
    if (selectedMeshes.size === 0) {
      console.warn("⚠️ No objects selected for zoom to selection");
      return;
    }
    console.log(`🎯 Zoom to selection - ${selectedMeshes.size} objects selected`);
  },

  toggleMeasurementTool: (type) => {
    const { activeTools } = get();
    const isCurrentlyActive = activeTools.measure && activeTools.measurementType === type;

    if (isCurrentlyActive) {
      // Deactivate the measurement tool
      console.log(`🔧 Disabling ${type} measurement tool`);
      set((state) => ({
        activeTools: {
          ...state.activeTools,
          measure: false,
        },
        measurementPoints: [], // Clear any pending measurement points
      }));
    } else {
      // Activate the measurement tool with specified type
      console.log(`🔧 Enabling ${type} measurement tool`);
      // Only clear pending measurement points, keep existing measurements
      set((state) => ({
        activeTools: {
          ...state.activeTools,
          measure: true,
          measurementType: type,
        },
        measurementPoints: [], // Clear any previous measurement points
      }));
    }
  },

  // Selection mode
  selectionMode: {
    select: false,
    face: false,
    edge: false,
    vertex: false,
  },

  setSelectionMode: (mode, active) => {
    set(() => ({
      selectionMode: {
        // Reset all modes first
        select: false,
        face: false,
        edge: false,
        vertex: false,
        // Then set the selected mode
        [mode]: active,
      },
    }));
  },

  // Selected meshes
  selectedMeshes: new Set<string>(),

  addSelectedMesh: (meshId) => {
    set((state) => ({
      selectedMeshes: new Set([...state.selectedMeshes, meshId]),
    }));
  },

  removeSelectedMesh: (meshId) => {
    set((state) => {
      const newSet = new Set(state.selectedMeshes);
      newSet.delete(meshId);
      return { selectedMeshes: newSet };
    });
  },

  clearSelectedMeshes: () => {
    set({ selectedMeshes: new Set<string>() });
  },

  // Initial display options
  displayOptions: {
    showGrid: true,
    showAxes: true,
    wireframe: false,
    ambientLight: true,
    ambientLightIntensity: 0.6,
    shadows: true,
    // Background options
    backgroundColor: "#ffffff",
    backgroundType: "solid",
    // Enhanced lighting options
    directionalLight: true,
    directionalLightIntensity: 1.2,
    directionalLightPosition: [10, 10, 5],
    pointLight: false,
    pointLightIntensity: 0.5,
    pointLightPosition: [-10, -10, -10],
    spotLight: false,
    spotLightIntensity: 1.0,
    spotLightPosition: [5, 5, 5],
    spotLightTarget: [0, 0, 0],
    spotLightAngle: 0.3,
    // Professional grid and axis options
    gridSize: 20,
    gridDivisions: 20,
    gridOpacity: 0.3,
    axisLength: 5,
    axisOpacity: 0.8,
    // Model centering
    autoCenter: true,
  },

  setDisplayOption: (option, value) => {
    set((state) => ({
      displayOptions: {
        ...state.displayOptions,
        [option]: value,
      },
    }));
  },

  // Transform
  transform: {
    position: [0, 0, 0],
    rotation: [0, 45, 0],
    scale: [1, 1, 1],
  },

  setTransform: (newTransform) => {
    set((state) => ({
      transform: {
        ...state.transform,
        ...newTransform,
      },
    }));
  },

  // Model hierarchy
  modelHierarchy: null,

  setModelHierarchy: (hierarchy) => {
    set({ modelHierarchy: hierarchy });
  },

  toggleHierarchyVisibility: (nodeId) => {
    set((state) => {
      if (!state.modelHierarchy) {
        console.warn("❌ No model hierarchy found");
        return state;
      }

      const toggleNodeVisibility = (node: ModelHierarchy): ModelHierarchy => {
        if (node.id === nodeId) {
          const newVisible = !node.visible;
          console.log(
            `🔄 Toggling "${node.name}" (${node.isMesh ? "mesh" : "group"}) → ${
              newVisible ? "visible" : "hidden"
            }`
          );

          // If this is a group/container, we need to toggle all its children
          if (node.children && !node.isMesh) {
            const toggleAllChildren = (children: ModelHierarchy[]): ModelHierarchy[] => {
              return children.map((child) => ({
                ...child,
                visible: newVisible,
                children: child.children ? toggleAllChildren(child.children) : undefined,
              }));
            };

            return {
              ...node,
              visible: newVisible,
              children: toggleAllChildren(node.children),
            };
          } else {
            // For individual meshes, just toggle their visibility
            return { ...node, visible: newVisible };
          }
        }

        if (node.children) {
          return {
            ...node,
            children: node.children.map(toggleNodeVisibility),
          };
        }

        return node;
      };

      const newHierarchy = toggleNodeVisibility(state.modelHierarchy);

      return {
        modelHierarchy: newHierarchy,
      };
    });
  },

  // Model info
  modelInfo: null,

  setModelInfo: (info) => {
    set({ modelInfo: info });
  },

  // Measurements
  measurements: [],

  addMeasurement: (measurement) => {
    const newMeasurement = {
      ...measurement,
      id: Date.now().toString(),
    };
    set((state) => ({
      measurements: [...state.measurements, newMeasurement],
    }));
  },

  clearMeasurements: () => {
    set({ measurements: [] });
  },

  removeMeasurement: (id) => {
    set((state) => ({
      measurements: state.measurements.filter((m) => m.id !== id),
    }));
  },

  toggleMeasurementVisibility: (id) => {
    set((state) => ({
      measurements: state.measurements.map((m) =>
        m.id === id ? { ...m, visible: !m.visible } : m
      ),
    }));
  },

  // Measurement points
  measurementPoints: [],

  addMeasurementPoint: (point) => {
    const currentPoints = get().measurementPoints;
    const measurementType = get().activeTools.measurementType;

    let maxPoints = 2; // Default for distance
    if (measurementType === "angle") maxPoints = 3;
    if (measurementType === "area") maxPoints = 4;

    console.log(`📍 Adding measurement point ${currentPoints.length + 1}/${maxPoints}:`, point);

    if (currentPoints.length < maxPoints) {
      const newPoints = [...currentPoints, point];
      set(() => ({
        measurementPoints: newPoints,
      }));

      console.log(`✅ Point added. Total points: ${newPoints.length}/${maxPoints}`);

      // Auto-complete immediately when we have enough points (no delay)
      if (newPoints.length === maxPoints) {
        console.log(`🎯 Enough points collected, auto-completing ${measurementType} immediately`);
        // Auto-complete immediately
        setTimeout(() => {
          const currentState = get();
          if (
            currentState.measurementPoints.length >= maxPoints &&
            currentState.activeTools.measure
          ) {
            currentState.completeMeasurement();
          }
        }, 100);
      }
    } else {
      console.log(
        `⚠️ Maximum points (${maxPoints}) already reached for ${measurementType} measurement`
      );
    }
  },

  clearMeasurementPoints: () => {
    console.log("🗑️ Clearing measurement points");
    set({ measurementPoints: [] });
  },

  completeMeasurement: () => {
    const { measurementPoints, activeTools, measurements, isCalibrated } = get();
    const measurementType = activeTools.measurementType;

    let requiredPoints = 2; // Default for distance
    if (measurementType === "angle") requiredPoints = 3;
    if (measurementType === "area") requiredPoints = 4;

    if (measurementPoints.length >= requiredPoints) {
      const pointsToUse = measurementPoints.slice(0, requiredPoints);
      const measurement = calculateMeasurement(
        pointsToUse,
        measurementType,
        get().calibrationFactor
      );

      // Check if this is the first distance measurement and we're not calibrated yet
      const isFirstDistanceMeasurement =
        measurementType === "distance" &&
        !isCalibrated &&
        measurements.filter((m) => m.type === "distance").length === 0;

      if (isFirstDistanceMeasurement) {
        // Store the measurement temporarily and show calibration modal
        get().addMeasurement(measurement);
        get().setShowCalibrationModal(true);
        console.log(`📏 First distance measurement completed. Showing calibration modal.`);
      } else {
        get().addMeasurement(measurement);
        console.log(`✅ Measurement completed:`, measurement);
      }

      get().clearMeasurementPoints();
    } else {
      console.log(
        `❌ Not enough points to complete ${measurementType} measurement. Need ${requiredPoints}, have ${measurementPoints.length}`
      );
    }
  },

  cancelMeasurement: () => {
    console.log("❌ Measurement cancelled");
    get().clearMeasurementPoints();
  },

  // Model viewer settings
  cameraPosition: [5, 5, 5],
  setCameraPosition: (position) => {
    set({ cameraPosition: position });
  },

  // Reset camera to default view
  resetCamera: () => {
    set({
      cameraPosition: [5, 5, 5],
      transform: {
        position: [0, 0, 0],
        rotation: [0, 45, 0],
        scale: [1, 1, 1],
      },
    });
  },

  // UI state
  isFullscreen: false,
  setFullscreen: (fullscreen) => {
    set({ isFullscreen: fullscreen });
  },
  enterFullscreen: async () => {
    try {
      await fullscreenAPI.requestFullscreen();
      set({ isFullscreen: true });
    } catch (error) {
      console.warn("Failed to enter fullscreen:", error);
      throw error;
    }
  },
  exitFullscreen: async () => {
    try {
      await fullscreenAPI.exitFullscreen();
      set({ isFullscreen: false });
    } catch (error) {
      console.warn("Failed to exit fullscreen:", error);
      throw error;
    }
  },
  toggleFullscreen: async () => {
    const currentlyFullscreen = fullscreenAPI.isFullscreen();

    if (currentlyFullscreen) {
      await get().exitFullscreen();
    } else {
      await get().enterFullscreen();
    }
  },
  isFullscreenSupported: () => {
    return fullscreenAPI.isSupported();
  },
  isPropertiesPanelVisible: true,
  togglePropertiesPanel: () =>
    set((state) => ({ isPropertiesPanelVisible: !state.isPropertiesPanelVisible })),

  // Reset all tools
  resetTools: () => {
    set({
      activeTools: {
        orbit: true,
        pan: false,
        zoom: true,
        measure: false,
        measurementType: "distance",
      },
      selectionMode: {
        select: false,
        face: false,
        edge: false,
        vertex: false,
      },
      selectedMeshes: new Set<string>(),
      measurementPoints: [], // Only clear pending points, keep completed measurements
    });
  },

  // Model scaling factor and unit conversion
  modelScale: 1,
  setModelScale: (scale) => {
    set({ modelScale: scale });
  },

  // Calibration system
  isCalibrated: false,
  calibrationFactor: 1,
  showCalibrationModal: false,
  setShowCalibrationModal: (show) => {
    set({ showCalibrationModal: show });
  },
  setCalibration: (actualMeasurement, deviceMeasurement) => {
    const factor = actualMeasurement / deviceMeasurement;

    // Update existing distance measurements with the new calibration factor
    const currentState = get();
    const updatedMeasurements = currentState.measurements.map((measurement) => {
      if (measurement.type === "distance") {
        // Recalculate the distance with the calibration factor
        const points = measurement.points;
        const v = points.map((p) => new THREE.Vector3(...p));
        const rawDistance = v[0].distanceTo(v[1]);
        const calibratedDistance = rawDistance * factor;

        return {
          ...measurement,
          value: calibratedDistance,
          label: `${calibratedDistance.toFixed(2)}m`,
          visible: measurement.visible, // Preserve visibility state
        };
      }
      return measurement;
    });

    set({
      calibrationFactor: factor,
      isCalibrated: true,
      measurements: updatedMeasurements,
    });
    console.log(
      `📏 Calibration successful. Factor: ${factor.toFixed(4)}. Updated ${
        updatedMeasurements.filter((m) => m.type === "distance").length
      } distance measurements.`
    );
  },
  resetCalibration: () => {
    set({ calibrationFactor: 1, isCalibrated: false });
    console.log("🔄 Calibration reset.");
  },
}));

// Helper function to calculate measurements
function calculateMeasurement(
  points: Array<[number, number, number]>,
  type: "distance" | "angle" | "area",
  calibrationFactor: number = 1
): Omit<Measurement, "id"> {
  const v = points.map((p) => new THREE.Vector3(...p));

  switch (type) {
    case "distance": {
      const rawDistance = v[0].distanceTo(v[1]);
      const calibratedDistance = rawDistance * calibrationFactor;

      return {
        type: "distance",
        points,
        value: calibratedDistance,
        label: `${calibratedDistance.toFixed(2)}m`,
        visible: true,
      };
    }

    case "angle": {
      const vec1 = new THREE.Vector3().subVectors(v[0], v[1]);
      const vec2 = new THREE.Vector3().subVectors(v[2], v[1]);
      const angle = vec1.angleTo(vec2) * (180 / Math.PI);
      return {
        type: "angle",
        points,
        value: angle,
        label: `${angle.toFixed(1)}°`,
        visible: true,
      };
    }

    case "area": {
      // Using triangle area summation (Shoelace formula for 3D is complex)
      // This assumes a convex quadrilateral on a plane.
      const triangle1 = new THREE.Triangle(v[0], v[1], v[2]);
      const triangle2 = new THREE.Triangle(v[0], v[2], v[3]);
      const area = triangle1.getArea() + triangle2.getArea();
      return {
        type: "area",
        points,
        value: area,
        label: `${area.toFixed(2)}m²`,
        visible: true,
      };
    }

    default:
      throw new Error(`Unknown measurement type: ${type}`);
  }
}
