"use client";

import * as THREE from "three";
import React, { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Line,
  Grid,
  Sphere,
  useGLTF,
  Html,
  useProgress,
} from "@react-three/drei";
import { ModelHierarchy, useViewerStore } from "@/stores/viewerStore";
import dynamic from "next/dynamic";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// Define extended DOM element interface for controls reference
interface ExtendedHTMLElement extends HTMLElement {
  _controlsRef?: OrbitControlsImpl;
}

// Client-side check
const isClient = typeof window !== "undefined";

// Progress Loader Component
function ProgressLoader() {
  const { progress, errors } = useProgress();
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (progress < 100 && !errors.length) {
        setShowRetry(true);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [progress, errors]);

  if (errors.length > 0 || showRetry) {
    return (
      <Html center>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-semibold text-red-500">
            {errors.length > 0 ? "Error loading model" : "Loading timeout"}
          </p>
          <button
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </Html>
    );
  }

  return (
    <Html center className="text-xl font-semibold text-blue-600">
      Loading {Math.min(progress, 100).toFixed(0)}%
    </Html>
  );
}

// Grid Component
function CustomGrid({
  visible,
  size,
  divisions,
  opacity,
}: {
  visible: boolean;
  size: number;
  divisions: number;
  opacity: number;
}) {
  if (!visible) return null;
  return (
    <Grid
      args={[size, size]}
      cellSize={size / divisions}
      cellThickness={0.5}
      cellColor="#969696"
      sectionSize={size / 4}
      sectionThickness={1}
      sectionColor="#646464"
      fadeDistance={size * 2}
      fadeStrength={1}
      material-opacity={opacity}
      material-transparent={true}
    />
  );
}

// Axes Component
function CustomAxes({
  visible,
  length,
  opacity,
}: {
  visible: boolean;
  length: number;
  opacity: number;
}) {
  if (!visible) return null;

  return (
    <group>
      {/* X Axis - Red */}
      <Line
        points={[
          [0, 0, 0],
          [length, 0, 0],
        ]}
        color="red"
        opacity={opacity}
        lineWidth={2}
      />
      <Text
        position={[length + 0.5, 0, 0]}
        fontSize={0.3}
        color="red"
        anchorX="left"
        anchorY="middle"
      >
        X
      </Text>

      {/* Y Axis - Green */}
      <Line
        points={[
          [0, 0, 0],
          [0, length, 0],
        ]}
        color="green"
        opacity={opacity}
        lineWidth={2}
      />
      <Text
        position={[0, length + 0.5, 0]}
        fontSize={0.3}
        color="green"
        anchorX="center"
        anchorY="bottom"
      >
        Y
      </Text>

      {/* Z Axis - Blue */}
      <Line
        points={[
          [0, 0, 0],
          [0, 0, length],
        ]}
        color="blue"
        opacity={opacity}
        lineWidth={2}
      />
      <Text
        position={[0, 0, length + 0.5]}
        fontSize={0.3}
        color="blue"
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>
    </group>
  );
}

// Measurement Points
function MeasurementPoints({
  points,
  measurementType,
}: {
  points: Array<[number, number, number]>;
  measurementType: "distance" | "angle" | "area";
}) {
  const getPointColor = (index: number) => {
    switch (measurementType) {
      case "distance":
        return index === 0 ? "#ff4444" : "#44ff44";
      case "angle":
        return index === 1 ? "#ffaa00" : "#4444ff";
      case "area":
        return "#aa44ff";
      default:
        return "#ff4444";
    }
  };

  return (
    <group>
      {points.map((point, index) => (
        <group key={index}>
          <Sphere position={point} args={[0.08]}>
            <meshBasicMaterial color={getPointColor(index)} />
          </Sphere>
          <Text
            position={[point[0], point[1] + 0.2, point[2]]}
            fontSize={0.15}
            color={getPointColor(index)}
            anchorX="center"
            anchorY="bottom"
          >
            {index + 1}
          </Text>
        </group>
      ))}
    </group>
  );
}

// Measurement Line for Distance
function MeasurementLine({
  start,
  end,
  distance,
}: {
  start: [number, number, number];
  end: [number, number, number];
  distance: number;
}) {
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  return (
    <group>
      <Line points={[start, end]} color="red" lineWidth={3} />
      <Text
        position={[midpoint[0], midpoint[1] + 0.3, midpoint[2]]}
        fontSize={0.3}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        {distance.toFixed(2)}m
      </Text>
    </group>
  );
}

// Angle Measurement Visualization
function AngleMeasurement({
  points,
  angle,
}: {
  points: [number, number, number][];
  angle: number;
}) {
  const [p1, vertex, p2] = points;

  // Calculate vectors from vertex to the other points
  const vec1 = new THREE.Vector3(
    p1[0] - vertex[0],
    p1[1] - vertex[1],
    p1[2] - vertex[2]
  ).normalize();
  const vec2 = new THREE.Vector3(
    p2[0] - vertex[0],
    p2[1] - vertex[1],
    p2[2] - vertex[2]
  ).normalize();

  // Create arc points for visualization
  const arcRadius = 0.5;
  const angleRad = vec1.angleTo(vec2);
  const arcSteps = 20;
  const arcPoints: [number, number, number][] = [];

  // Calculate arc points
  for (let i = 0; i <= arcSteps; i++) {
    const t = i / arcSteps;
    const currentAngle = t * angleRad;

    // Rotate vec1 towards vec2
    const quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3().crossVectors(vec1, vec2).normalize(),
      currentAngle
    );

    const arcPoint = vec1.clone().applyQuaternion(quaternion).multiplyScalar(arcRadius);
    arcPoints.push([vertex[0] + arcPoint.x, vertex[1] + arcPoint.y, vertex[2] + arcPoint.z]);
  }

  // Label position (middle of arc)
  const midArcPoint = arcPoints[Math.floor(arcSteps / 2)];
  const labelOffset = 0.3;
  const labelPosition: [number, number, number] = [
    midArcPoint[0] + labelOffset,
    midArcPoint[1] + labelOffset,
    midArcPoint[2],
  ];

  return (
    <group>
      {/* Lines from vertex to points */}
      <Line points={[vertex, p1]} color="#ffaa00" lineWidth={2} opacity={0.7} />
      <Line points={[vertex, p2]} color="#ffaa00" lineWidth={2} opacity={0.7} />

      {/* Arc showing the angle */}
      <Line points={arcPoints} color="#ffaa00" lineWidth={3} />

      {/* Angle label */}
      <Text
        position={labelPosition}
        fontSize={0.25}
        color="#ffaa00"
        anchorX="center"
        anchorY="middle"
      >
        {angle.toFixed(1)}°
      </Text>
    </group>
  );
}

// Area Measurement Visualization
function AreaMeasurement({ points, area }: { points: [number, number, number][]; area: number }) {
  // Calculate center point for label
  const center: [number, number, number] = [
    points.reduce((sum, p) => sum + p[0], 0) / points.length,
    points.reduce((sum, p) => sum + p[1], 0) / points.length,
    points.reduce((sum, p) => sum + p[2], 0) / points.length,
  ];

  // Create outline points (close the shape)
  const outlinePoints = [...points, points[0]];

  return (
    <group>
      {/* Area outline */}
      <Line points={outlinePoints} color="#aa44ff" lineWidth={3} />

      {/* Semi-transparent fill (using a simpler approach) */}
      {points.length === 4 && (
        <>
          {/* First triangle */}
          <mesh>
            <bufferGeometry
              attach="geometry"
              ref={(geo) => {
                if (geo) {
                  const vertices = new Float32Array([...points[0], ...points[1], ...points[2]]);
                  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
                  geo.computeVertexNormals();
                }
              }}
            />
            <meshBasicMaterial color="#aa44ff" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>

          {/* Second triangle */}
          <mesh>
            <bufferGeometry
              attach="geometry"
              ref={(geo) => {
                if (geo) {
                  const vertices = new Float32Array([...points[0], ...points[2], ...points[3]]);
                  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
                  geo.computeVertexNormals();
                }
              }}
            />
            <meshBasicMaterial color="#aa44ff" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {/* Area label */}
      <Text
        position={[center[0], center[1] + 0.3, center[2]]}
        fontSize={0.25}
        color="#aa44ff"
        anchorX="center"
        anchorY="middle"
      >
        {area.toFixed(2)}m²
      </Text>
    </group>
  );
}

// Model Component (following working example)
function Model({ url, onLoad }: { url: string; onLoad: (group: THREE.Group) => void }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { transform, displayOptions, setModelHierarchy, setModelInfo, modelHierarchy } =
    useViewerStore();
  const [centered, setCentered] = useState(false);
  const [objectMap, setObjectMap] = useState<Map<string, THREE.Object3D>>(new Map());

  const { scene, animations } = useGLTF(url);


  useEffect(() => {
    if (groupRef.current && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(groupRef.current);
      animations.forEach(clip => {
        mixer.clipAction(clip).stop();
      });
      mixer.uncacheRoot(groupRef.current);
      console.log(`Stopped ${animations.length} built-in model animations.`);
    }
  }, [animations]); 

  // Helper function to extract hierarchy from Three.js object
  const extractHierarchy = (object: THREE.Object3D, depth = 0): ModelHierarchy => {
    const nodeId = object.uuid;

    // Determine a meaningful name with better logic
    let nodeName = object.name || "";

    // For meshes, try to get better names
    if (object instanceof THREE.Mesh) {
      if (object.material) {
        if (Array.isArray(object.material)) {
          const materialName = object.material.find((m) => m.name)?.name;
          if (materialName && !materialName.startsWith("empty_")) {
            nodeName = materialName;
          }
        } else if (
          "name" in object.material &&
          object.material.name &&
          !object.material.name.startsWith("empty_")
        ) {
          nodeName = object.material.name;
        }
      }

      // If we still have a generic name or no name, create a better one
      if (!nodeName || nodeName.startsWith("empty_") || !nodeName.trim()) {
        if (object.geometry && "type" in object.geometry) {
          nodeName = `${object.geometry.type} Mesh`;
        } else {
          nodeName = `Mesh ${depth + 1}`;
        }
      }
    } else {
      // For non-mesh objects (Groups, Scenes, etc.)
      if (!nodeName || nodeName.startsWith("empty_") || !nodeName.trim()) {
        if (object.type === "Group") {
          nodeName = `Group ${depth + 1}`;
        } else if (object.type === "Scene") {
          nodeName = `Scene ${depth + 1}`;
        } else if (object.type === "Object3D") {
          nodeName = `Object ${depth + 1}`;
        } else {
          nodeName = `${object.type} ${depth + 1}`;
        }
      }
    }

    // Filter children more intelligently
    const allChildren = object.children;

    const meaningfulChildren = allChildren.filter((child) => {
      // Include meshes always
      if (child instanceof THREE.Mesh) {
        return true;
      }

      // Include groups/objects that contain meshes somewhere in their hierarchy
      if (child.children.length > 0) {
        let hasMesh = false;
        child.traverse((obj) => {
          if (obj instanceof THREE.Mesh) hasMesh = true;
        });
        return hasMesh;
      }

      return false;
    });

    const hierarchyNode = {
      id: nodeId,
      name: nodeName,
      visible: object.visible,
      type: object.type,
      isMesh: object instanceof THREE.Mesh,
      children:
        meaningfulChildren.length > 0
          ? meaningfulChildren.map((child) => extractHierarchy(child, depth + 1))
          : undefined,
    };

    return hierarchyNode;
  };

  // Create a map of object IDs to Three.js objects for fast lookup
  const createObjectMap = (object: THREE.Object3D, map: Map<string, THREE.Object3D>) => {
    map.set(object.uuid, object);
    object.children.forEach((child) => createObjectMap(child, map));
  };

  // Extract model information from the loaded scene
  const extractModelInfo = (scene: THREE.Group, url: string) => {
    let vertexCount = 0;
    let faceCount = 0;
    const materialCount = 0;
    const materials = new Set();
    const textures = new Set();

    // Traverse the scene to count vertices, faces, materials, textures
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          const positions = child.geometry.attributes.position;
          if (positions) {
            vertexCount += positions.count;
          }

          if (child.geometry.index) {
            faceCount += child.geometry.index.count / 3;
          } else if (positions) {
            faceCount += positions.count / 3;
          }
        }

        // Count materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              materials.add(mat.uuid);
              // Count textures in material
              Object.values(mat).forEach((value) => {
                if (
                  value &&
                  typeof value === "object" &&
                  "isTexture" in value &&
                  (value as THREE.Texture).isTexture
                ) {
                  textures.add((value as THREE.Texture).uuid);
                }
              });
            });
          } else {
            materials.add(child.material.uuid);
            // Count textures in material
            Object.values(child.material).forEach((value) => {
              if (
                value &&
                typeof value === "object" &&
                "isTexture" in value &&
                (value as THREE.Texture).isTexture
              ) {
                textures.add((value as THREE.Texture).uuid);
              }
            });
          }
        }
      }
    });

    // Get bounding box
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const min = box.min.toArray();
    const max = box.max.toArray();

    // Extract file info from URL
    const fileName = url.split("/").pop() || "Unknown";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
    const format = fileExtension.toUpperCase();

    // Calculate estimated file size (this is a rough estimate)
    const estimatedSize = vertexCount * 32 + faceCount * 12 + materialCount * 1024; // rough calculation

    return {
      name: fileName.replace(/\.[^/.]+$/, ""), // Remove extension
      fileName: fileName,
      format: format,
      version: format === "GLB" || format === "GLTF" ? "2.0" : undefined,
      size: estimatedSize,
      optimized: faceCount < vertexCount, // rough heuristic
      vertices: Math.round(vertexCount),
      faces: Math.round(faceCount),
      materials: materials.size,
      textures: textures.size,
      animations: scene.animations ? scene.animations.length : 0,
      boundingBox: {
        min: min as [number, number, number],
        max: max as [number, number, number],
        size: size.toArray() as [number, number, number],
      },
      dimensions: {
        width: size.x,
        depth: size.z,
        height: size.y,
        surfaceArea: calculateSurfaceArea(scene),
        volume: calculateVolume(size),
      },
    };
  };

  // Helper function to calculate surface area (simplified)
  const calculateSurfaceArea = (scene: THREE.Group) => {
    let totalArea = 0;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        // Simplified calculation - this is a rough estimate
        const box = new THREE.Box3().setFromObject(child);
        const size = box.getSize(new THREE.Vector3());
        totalArea += 2 * (size.x * size.y + size.y * size.z + size.x * size.z);
      }
    });
    return Math.round(totalArea * 100) / 100; // Round to 2 decimal places
  };

  // Helper function to calculate volume
  const calculateVolume = (size: THREE.Vector3) => {
    return Math.round(size.x * size.y * size.z * 100) / 100;
  };

  useEffect(() => {
    if (scene && groupRef.current && !centered) {
      // Auto-center the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      scene.position.set(-center.x, -center.y, -center.z);

      // Auto-scale if needed
      const maxSize = Math.max(size.x, size.y, size.z);
      if (maxSize > 8) {
        const scale = 6 / maxSize;
        scene.scale.setScalar(scale);
      }

      groupRef.current.add(scene);
      setCentered(true);
      onLoad(groupRef.current);

      // Create object map for fast lookup
      const objMap = new Map<string, THREE.Object3D>();
      createObjectMap(scene, objMap);
      setObjectMap(objMap);

      // Extract and set hierarchy
      const hierarchy = extractHierarchy(scene);
      setModelHierarchy(hierarchy as ModelHierarchy);

      // Extract and set model info
      const modelInfo = extractModelInfo(scene, url);
      setModelInfo(modelInfo);
    }
  }, [scene, centered, onLoad, setModelHierarchy, setModelInfo, url]);

  // Apply visibility changes based on hierarchy state
  useEffect(() => {
    if (!objectMap.size || !modelHierarchy) return;

    const applyVisibilityRecursive = (hierarchyNode: ModelHierarchy) => {
      const object = objectMap.get(hierarchyNode.id);
      if (object) {
        // Apply visibility to both meshes and groups
        // const oldVisible = object.visible;
        object.visible = hierarchyNode.visible;
      } else {
        // Object not found in map, skip
      }

      // Apply to children
      if (hierarchyNode.children) {
        hierarchyNode.children.forEach((child: ModelHierarchy) => applyVisibilityRecursive(child));
      }
    };

    applyVisibilityRecursive(modelHierarchy);
  }, [modelHierarchy, objectMap]);

  useFrame(() => {
    if (groupRef.current && centered) {
      groupRef.current.position.set(
        transform.position[0],
        transform.position[1],
        transform.position[2]
      );

      groupRef.current.rotation.set(
        (transform.rotation[0] * Math.PI) / 180,
        (transform.rotation[1] * Math.PI) / 180,
        (transform.rotation[2] * Math.PI) / 180
      );

      groupRef.current.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);

      // Apply wireframe
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.castShadow = displayOptions.shadows;
          child.receiveShadow = displayOptions.shadows;

          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if ("wireframe" in mat) {
                mat.wireframe = displayOptions.wireframe;
              }
            });
          } else if ("wireframe" in child.material) {
            child.material.wireframe = displayOptions.wireframe;
          }
        }
      });
    }
  });

  return <group ref={groupRef} />;
}

// Measurement Interaction Handler
function MeasurementHandler({ modelGroup }: { modelGroup: THREE.Group | null }) {
  const { camera, raycaster } = useThree();
  const { activeTools, addMeasurementPoint } = useViewerStore();

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!activeTools.measure || !modelGroup) return;

      event.stopPropagation();

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);

      const meshes: THREE.Mesh[] = [];
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });

      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const point: [number, number, number] = [
          intersects[0].point.x,
          intersects[0].point.y,
          intersects[0].point.z,
        ];
        addMeasurementPoint(point);
      }
    },
    [activeTools.measure, modelGroup, addMeasurementPoint, camera, raycaster]
  );

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas && activeTools.measure) {
      canvas.addEventListener("click", handleClick);
      canvas.style.cursor = "crosshair";
      return () => {
        canvas.removeEventListener("click", handleClick);
        canvas.style.cursor = "default";
      };
    }
  }, [handleClick, activeTools.measure]);

  return null;
}

// ======================| Zoom Utility Functions |======================
function ZoomUtilities({ modelGroup }: { modelGroup: THREE.Group | null }) {
  const { camera, gl } = useThree();
  const { selectedMeshes } = useViewerStore();

  useEffect(() => {
    // Listen for zoom events from the store
    const handleZoomToFit = () => {
      if (!modelGroup) return;

      const box = new THREE.Box3().setFromObject(modelGroup);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);

      // Type guard for PerspectiveCamera
      const fov = (camera as THREE.PerspectiveCamera).fov || 75;
      const fovRad = fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fovRad / 2));

      cameraZ *= 1.2; // Add some padding

      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // Update controls target if available
      const parentElement = gl.domElement.parentElement as ExtendedHTMLElement | null;
      const controls = parentElement?._controlsRef;
      if (controls) {
        controls.target.copy(center);
        controls.update();
      }

      console.log("🔍 Zoomed to fit model");
    };

    const handleZoomToSelection = () => {
      if (!modelGroup || selectedMeshes.size === 0) return;

      const selectedObjects: THREE.Object3D[] = [];

      modelGroup.traverse((child) => {
        if (selectedMeshes.has(child.uuid)) {
          selectedObjects.push(child);
        }
      });

      if (selectedObjects.length === 0) return;

      const box = new THREE.Box3();
      selectedObjects.forEach((obj) => {
        const objBox = new THREE.Box3().setFromObject(obj);
        box.union(objBox);
      });

      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);

      // Type guard for PerspectiveCamera
      const fov = (camera as THREE.PerspectiveCamera).fov || 75;
      const fovRad = fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fovRad / 2));

      cameraZ *= 1.5; // Add more padding for selection

      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
      camera.updateProjectionMatrix();

      // Update controls target if available
      const parentElement = gl.domElement.parentElement as ExtendedHTMLElement | null;
      const controls = parentElement?._controlsRef;
      if (controls) {
        controls.target.copy(center);
        controls.update();
      }

      console.log(`🎯 Zoomed to ${selectedObjects.length} selected objects`);
    };

    // Override the store methods to use our implementations
    const store = useViewerStore.getState();
    store.zoomToFitModel = handleZoomToFit;
    store.zoomToSelection = handleZoomToSelection;
  }, [modelGroup, camera, gl, selectedMeshes]);

  return null;
}

// ======================| Box Zoom Overlay |======================
function BoxZoomOverlay() {
  const { zoomOptions, activeTools } = useViewerStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [boxEnd, setBoxEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!activeTools.zoom || zoomOptions.zoomType !== "box") return;

      event.preventDefault();
      event.stopPropagation();

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      const startX = event.clientX - rect.left;
      const startY = event.clientY - rect.top;

      setBoxStart({ x: startX, y: startY });
      setBoxEnd({ x: startX, y: startY });
      setIsDrawing(true);

      console.log("📦 Box zoom started at:", { x: startX, y: startY });
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawing || !boxStart) return;

      // Always get fresh canvas rect for accurate positioning
      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      const currentX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
      const currentY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));

      setBoxEnd({ x: currentX, y: currentY });

      // Debug log to see if mouse move is working
      const width = Math.abs(currentX - boxStart.x);
      const height = Math.abs(currentY - boxStart.y);
      console.log("📦 Box dragging:", { width: width.toFixed(0), height: height.toFixed(0) });
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (!isDrawing || !boxStart) return;

      // Get current mouse position for final box calculation
      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      const endX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
      const endY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));

      const finalBoxEnd = { x: endX, y: endY };

      const boxWidth = Math.abs(finalBoxEnd.x - boxStart.x);
      const boxHeight = Math.abs(finalBoxEnd.y - boxStart.y);

      console.log("📦 Box zoom completed:", {
        boxWidth: boxWidth.toFixed(0),
        boxHeight: boxHeight.toFixed(0),
        boxStart,
        finalBoxEnd,
        currentBoxEnd: boxEnd,
      });

      // Lower the minimum size threshold for easier use
      if (boxWidth > 10 && boxHeight > 10) {
        // Calculate box center and size in normalized coordinates
        const centerX = (boxStart.x + finalBoxEnd.x) / 2;
        const centerY = (boxStart.y + finalBoxEnd.y) / 2;

        // Convert to normalized device coordinates (-1 to 1)
        const ndcX = (centerX / rect.width) * 2 - 1;
        const ndcY = -(centerY / rect.height) * 2 + 1;

        // Calculate zoom factor based on box size relative to canvas
        const boxWidthNorm = boxWidth / rect.width;
        const boxHeightNorm = boxHeight / rect.height;
        const maxBoxDim = Math.max(boxWidthNorm, boxHeightNorm);

        // Zoom factor: smaller box = more zoom, with reasonable limits
        const baseZoomFactor = 1 / maxBoxDim;
        const zoomFactor = Math.max(1.5, Math.min(baseZoomFactor, 15)); // Between 1.5x and 15x

        console.log("📦 Zoom calculation:", {
          centerX: ndcX.toFixed(3),
          centerY: ndcY.toFixed(3),
          boxSize: `${boxWidthNorm.toFixed(3)} x ${boxHeightNorm.toFixed(3)}`,
          zoomFactor: zoomFactor.toFixed(2),
        });

        // Trigger box zoom event
        const boxZoomEvent = new CustomEvent("boxZoom", {
          detail: {
            centerX: ndcX,
            centerY: ndcY,
            zoomFactor: zoomFactor,
            boxWidth: boxWidthNorm,
            boxHeight: boxHeightNorm,
          },
        });

        window.dispatchEvent(boxZoomEvent);
      } else {
        console.log("📦 Box too small, zoom cancelled:", {
          required: "10x10",
          actual: `${boxWidth.toFixed(0)}x${boxHeight.toFixed(0)}`,
        });
      }

      // Reset state
      setIsDrawing(false);
      setBoxStart(null);
      setBoxEnd(null);
    };

    const canvas = document.querySelector("canvas");
    if (canvas && activeTools.zoom && zoomOptions.zoomType === "box") {
      canvas.addEventListener("mousedown", handleMouseDown, { passive: false });
      document.addEventListener("mousemove", handleMouseMove, { passive: false }); // Changed to document
      document.addEventListener("mouseup", handleMouseUp, { passive: false }); // Changed to document
      canvas.style.cursor = "crosshair";

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("mousemove", handleMouseMove); // Changed to document
        document.removeEventListener("mouseup", handleMouseUp); // Changed to document
        canvas.style.cursor = "default";
      };
    }
  }, [activeTools.zoom, zoomOptions.zoomType, isDrawing, boxStart]); // Removed canvasRect dependency

  // Render zoom box overlay
  if (isDrawing && boxStart && boxEnd) {
    const minX = Math.min(boxStart.x, boxEnd.x);
    const minY = Math.min(boxStart.y, boxEnd.y);
    const width = Math.abs(boxEnd.x - boxStart.x);
    const height = Math.abs(boxEnd.y - boxStart.y);

    return (
      <div
        className="absolute pointer-events-none border-2 border-blue-500 bg-blue-200 bg-opacity-20 rounded"
        style={{
          left: `${minX}px`,
          top: `${minY}px`,
          width: `${width}px`,
          height: `${height}px`,
          zIndex: 1000,
          position: "absolute",
        }}
      >
        {/* Corner indicators */}
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full -top-1 -left-1"></div>
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full -top-1 -right-1"></div>
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full -bottom-1 -left-1"></div>
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full -bottom-1 -right-1"></div>

        {/* Size indicator */}
        {width > 50 && height > 30 && (
          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
            {width.toFixed(0)} × {height.toFixed(0)}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ======================| Box Zoom Handler (Canvas Component) |======================
function BoxZoomHandler({ modelGroup }: { modelGroup: THREE.Group | null }) {
  const { camera, raycaster, gl } = useThree();
  const { zoomOptions, activeTools } = useViewerStore();

  useEffect(() => {
    const handleBoxZoom = (event: CustomEvent) => {
      if (!activeTools.zoom || zoomOptions.zoomType !== "box" || !modelGroup) return;

      const { centerX, centerY, zoomFactor } = event.detail;

      console.log("📦 Executing box zoom:", { centerX, centerY, zoomFactor });

      // Create raycaster from box center
      const pointer = new THREE.Vector2(centerX, centerY);
      raycaster.setFromCamera(pointer, camera);

      // Find intersection point as zoom target
      const meshes: THREE.Mesh[] = [];
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });

      const intersects = raycaster.intersectObjects(meshes, true);
      let targetPoint: THREE.Vector3;

      if (intersects.length > 0) {
        targetPoint = intersects[0].point;
      } else {
        // If no intersection, project ray to a reasonable distance
        const rayDirection = raycaster.ray.direction.clone();
        targetPoint = camera.position.clone().add(rayDirection.multiplyScalar(5));
      }

      // Calculate new camera position based on zoom factor
      const currentDistance = camera.position.distanceTo(targetPoint);
      const newDistance = currentDistance / zoomFactor;

      // Ensure new distance is within limits
      const clampedDistance = Math.max(
        Math.min(newDistance, zoomOptions.zoomLimits.max),
        zoomOptions.zoomLimits.min
      );

      // Calculate direction from target to camera
      const direction = camera.position.clone().sub(targetPoint).normalize();
      const newPosition = targetPoint.clone().add(direction.multiplyScalar(clampedDistance));

      // Animate to new position if smooth zoom is enabled
      if (zoomOptions.smoothZoom) {
        const startPosition = camera.position.clone();
        const startTime = performance.now();
        const duration = 500; // 500ms animation

        const animateZoom = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          camera.position.lerpVectors(startPosition, newPosition, easedProgress);
          camera.lookAt(targetPoint);
          camera.updateProjectionMatrix();

          // Update controls target
          const parentElement = gl.domElement.parentElement as ExtendedHTMLElement | null;
          const controls = parentElement?._controlsRef;
          if (controls) {
            const currentTarget = controls.target.clone();
            controls.target.lerpVectors(currentTarget, targetPoint, easedProgress);
            controls.update();
          }

          if (progress < 1) {
            requestAnimationFrame(animateZoom);
          }
        };

        requestAnimationFrame(animateZoom);
      } else {
        // Immediate zoom
        camera.position.copy(newPosition);
        camera.lookAt(targetPoint);
        camera.updateProjectionMatrix();

        // Update controls target
        const parentElement = gl.domElement.parentElement as ExtendedHTMLElement | null;
        const controls = parentElement?._controlsRef;
        if (controls) {
          controls.target.copy(targetPoint);
          controls.update();
        }
      }

      console.log("📦 Box zoom completed:", {
        oldDistance: currentDistance.toFixed(2),
        newDistance: clampedDistance.toFixed(2),
        zoomFactor: zoomFactor.toFixed(2),
      });
    };

    window.addEventListener("boxZoom", handleBoxZoom as EventListener);

    return () => {
      window.removeEventListener("boxZoom", handleBoxZoom as EventListener);
    };
  }, [camera, raycaster, gl, modelGroup, activeTools.zoom, zoomOptions, modelGroup]);

  return null;
}

// ======================| Region Zoom Overlay |======================
function RegionZoomOverlay() {
  const { zoomOptions, activeTools } = useViewerStore();
  const [isSelecting, setIsSelecting] = useState(false);
  const [regionPoints, setRegionPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentMouse, setCurrentMouse] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!activeTools.zoom || zoomOptions.zoomType !== "region") return;

      event.preventDefault();
      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      if (!isSelecting) {
        // Start new region
        setRegionPoints([point]);
        setIsSelecting(true);
      } else {
        // Add point to region
        setRegionPoints((prev) => [...prev, point]);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!activeTools.zoom || zoomOptions.zoomType !== "region") return;

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();

      setCurrentMouse({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    };

    const handleDoubleClick = (event: MouseEvent) => {
      if (!activeTools.zoom || zoomOptions.zoomType !== "region" || !isSelecting) return;

      event.preventDefault();

      if (regionPoints.length >= 3) {
        // Complete region and zoom
        console.log("🎯 Region zoom completed with", regionPoints.length, "points");

        // Calculate region bounds
        const minX = Math.min(...regionPoints.map((p) => p.x));
        const maxX = Math.max(...regionPoints.map((p) => p.x));
        const minY = Math.min(...regionPoints.map((p) => p.y));
        const maxY = Math.max(...regionPoints.map((p) => p.y));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const width = maxX - minX;
        const height = maxY - minY;

        const canvas = event.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();

        // Convert to normalized coordinates
        const ndcX = (centerX / rect.width) * 2 - 1;
        const ndcY = -(centerY / rect.height) * 2 + 1;

        // Calculate zoom factor
        const regionWidthNorm = width / rect.width;
        const regionHeightNorm = height / rect.height;
        const maxRegionDim = Math.max(regionWidthNorm, regionHeightNorm);
        const zoomFactor = Math.min(1 / maxRegionDim, 8);

        // Trigger region zoom event
        const regionZoomEvent = new CustomEvent("regionZoom", {
          detail: {
            centerX: ndcX,
            centerY: ndcY,
            zoomFactor: zoomFactor,
            regionPoints: regionPoints,
          },
        });

        window.dispatchEvent(regionZoomEvent);
      }

      // Reset region
      setIsSelecting(false);
      setRegionPoints([]);
      setCurrentMouse(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSelecting) {
        // Cancel region selection
        setIsSelecting(false);
        setRegionPoints([]);
        setCurrentMouse(null);
      }
    };

    const canvas = document.querySelector("canvas");
    if (canvas && activeTools.zoom && zoomOptions.zoomType === "region") {
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("dblclick", handleDoubleClick);
      document.addEventListener("keydown", handleKeyDown);
      canvas.style.cursor = "crosshair";

      return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("dblclick", handleDoubleClick);
        document.removeEventListener("keydown", handleKeyDown);
        canvas.style.cursor = "default";
      };
    }
  }, [activeTools.zoom, zoomOptions.zoomType, isSelecting, regionPoints]);

  // Render region selection overlay
  if (isSelecting && regionPoints.length > 0) {
    const allPoints = currentMouse ? [...regionPoints, currentMouse] : regionPoints;

    // Create SVG path for the region
    const pathData = allPoints.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      } else {
        return `${path} L ${point.x} ${point.y}`;
      }
    }, "");

    return (
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
        <svg className="w-full h-full">
          {/* Region outline */}
          <path
            d={pathData + (allPoints.length > 2 ? " Z" : "")}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Points */}
          {regionPoints.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Current mouse position */}
          {currentMouse && (
            <circle
              cx={currentMouse.x}
              cy={currentMouse.y}
              r="3"
              fill="#94a3b8"
              stroke="white"
              strokeWidth="1"
            />
          )}
        </svg>

        {/* Instructions */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
          {regionPoints.length < 3
            ? `Click to add points (${regionPoints.length}/3 minimum)`
            : "Double-click to complete region zoom, ESC to cancel"}
        </div>
      </div>
    );
  }

  return null;
}

// ======================| Region Zoom Handler (Canvas Component) |======================
function RegionZoomHandler({ modelGroup }: { modelGroup: THREE.Group | null }) {
  const { camera, raycaster, gl } = useThree();
  const { zoomOptions, activeTools } = useViewerStore();

  useEffect(() => {
    const handleRegionZoom = (event: CustomEvent) => {
      if (!activeTools.zoom || zoomOptions.zoomType !== "region" || !modelGroup) return;

      const { centerX, centerY, zoomFactor, regionPoints } = event.detail;

      console.log("🎯 Executing region zoom:", {
        centerX,
        centerY,
        zoomFactor,
        points: regionPoints.length,
      });

      // Create raycaster from region center
      const pointer = new THREE.Vector2(centerX, centerY);
      raycaster.setFromCamera(pointer, camera);

      // Find intersection point as zoom target
      const meshes: THREE.Mesh[] = [];
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });

      const intersects = raycaster.intersectObjects(meshes, true);
      let targetPoint: THREE.Vector3;

      if (intersects.length > 0) {
        targetPoint = intersects[0].point;
      } else {
        // If no intersection, project ray to a reasonable distance
        const rayDirection = raycaster.ray.direction.clone();
        targetPoint = camera.position.clone().add(rayDirection.multiplyScalar(5));
      }

      // Calculate new camera position based on zoom factor
      const currentDistance = camera.position.distanceTo(targetPoint);
      const newDistance = currentDistance / (zoomFactor * 0.8); // Slightly less aggressive than box zoom

      // Ensure new distance is within limits
      const clampedDistance = Math.max(
        Math.min(newDistance, zoomOptions.zoomLimits.max),
        zoomOptions.zoomLimits.min
      );

      // Calculate direction from target to camera
      const direction = camera.position.clone().sub(targetPoint).normalize();
      const newPosition = targetPoint.clone().add(direction.multiplyScalar(clampedDistance));

      // Animate to new position if smooth zoom is enabled
      if (zoomOptions.smoothZoom) {
        const startPosition = camera.position.clone();
        const startTime = performance.now();
        const duration = 600; // Slightly longer for region zoom

        const animateZoom = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          camera.position.lerpVectors(startPosition, newPosition, easedProgress);
          camera.lookAt(targetPoint);
          camera.updateProjectionMatrix();

          // Update controls target
          const parentElement = gl.domElement.parentElement as ExtendedHTMLElement | null;
          const controls = parentElement?._controlsRef;
          if (controls) {
            const currentTarget = controls.target.clone();
            controls.target.lerpVectors(currentTarget, targetPoint, easedProgress);
            controls.update();
          }

          if (progress < 1) {
            requestAnimationFrame(animateZoom);
          }
        };

        requestAnimationFrame(animateZoom);
      } else {
        // Immediate zoom
        camera.position.copy(newPosition);
        camera.lookAt(targetPoint);
        camera.updateProjectionMatrix();

        // Update controls target
        const parentElement = gl.domElement.parentElement as ExtendedHTMLElement | null;
        const controls = parentElement?._controlsRef;
        if (controls) {
          controls.target.copy(targetPoint);
          controls.update();
        }
      }

      console.log("🎯 Region zoom completed:", {
        oldDistance: currentDistance.toFixed(2),
        newDistance: clampedDistance.toFixed(2),
        zoomFactor: zoomFactor.toFixed(2),
      });
    };

    window.addEventListener("regionZoom", handleRegionZoom as EventListener);

    return () => {
      window.removeEventListener("regionZoom", handleRegionZoom as EventListener);
    };
  }, [camera, raycaster, gl, modelGroup, activeTools.zoom, zoomOptions]);

  return null;
}

// ======================| Enhanced Double Click Zoom Handler with Different Zoom Types |======================
function DoubleClickZoomHandler({ modelGroup }: { modelGroup: THREE.Group | null }) {
  const { camera, raycaster, gl, scene } = useThree();
  const { zoomOptions, activeTools } = useViewerStore();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const animationRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);

  // Advanced zoom calculation based on object size and type
  const calculateOptimalZoom = (
    intersectionPoint: THREE.Vector3,
    intersectedObject: THREE.Object3D
  ) => {
    // Get bounding box of the intersected object
    const boundingBox = new THREE.Box3().setFromObject(intersectedObject);
    const objectSize = boundingBox.getSize(new THREE.Vector3());
    const objectCenter = boundingBox.getCenter(new THREE.Vector3());

    // Calculate optimal distance based on object size (much closer for zoom in effect)
    const maxDimension = Math.max(objectSize.x, objectSize.y, objectSize.z);
    const currentDistance = camera.position.distanceTo(intersectionPoint);

    // Zoom in to a much closer distance - aim for 20-40% of current distance or based on object size
    const zoomInFactor = 0.3; // Zoom to 30% of current distance
    const minDistance = Math.max(maxDimension * 0.5, 0.2); // Minimum distance based on object size
    const maxDistance = Math.max(maxDimension * 1.5, 1.0); // Maximum distance for zoom

    // Choose the smaller of zoom factor distance or max allowed distance
    const optimalDistance = Math.max(
      Math.min(currentDistance * zoomInFactor, maxDistance),
      minDistance
    );

    console.log("📊 Distance calculation:", {
      currentDistance: currentDistance.toFixed(2),
      maxDimension: maxDimension.toFixed(2),
      optimalDistance: optimalDistance.toFixed(2),
      zoomInFactor,
    });

    // Calculate camera position - completely rewritten to avoid bottom view
    const currentPosition = camera.position.clone();
    const objectBottom = boundingBox.min.y;

    // Always ensure camera is positioned to look at the intersection point from a good angle
    // Strategy: Position camera in a sphere around the intersection point, but never below object center

    // Get current direction but ensure it's never too low
    const currentDirection = intersectionPoint.clone().sub(currentPosition).normalize();

    // Calculate a safe viewing direction
    let viewDirection = currentDirection.clone();

    // Enforce minimum elevation angle (never look from too low)
    const minElevationAngle = 15; // degrees
    const minY = Math.sin((minElevationAngle * Math.PI) / 180);

    // If the viewing direction is too low, adjust it
    if (viewDirection.y < minY) {
      console.log("🔧 Adjusting viewing angle to avoid bottom view");

      // Project the direction onto XZ plane and then add proper Y component
      const horizontalDirection = new THREE.Vector3(
        viewDirection.x,
        0,
        viewDirection.z
      ).normalize();
      viewDirection = horizontalDirection.clone();
      viewDirection.y = minY;
      viewDirection.normalize();
    }

    // Position camera at optimal distance in the safe viewing direction
    const newPosition = intersectionPoint
      .clone()
      .sub(viewDirection.multiplyScalar(optimalDistance));

    // Additional safety check: ensure camera Y is never below object center
    const minimumCameraHeight = Math.max(objectCenter.y, objectBottom + objectSize.y * 0.1);
    if (newPosition.y < minimumCameraHeight) {
      console.log("🔧 Enforcing minimum camera height");
      newPosition.y = minimumCameraHeight;

      // Recalculate distance to maintain proper framing
      const adjustedDistance = newPosition.distanceTo(intersectionPoint);
      if (adjustedDistance > optimalDistance * 1.5) {
        // If we're too far due to height adjustment, move closer horizontally
        const horizontalDirection = intersectionPoint.clone().sub(newPosition);
        horizontalDirection.y = 0;
        horizontalDirection.normalize();

        newPosition.x = intersectionPoint.x - horizontalDirection.x * optimalDistance * 0.8;
        newPosition.z = intersectionPoint.z - horizontalDirection.z * optimalDistance * 0.8;
      }
    }

    console.log("📐 Camera positioning:", {
      intersectionY: intersectionPoint.y.toFixed(2),
      objectCenterY: objectCenter.y.toFixed(2),
      objectBottom: objectBottom.toFixed(2),
      cameraY: newPosition.y.toFixed(2),
      viewAngle: ((Math.asin(viewDirection.y) * 180) / Math.PI).toFixed(1) + "°",
    });

    return {
      position: newPosition,
      target: intersectionPoint,
      distance: optimalDistance,
      objectSize: maxDimension,
    };
  };

  // Check for obstacles in camera path
  const checkCameraPath = (
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    targetPos: THREE.Vector3
  ) => {
    if (!modelGroup) return { position: endPos, hasObstacle: false };

    const direction = endPos.clone().sub(startPos).normalize();
    const distance = startPos.distanceTo(endPos);

    // Cast ray from start to end position
    raycaster.set(startPos, direction);
    const meshes: THREE.Mesh[] = [];
    modelGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child);
    });

    const intersects = raycaster.intersectObjects(meshes, true);

    // If there's an obstacle, find alternative position
    if (intersects.length > 0 && intersects[0].distance < distance * 0.9) {
      console.log("🚧 Obstacle detected, finding alternative position");

      // Get model bounding box for better alternative positioning
      const modelBox = new THREE.Box3().setFromObject(modelGroup);
      const modelSize = modelBox.getSize(new THREE.Vector3());

      // Try multiple alternative positions with bias towards good viewing angles
      const alternatives = [
        { offset: new THREE.Vector3(0, modelSize.y * 0.8, 0), weight: 1.0, priority: 1 }, // High above
        {
          offset: new THREE.Vector3(modelSize.x * 0.5, modelSize.y * 0.6, 0),
          weight: 0.9,
          priority: 2,
        }, // Right-above
        {
          offset: new THREE.Vector3(-modelSize.x * 0.5, modelSize.y * 0.6, 0),
          weight: 0.9,
          priority: 2,
        }, // Left-above
        {
          offset: new THREE.Vector3(0, modelSize.y * 0.4, modelSize.z * 0.7),
          weight: 0.8,
          priority: 3,
        }, // Front-above
        {
          offset: new THREE.Vector3(0, modelSize.y * 0.4, -modelSize.z * 0.7),
          weight: 0.8,
          priority: 3,
        }, // Back-above
        {
          offset: new THREE.Vector3(modelSize.x * 0.4, modelSize.y * 0.4, modelSize.z * 0.4),
          weight: 0.7,
          priority: 4,
        }, // Diagonal
      ];

      // Sort by priority (higher priority first)
      alternatives.sort((a, b) => a.priority - b.priority);

      for (const alt of alternatives) {
        // Create direction that ensures we look down at the target from above
        const altDirection = alt.offset.clone().normalize();

        // Ensure the direction has a strong downward component (looking down at target)
        if (altDirection.y < 0.3) {
          altDirection.y = 0.3 + Math.abs(altDirection.y) * 0.5;
          altDirection.normalize();
        }

        const altDistance = distance * alt.weight;
        const altPosition = targetPos.clone().add(altDirection.multiplyScalar(altDistance));

        // Ensure alternative position is well above model
        const modelTop = modelBox.max.y;
        const minimumAltHeight = modelTop + modelSize.y * 0.2;
        if (altPosition.y < minimumAltHeight) {
          altPosition.y = minimumAltHeight;
        }

        // Test this alternative
        raycaster.set(startPos, altPosition.clone().sub(startPos).normalize());
        const altIntersects = raycaster.intersectObjects(meshes, true);
        const altDistanceToCheck = startPos.distanceTo(altPosition);

        if (altIntersects.length === 0 || altIntersects[0].distance > altDistanceToCheck * 0.9) {
          return { position: altPosition, hasObstacle: true };
        }
      }

      // If all alternatives fail, use a safe overhead position
      const safePosition = targetPos
        .clone()
        .add(new THREE.Vector3(0, distance * 0.8, distance * 0.3));
      return { position: safePosition, hasObstacle: true };
    }

    return { position: endPos, hasObstacle: false };
  };

  // Advanced easing functions
  const easingFunctions = {
    easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    easeOutElastic: (t: number) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
  };

  // Focus indicator for showing zoom target
  const createFocusIndicator = (position: THREE.Vector3) => {
    const focusGeometry = new THREE.RingGeometry(0.1, 0.15, 16);
    const focusMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const focusRing = new THREE.Mesh(focusGeometry, focusMaterial);
    focusRing.position.copy(position);
    focusRing.lookAt(camera.position);

    scene.add(focusRing);

    // Animate focus indicator
    let pulseTime = 0;
    const animateFocus = () => {
      pulseTime += 0.1;
      const scale = 1 + Math.sin(pulseTime) * 0.3;
      focusRing.scale.setScalar(scale);
      focusRing.lookAt(camera.position);

      if (pulseTime < Math.PI * 4) {
        // 2 full pulses
        requestAnimationFrame(animateFocus);
      } else {
        scene.remove(focusRing);
        focusGeometry.dispose();
        focusMaterial.dispose();
      }
    };
    animateFocus();
  };

  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      // Only handle double-click zoom if the zoom type is set to doubleClick
      if (
        !modelGroup ||
        isAnimatingRef.current ||
        !activeTools.zoom ||
        zoomOptions.zoomType !== "doubleClick"
      )
        return;

      console.log("🎯 Advanced double-click zoom initiated");

      // Cancel any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);

      const meshes: THREE.Mesh[] = [];
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });

      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const intersection = intersects[0];
        const intersectionPoint = intersection.point;
        const intersectedObject = intersection.object;

        console.log("🎯 Target acquired:", {
          point: intersectionPoint,
          object: intersectedObject.name || "Unnamed Object",
          currentDistance: camera.position.distanceTo(intersectionPoint),
          action: "ZOOM IN",
        });

        // Create focus indicator
        createFocusIndicator(intersectionPoint);

        // Calculate optimal zoom IN
        const zoomData = calculateOptimalZoom(intersectionPoint, intersectedObject);

        // Verify we're actually zooming in (getting closer)
        const currentDistance = camera.position.distanceTo(intersectionPoint);
        if (zoomData.distance >= currentDistance * 0.9) {
          // If calculated distance is not significantly closer, force a closer zoom
          const forceCloseDistance = Math.min(currentDistance * 0.25, 1.0);
          const directionToTarget = intersectionPoint.clone().sub(camera.position).normalize();
          zoomData.position = intersectionPoint
            .clone()
            .sub(directionToTarget.multiplyScalar(forceCloseDistance));
          zoomData.distance = forceCloseDistance;
          console.log("🔧 Forced closer zoom:", forceCloseDistance);
        }

        // Check for obstacles and adjust path
        const pathData = checkCameraPath(camera.position, zoomData.position, zoomData.target);

        // Final safety check: ensure the final position doesn't create a bottom view
        const finalPosition = pathData.position;
        const finalTarget = zoomData.target;
        const finalDirection = finalTarget.clone().sub(finalPosition).normalize();

        // If we're looking up (negative Y direction), adjust the camera position
        if (finalDirection.y < -0.1) {
          console.log("🚨 Final safety check: preventing bottom view");

          // Get model bounds for safe positioning
          const modelBounds = new THREE.Box3().setFromObject(modelGroup);
          const modelTop = modelBounds.max.y;
          const modelSize = modelBounds.getSize(new THREE.Vector3());

          // Position camera above the model looking down
          const safeHeight = Math.max(modelTop + modelSize.y * 0.3, finalTarget.y + 1.0);
          pathData.position.y = safeHeight;

          // Adjust distance to maintain good framing
          const horizontalDistance = Math.sqrt(
            Math.pow(pathData.position.x - finalTarget.x, 2) +
              Math.pow(pathData.position.z - finalTarget.z, 2)
          );

          if (horizontalDistance < zoomData.distance * 0.5) {
            // Move camera further horizontally to maintain proper zoom level
            const horizontalDir = new THREE.Vector3(
              pathData.position.x - finalTarget.x,
              0,
              pathData.position.z - finalTarget.z
            ).normalize();

            const targetHorizontalDistance = zoomData.distance * 0.7;
            pathData.position.x = finalTarget.x + horizontalDir.x * targetHorizontalDistance;
            pathData.position.z = finalTarget.z + horizontalDir.z * targetHorizontalDistance;
          }
        }

        console.log("📊 Zoom calculation:", {
          currentDistance: currentDistance.toFixed(2),
          newDistance: zoomData.distance.toFixed(2),
          zoomRatio: (zoomData.distance / currentDistance).toFixed(2),
          objectSize: zoomData.objectSize.toFixed(2),
          hasObstacle: pathData.hasObstacle,
          finalPosition: pathData.position,
        });

        // Disable controls during animation
        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }

        isAnimatingRef.current = true;

        // Animation parameters
        const startPosition = camera.position.clone();
        const endPosition = pathData.position;
        const startTarget = controlsRef.current?.target.clone() || new THREE.Vector3(0, 0, 0);
        const endTarget = zoomData.target;

        // Ensure we're actually moving closer to the target
        const startDistance = startPosition.distanceTo(endTarget);
        const endDistance = endPosition.distanceTo(endTarget);

        console.log("🎬 Animation setup:", {
          startDistance: startDistance.toFixed(2),
          endDistance: endDistance.toFixed(2),
          isZoomingIn: endDistance < startDistance,
          movementVector: endPosition.clone().sub(startPosition).length().toFixed(2),
        });

        const startTime = performance.now();
        const animationDuration = pathData.hasObstacle ? 1200 : 800; // Slightly faster for zoom in
        const easingFunction = easingFunctions.easeOutCubic; // Smoother for zoom in

        // Advanced camera animation with multiple phases
        const animateCamera = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);

          // Apply easing
          const easedProgress = easingFunction(progress);

          // Multi-phase animation for obstacle avoidance
          let positionProgress = easedProgress;
          let targetProgress = easedProgress;

          if (pathData.hasObstacle && progress < 0.6) {
            // First phase: move up/away to avoid obstacles
            positionProgress = easedProgress * 1.4;
            targetProgress = easedProgress * 0.7;
          }

          // Interpolate camera position
          camera.position.lerpVectors(startPosition, endPosition, Math.min(positionProgress, 1));

          // Interpolate look-at target
          const currentTarget = startTarget.clone().lerp(endTarget, Math.min(targetProgress, 1));
          camera.lookAt(currentTarget);
          camera.updateProjectionMatrix();

          // Add subtle camera shake for impact (only in final 10% of animation)
          if (progress > 0.9) {
            const shakeIntensity = (1 - progress) * 0.02; // Decreasing shake
            const shake = new THREE.Vector3(
              (Math.random() - 0.5) * shakeIntensity,
              (Math.random() - 0.5) * shakeIntensity,
              (Math.random() - 0.5) * shakeIntensity
            );
            camera.position.add(shake);
          }

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animateCamera);
          } else {
            // Animation complete
            isAnimatingRef.current = false;

            // Re-enable controls and update target
            if (controlsRef.current) {
              controlsRef.current.target.copy(endTarget);
              controlsRef.current.enabled = true;
              controlsRef.current.update();
            }

            console.log(
              "✅ Zoom IN complete! Final distance:",
              camera.position.distanceTo(endTarget).toFixed(2)
            );

            // Optional: Add a subtle "arrival" effect
            const arrivalRing = new THREE.RingGeometry(0.05, 0.08, 12);
            const arrivalMaterial = new THREE.MeshBasicMaterial({
              color: 0x00ff88,
              transparent: true,
              opacity: 0.6,
            });
            const arrivalIndicator = new THREE.Mesh(arrivalRing, arrivalMaterial);
            arrivalIndicator.position.copy(endTarget);
            arrivalIndicator.lookAt(camera.position);
            scene.add(arrivalIndicator);

            // Fade out arrival indicator
            let fadeTime = 0;
            const fadeOut = () => {
              fadeTime += 0.05;
              arrivalMaterial.opacity = Math.max(0.6 - fadeTime, 0);
              if (arrivalMaterial.opacity > 0) {
                requestAnimationFrame(fadeOut);
              } else {
                scene.remove(arrivalIndicator);
                arrivalRing.dispose();
                arrivalMaterial.dispose();
              }
            };
            setTimeout(fadeOut, 300);
          }
        };

        animationRef.current = requestAnimationFrame(animateCamera);
      } else {
        console.log("❌ No target found for zoom");

        // Show "no target" indicator
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Create temporary visual feedback
        const feedback = document.createElement("div");
        feedback.style.position = "absolute";
        feedback.style.left = clickX + "px";
        feedback.style.top = clickY + "px";
        feedback.style.width = "20px";
        feedback.style.height = "20px";
        feedback.style.borderRadius = "50%";
        feedback.style.border = "2px solid #ff4444";
        feedback.style.backgroundColor = "rgba(255, 68, 68, 0.2)";
        feedback.style.pointerEvents = "none";
        feedback.style.zIndex = "1000";
        feedback.style.transform = "translate(-50%, -50%)";
        feedback.style.animation = "ping 0.5s ease-out";

        canvas.parentElement?.appendChild(feedback);
        setTimeout(() => feedback.remove(), 500);
      }
    },
    [modelGroup, camera, raycaster, scene, gl, activeTools.zoom, zoomOptions.zoomType]
  );

  useEffect(() => {
    const canvas = gl.domElement;
    if (canvas) {
      console.log("🎯 Advanced double-click zoom handler attached");

      canvas.addEventListener("dblclick", handleDoubleClick, {
        capture: true,
        passive: false,
      });

      return () => {
        console.log("🎯 Advanced double-click zoom handler detached");
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        canvas.removeEventListener("dblclick", handleDoubleClick, { capture: true });
      };
    }
  }, [handleDoubleClick, gl]);

  // Store controls reference
  useEffect(() => {
    const parentElement = gl.domElement.parentElement as ExtendedHTMLElement | null;
    const controls = parentElement?._controlsRef;
    if (controls) {
      controlsRef.current = controls;
    }
  }, [gl]);

  return null;
}

// ======================| Zoom Control Panel |======================
function ZoomControlPanel() {
  const {
    activeTools,
    zoomOptions,
    setZoomType,
    setZoomOption,
    zoomToFitModel,
    zoomToSelection,
    selectedMeshes,
    isFullscreen,
  } = useViewerStore();

  // State to control panel visibility
  const [isZoomPanelVisible, setIsZoomPanelVisible] = useState(false);

  // Keyboard shortcut handler for cycling zoom modes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "z" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Only handle if not typing in an input field
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true"
        ) {
          return;
        }

        event.preventDefault();

        const zoomModes: Array<"scroll" | "doubleClick" | "box" | "region"> = [
          "scroll",
          "doubleClick",
          "box",
          "region",
        ];
        const currentIndex = zoomModes.indexOf(zoomOptions.zoomType);
        const nextIndex = (currentIndex + 1) % zoomModes.length;
        setZoomType(zoomModes[nextIndex]);

        // Visual feedback
        const canvas = document.querySelector("canvas");
        if (canvas) {
          const feedback = document.createElement("div");
          feedback.innerHTML = `
            <div class="flex items-center gap-2 text-sm font-bold">
              <span class="text-lg">${
                zoomModes[nextIndex] === "scroll"
                  ? "📡"
                  : zoomModes[nextIndex] === "doubleClick"
                  ? "👆"
                  : zoomModes[nextIndex] === "box"
                  ? "⬜"
                  : "🎯"
              }</span>
              <span>${zoomModes[nextIndex].toUpperCase()} MODE</span>
            </div>
          `;
          feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${isFullscreen ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.95)"};
            color: ${isFullscreen ? "white" : "black"};
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(12px);
            border: 1px solid ${isFullscreen ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"};
            animation: slideDown 0.3s ease-out;
          `;

          document.body.appendChild(feedback);
          setTimeout(() => feedback.remove(), 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomOptions.zoomType, setZoomType, isFullscreen]);

  if (!activeTools.zoom) return null;

  const handleZoomSpeedChange = (speed: number) => {
    setZoomOption("zoomSpeed", speed);
  };

  return (
    <>
      {/* Main Toggle Button - Enhanced with better design and progress indicator */}
      <button
        onClick={() => setIsZoomPanelVisible(!isZoomPanelVisible)}
        className={`group absolute left-4 top-1/2 -translate-y-1/2 z-30 w-16 h-16 rounded-full shadow-xl transition-all duration-300 border-2 overflow-hidden ${
          isFullscreen
            ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 border-gray-600"
            : "bg-gradient-to-br from-white to-gray-50 text-gray-700 hover:from-gray-50 hover:to-white border-gray-300 hover:border-blue-400"
        } ${isZoomPanelVisible ? "transform translate-x-[340px] rotate-180" : "hover:scale-105"}`}
        title={isZoomPanelVisible ? "Hide Zoom Controls" : "Show Zoom Controls"}
      >
        {/* Speed progress ring */}
        {/* <svg className="absolute inset-1 w-14 h-14 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
            fill="none"
            stroke={isFullscreen ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.8)"}
            strokeWidth="2"
          />
          <path
            d="M18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
            fill="none"
            stroke={
              zoomOptions.zoomSpeed > 1.5
                ? "#ef4444"
                : zoomOptions.zoomSpeed < 0.5
                ? "#f59e0b"
                : "#10b981"
            }
            strokeWidth="2"
            strokeDasharray={`${((zoomOptions.zoomSpeed - 0.1) / 1.9) * 100}, 100`}
            className="transition-all duration-500"
          />
        </svg> */}

        <div className="flex flex-col items-center justify-center relative z-10">
          {isZoomPanelVisible ? (
            <>
              <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                ←
              </span>
              <span className="text-[7px] font-bold tracking-wide">HIDE</span>
            </>
          ) : (
            <>
              <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                🔍
              </span>
              <span className="text-[7px] font-bold tracking-wide">ZOOM</span>
            </>
          )}
        </div>

        {/* Pulse animation when panel is closed */}
        {!isZoomPanelVisible && (
          <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-0 group-hover:opacity-60 animate-ping"></div>
        )}

        {/* Keyboard shortcut hint */}
        {!isZoomPanelVisible && (
          <div
            className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isFullscreen ? "bg-black text-white" : "bg-gray-800 text-white"
            }`}
          >
            Press Z
          </div>
        )}
      </button>

      {/* Quick Access Bar - Enhanced with better spacing and animations */}
      {!isZoomPanelVisible && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 translate-x-24 z-20 flex flex-col gap-3">
          {/* Zoom to Fit Button */}
          <div className="group relative">
            <button
              onClick={zoomToFitModel}
              className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
                isFullscreen
                  ? "bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600"
                  : "bg-gradient-to-br from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 border border-green-300"
              }`}
              title="Zoom to Fit Model"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-lg">🏠</span>
                <span className="text-[6px] font-bold">FIT</span>
              </div>
            </button>
            {/* Tooltip */}
            <div
              className={`absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                isFullscreen ? "bg-black text-white" : "bg-gray-800 text-white"
              }`}
            >
              Zoom to Fit Model
            </div>
          </div>

          {/* Zoom to Selection Button - Only show when there's a selection */}
          {selectedMeshes.size > 0 && (
            <div className="group relative animate-fadeIn">
              <button
                onClick={zoomToSelection}
                className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 relative ${
                  isFullscreen
                    ? "bg-gradient-to-br from-orange-600 to-orange-700 text-white hover:from-orange-500 hover:to-orange-600"
                    : "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 hover:from-orange-200 hover:to-orange-300 border border-orange-300"
                }`}
                title={`Zoom to Selection (${selectedMeshes.size} objects)`}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-lg">🎯</span>
                  <span className="text-[6px] font-bold">SEL</span>
                </div>
                {/* Selection count badge */}
                <div
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isFullscreen ? "bg-white text-orange-600" : "bg-orange-600 text-white"
                  }`}
                >
                  {selectedMeshes.size}
                </div>
              </button>
              {/* Tooltip */}
              <div
                className={`absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
                  isFullscreen ? "bg-black text-white" : "bg-gray-800 text-white"
                }`}
              >
                Zoom to {selectedMeshes.size} selected object{selectedMeshes.size > 1 ? "s" : ""}
              </div>
            </div>
          )}

          {/* Current zoom mode indicator - Enhanced */}
          <div className="group relative">
            <div
              className={`w-12 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all duration-300 border-2 ${
                isFullscreen
                  ? "bg-blue-900 bg-opacity-80 text-blue-200 border-blue-600 hover:bg-blue-800"
                  : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
              }`}
            >
              <div className="text-sm">
                {zoomOptions.zoomType === "scroll" && "📡"}
                {zoomOptions.zoomType === "doubleClick" && "👆"}
                {zoomOptions.zoomType === "box" && "⬜"}
                {zoomOptions.zoomType === "region" && "🎯"}
              </div>
              <div className="text-[8px] font-extrabold tracking-wider">
                {zoomOptions.zoomType === "scroll" && "SCR"}
                {zoomOptions.zoomType === "doubleClick" && "DBL"}
                {zoomOptions.zoomType === "box" && "BOX"}
                {zoomOptions.zoomType === "region" && "REG"}
              </div>
            </div>
            {/* Enhanced Tooltip with mode description */}
            <div
              className={`absolute left-14 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 ${
                isFullscreen
                  ? "bg-black text-white border border-gray-600"
                  : "bg-gray-900 text-white"
              }`}
            >
              <div className="font-bold mb-1">
                {zoomOptions.zoomType === "scroll" && "Scroll Wheel Zoom"}
                {zoomOptions.zoomType === "doubleClick" && "Double Click Zoom"}
                {zoomOptions.zoomType === "box" && "Box Selection Zoom"}
                {zoomOptions.zoomType === "region" && "Region Area Zoom"}
              </div>
              <div className="text-[10px] opacity-80">
                {zoomOptions.zoomType === "scroll" && "Use mouse wheel to zoom"}
                {zoomOptions.zoomType === "doubleClick" && "Double-click objects to focus"}
                {zoomOptions.zoomType === "box" && "Drag to create zoom box"}
                {zoomOptions.zoomType === "region" && "Click points, double-click to zoom"}
              </div>
              {/* Keyboard shortcut hint */}
              <div
                className={`mt-1 px-2 py-1 rounded text-[9px] font-bold ${
                  isFullscreen ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                }`}
              >
                Press Z to cycle modes
              </div>
            </div>
          </div>

          {/* Speed indicator */}
          <div
            className={`w-12 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300 ${
              zoomOptions.zoomSpeed > 1.5
                ? isFullscreen
                  ? "bg-red-900 bg-opacity-60 text-red-200 border border-red-600"
                  : "bg-red-100 text-red-700 border border-red-300"
                : zoomOptions.zoomSpeed < 0.5
                ? isFullscreen
                  ? "bg-orange-900 bg-opacity-60 text-orange-200 border border-orange-600"
                  : "bg-orange-100 text-orange-700 border border-orange-300"
                : isFullscreen
                ? "bg-green-900 bg-opacity-60 text-green-200 border border-green-600"
                : "bg-green-100 text-green-700 border border-green-300"
            }`}
          >
            {zoomOptions.zoomSpeed.toFixed(1)}x
          </div>
        </div>
      )}

      {/* Enhanced Zoom Controls Panel */}
      {isZoomPanelVisible && (
        <div
          className={`absolute left-24 top-1/2 -translate-y-1/2 z-20 rounded-xl p-6 shadow-2xl min-w-[340px] max-w-[400px] backdrop-blur-lg transition-all duration-500 animate-slideIn ${
            isFullscreen
              ? "bg-gray-900 bg-opacity-95 text-white border border-gray-700"
              : "bg-white bg-opacity-98 backdrop-blur-sm border border-gray-200 shadow-xl"
          }`}
          style={{
            boxShadow: isFullscreen
              ? "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)"
              : "0 20px 50px rgba(0, 0, 0, 0.15), 0 0 20px rgba(59, 130, 246, 0.1)",
          }}
        >
          {/* Enhanced Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
              <h3 className={`text-lg font-bold ${isFullscreen ? "text-white" : "text-gray-800"}`}>
                Zoom Controls
              </h3>
              <div
                className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  isFullscreen
                    ? "bg-blue-900 bg-opacity-60 text-blue-200"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                ACTIVE
              </div>
            </div>
            <button
              onClick={() => setIsZoomPanelVisible(false)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110 ${
                isFullscreen
                  ? "bg-red-900 bg-opacity-60 text-red-200 hover:bg-red-800 hover:bg-opacity-80"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
              }`}
              title="Close Panel"
            >
              ✕
            </button>
          </div>

          {/* Zoom Type Selection - Enhanced with icons and descriptions */}
          <div className="mb-6">
            <label
              className={`text-sm font-bold mb-3 block ${
                isFullscreen ? "text-gray-200" : "text-gray-700"
              }`}
            >
              🎯 Zoom Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: "scroll", icon: "�", label: "Scroll", desc: "Mouse wheel zoom" },
                {
                  type: "doubleClick",
                  icon: "👆",
                  label: "Double Click",
                  desc: "Smart focus zoom",
                },
                { type: "box", icon: "⬜", label: "Box Zoom", desc: "Drag to zoom area" },
                { type: "region", icon: "🎯", label: "Region", desc: "Multi-point area" },
              ].map(({ type, icon, label, desc }) => (
                <button
                  key={type}
                  onClick={() => setZoomType(type as "scroll" | "doubleClick" | "box" | "region")}
                  className={`p-3 rounded-lg text-left transition-all duration-200 hover:scale-105 border-2 ${
                    zoomOptions.zoomType === type
                      ? isFullscreen
                        ? "bg-blue-900 bg-opacity-60 border-blue-500 text-blue-200 shadow-lg"
                        : "bg-blue-50 border-blue-400 text-blue-800 shadow-md"
                      : isFullscreen
                      ? "bg-gray-800 bg-opacity-60 border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{icon}</span>
                    <span className="font-bold text-sm">{label}</span>
                  </div>
                  <div className="text-[10px] opacity-80">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Zoom Speed Control */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label
                className={`text-sm font-bold ${isFullscreen ? "text-gray-200" : "text-gray-700"}`}
              >
                ⚡ Speed: {zoomOptions.zoomSpeed.toFixed(1)}x
              </label>
              <div
                className={`px-2 py-1 rounded text-xs font-bold ${
                  zoomOptions.zoomSpeed > 1.5
                    ? isFullscreen
                      ? "bg-red-900 text-red-200"
                      : "bg-red-100 text-red-700"
                    : zoomOptions.zoomSpeed < 0.5
                    ? isFullscreen
                      ? "bg-orange-900 text-orange-200"
                      : "bg-orange-100 text-orange-700"
                    : isFullscreen
                    ? "bg-green-900 text-green-200"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {zoomOptions.zoomSpeed > 1.5
                  ? "FAST"
                  : zoomOptions.zoomSpeed < 0.5
                  ? "SLOW"
                  : "NORMAL"}
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={zoomOptions.zoomSpeed}
                onChange={(e) => handleZoomSpeedChange(parseFloat(e.target.value))}
                className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-200 ${
                  isFullscreen ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                }`}
                style={{
                  background: `linear-gradient(to right, ${
                    isFullscreen ? "#3b82f6" : "#60a5fa"
                  } 0%, ${isFullscreen ? "#3b82f6" : "#60a5fa"} ${
                    ((zoomOptions.zoomSpeed - 0.1) / 1.9) * 100
                  }%, ${isFullscreen ? "#374151" : "#e5e7eb"} ${
                    ((zoomOptions.zoomSpeed - 0.1) / 1.9) * 100
                  }%, ${isFullscreen ? "#374151" : "#e5e7eb"} 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                <span>🐌 Slow</span>
                <span>⚡ Fast</span>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="mb-6">
            <label
              className={`text-sm font-bold mb-3 block ${
                isFullscreen ? "text-gray-200" : "text-gray-700"
              }`}
            >
              🚀 Quick Actions
            </label>
            <div className="space-y-3">
              <button
                onClick={zoomToFitModel}
                className={`w-full p-3 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105 flex items-center gap-3 ${
                  isFullscreen
                    ? "bg-green-900 bg-opacity-60 text-green-200 hover:bg-green-800 border border-green-600"
                    : "bg-green-50 text-green-800 hover:bg-green-100 border border-green-300"
                }`}
              >
                <span className="text-lg">🏠</span>
                <div className="text-left">
                  <div>Zoom to Fit Model</div>
                  <div className="text-[10px] opacity-80">Show entire 3D model</div>
                </div>
              </button>

              {selectedMeshes.size > 0 && (
                <button
                  onClick={zoomToSelection}
                  className={`w-full p-3 rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105 flex items-center gap-3 relative animate-fadeIn ${
                    isFullscreen
                      ? "bg-orange-900 bg-opacity-60 text-orange-200 hover:bg-orange-800 border border-orange-600"
                      : "bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-300"
                  }`}
                >
                  <span className="text-lg">🎯</span>
                  <div className="text-left flex-1">
                    <div>Zoom to Selection</div>
                    <div className="text-[10px] opacity-80">
                      Focus on {selectedMeshes.size} selected object
                      {selectedMeshes.size > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      isFullscreen ? "bg-white text-orange-800" : "bg-orange-600 text-white"
                    }`}
                  >
                    {selectedMeshes.size}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Options */}
          <div className="space-y-4">
            <label
              className={`text-sm font-bold block ${
                isFullscreen ? "text-gray-200" : "text-gray-700"
              }`}
            >
              ⚙️ Advanced Options
            </label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌊 Smooth Zoom</span>
                <div className="text-[10px] opacity-60">Animated transitions</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={zoomOptions.smoothZoom}
                  onChange={(e) => setZoomOption("smoothZoom", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏠 Auto Zoom to Fit</span>
                <div className="text-[10px] opacity-60">Zoom to fit on load</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={zoomOptions.zoomToFit}
                  onChange={(e) => setZoomOption("zoomToFit", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎯 Auto Zoom to Selection</span>
                <div className="text-[10px] opacity-60">Auto zoom when selecting</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={zoomOptions.zoomToSelection}
                  onChange={(e) => setZoomOption("zoomToSelection", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Enhanced Status Info */}
          <div
            className={`mt-6 p-4 rounded-lg border-2 border-dashed transition-all duration-300 ${
              isFullscreen
                ? "bg-gray-800 bg-opacity-60 border-gray-600 text-gray-300"
                : "bg-gray-50 border-gray-300 text-gray-600"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">📊 Current Mode:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  isFullscreen ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                }`}
              >
                {zoomOptions.zoomType.toUpperCase()}
              </span>
            </div>
            <div className="text-xs leading-relaxed">
              {zoomOptions.zoomType === "scroll" && "🖱️ Use mouse wheel to zoom in/out"}
              {zoomOptions.zoomType === "doubleClick" && "👆 Double-click objects to focus zoom"}
              {zoomOptions.zoomType === "box" && "⬜ Click and drag to create zoom box"}
              {zoomOptions.zoomType === "region" &&
                "🎯 Click points to define zoom region, double-click to zoom"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ======================| Blender-like Selection Handler with Face/Edge/Vertex support |======================
function BlenderSelectionHandler({ modelGroup }: { modelGroup: THREE.Group | null }) {
  const { camera, raycaster } = useThree();
  const {
    selectionMode,
    selectedMeshes,
    addSelectedMesh,
    removeSelectedMesh,
    clearSelectedMeshes,
  } = useViewerStore();

  const handleClick = useCallback(
    (event: MouseEvent) => {
      // Don't handle selection if no selection tool is active
      if (!Object.values(selectionMode).some(Boolean) || !modelGroup) return;

      event.stopPropagation();

      const canvas = event.target as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(pointer, camera);

      const meshes: THREE.Mesh[] = [];
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });

      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object as THREE.Mesh;
        const intersection = intersects[0];

        // Handle different selection modes like Blender
        if (selectionMode.select) {
          // Object selection - select entire mesh
          const objectId = intersectedObject.uuid;
          if (selectedMeshes.has(objectId)) {
            removeSelectedMesh(objectId);
          } else {
            if (!event.ctrlKey && !event.metaKey) {
              clearSelectedMeshes();
            }
            addSelectedMesh(objectId);
          }
        } else if (selectionMode.face) {
          // Face selection - select specific face
          const faceId = `${intersectedObject.uuid}_face_${intersection.faceIndex}`;
          if (selectedMeshes.has(faceId)) {
            removeSelectedMesh(faceId);
          } else {
            if (!event.ctrlKey && !event.metaKey) {
              clearSelectedMeshes();
            }
            addSelectedMesh(faceId);
          }
        } else if (selectionMode.edge) {
          // Edge selection - find closest edge
          if (intersection.faceIndex !== undefined && intersectedObject.geometry) {
            // const geometry = intersectedObject.geometry;
            const face = intersection.faceIndex;

            // Get the three edges of the triangle face
            const edgeIds = [
              `${intersectedObject.uuid}_edge_${face}_0`,
              `${intersectedObject.uuid}_edge_${face}_1`,
              `${intersectedObject.uuid}_edge_${face}_2`,
            ];

            // For simplicity, select the first edge (in real Blender, it would be closest to click)
            const edgeId = edgeIds[0];
            if (selectedMeshes.has(edgeId)) {
              removeSelectedMesh(edgeId);
            } else {
              if (!event.ctrlKey && !event.metaKey) {
                clearSelectedMeshes();
              }
              addSelectedMesh(edgeId);
            }
          }
        } else if (selectionMode.vertex) {
          // Vertex selection - find closest vertex
          if (intersection.faceIndex !== undefined && intersectedObject.geometry) {
            const geometry = intersectedObject.geometry;
            const positions = geometry.attributes.position;
            const face = intersection.faceIndex!;

            // Get the three vertices of the triangle face
            const vertexIndices = geometry.index
              ? [
                  geometry.index.getX(face * 3),
                  geometry.index.getX(face * 3 + 1),
                  geometry.index.getX(face * 3 + 2),
                ]
              : [face * 3, face * 3 + 1, face * 3 + 2];

            // Find closest vertex to intersection point
            let closestVertexIndex = vertexIndices[0];
            let minDistance = Infinity;

            vertexIndices.forEach((vertexIndex) => {
              const vertex = new THREE.Vector3(
                positions.getX(vertexIndex),
                positions.getY(vertexIndex),
                positions.getZ(vertexIndex)
              );
              vertex.applyMatrix4(intersectedObject.matrixWorld);
              const distance = vertex.distanceTo(intersection.point);
              if (distance < minDistance) {
                minDistance = distance;
                closestVertexIndex = vertexIndex;
              }
            });

            const vertexId = `${intersectedObject.uuid}_vertex_${closestVertexIndex}`;
            if (selectedMeshes.has(vertexId)) {
              removeSelectedMesh(vertexId);
            } else {
              if (!event.ctrlKey && !event.metaKey) {
                clearSelectedMeshes();
              }
              addSelectedMesh(vertexId);
            }
          }
        }
      } else {
        // Clicked on empty space - clear selection if not holding Ctrl/Cmd
        if (!event.ctrlKey && !event.metaKey) {
          clearSelectedMeshes();
        }
      }
    },
    [
      selectionMode,
      modelGroup,
      camera,
      raycaster,
      selectedMeshes,
      addSelectedMesh,
      removeSelectedMesh,
      clearSelectedMeshes,
    ]
  );

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    const isSelectionActive = Object.values(selectionMode).some(Boolean);

    if (canvas && isSelectionActive) {
      canvas.addEventListener("click", handleClick);
      canvas.style.cursor = "pointer";
      return () => {
        canvas.removeEventListener("click", handleClick);
        canvas.style.cursor = "default";
      };
    }
  }, [handleClick, selectionMode]);

  return null;
}

// Enhanced Selection Highlighter with Face/Edge/Vertex support
function EnhancedSelectionHighlighter({ modelGroup }: { modelGroup: THREE.Group | null }) {
  const { selectedMeshes, selectionMode, displayOptions } = useViewerStore();

  useEffect(() => {
    if (!modelGroup) return;

    // Reset all materials first
    modelGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if ("emissive" in mat) {
              mat.emissive.setHex(0x000000);
            }
            // Reset wireframe color for non-selected items
            if ("color" in mat && displayOptions.wireframe) {
              mat.color.setHex(0xffffff);
            }
          });
        } else if ("emissive" in child.material) {
          child.material.emissive.setHex(0x000000);
          // Reset wireframe color for non-selected items
          if ("color" in child.material && displayOptions.wireframe) {
            child.material.color.setHex(0xffffff);
          }
        }
      }
    });

    // Apply selection highlighting based on selection mode
    selectedMeshes.forEach((selectionId) => {
      if (selectionId.includes("_face_")) {
        // Face selection highlighting
        const [meshId] = selectionId.split("_face_");
        modelGroup.traverse((child) => {
          if (child instanceof THREE.Mesh && child.uuid === meshId) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (displayOptions.wireframe && "color" in mat) {
                  mat.color.setHex(0xff6600); // Orange wireframe for faces
                } else if ("emissive" in mat) {
                  mat.emissive.setHex(0xff6600); // Orange glow for solid
                }
              });
            } else if ("emissive" in child.material) {
              if (displayOptions.wireframe && "color" in child.material) {
                child.material.color.setHex(0xff6600);
              } else {
                child.material.emissive.setHex(0xff6600);
              }
            }
          }
        });
      } else if (selectionId.includes("_edge_")) {
        // Edge selection highlighting
        const [meshId] = selectionId.split("_edge_");
        modelGroup.traverse((child) => {
          if (child instanceof THREE.Mesh && child.uuid === meshId) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (displayOptions.wireframe && "color" in mat) {
                  mat.color.setHex(0xffff00); // Yellow wireframe for edges
                } else if ("emissive" in mat) {
                  mat.emissive.setHex(0xffff00); // Yellow glow for solid
                }
              });
            } else if ("emissive" in child.material) {
              if (displayOptions.wireframe && "color" in child.material) {
                child.material.color.setHex(0xffff00);
              } else {
                child.material.emissive.setHex(0xffff00);
              }
            }
          }
        });
      } else if (selectionId.includes("_vertex_")) {
        // Vertex selection highlighting
        const [meshId] = selectionId.split("_vertex_");
        modelGroup.traverse((child) => {
          if (child instanceof THREE.Mesh && child.uuid === meshId) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (displayOptions.wireframe && "color" in mat) {
                  mat.color.setHex(0x00ff00); // Green wireframe for vertices
                } else if ("emissive" in mat) {
                  mat.emissive.setHex(0x00ff00); // Green glow for solid
                }
              });
            } else if ("emissive" in child.material) {
              if (displayOptions.wireframe && "color" in child.material) {
                child.material.color.setHex(0x00ff00);
              } else {
                child.material.emissive.setHex(0x00ff00);
              }
            }
          }
        });
      } else {
        // Object selection highlighting
        modelGroup.traverse((child) => {
          if (child instanceof THREE.Mesh && child.uuid === selectionId) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (displayOptions.wireframe && "color" in mat) {
                  mat.color.setHex(0x0066ff); // Blue wireframe for objects
                } else if ("emissive" in mat) {
                  mat.emissive.setHex(0x0066ff); // Blue glow for solid
                }
              });
            } else if ("emissive" in child.material) {
              if (displayOptions.wireframe && "color" in child.material) {
                child.material.color.setHex(0x0066ff);
              } else {
                child.material.emissive.setHex(0x0066ff);
              }
            }
          }
        });
      }
    });
  }, [modelGroup, selectedMeshes, selectionMode, displayOptions.wireframe]);

  return null;
}

// Camera Reset Component - Fixed to work reliably
function CameraResetter() {
  const { cameraPosition } = useViewerStore();
  const { camera } = useThree();

  useEffect(() => {
    // Update camera position when store changes
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, cameraPosition]);

  return null;
}

// Smart OrbitControls Component - Fixed to work like Blender with Zoom Options
function SmartOrbitControls() {
  const { activeTools, zoomOptions } = useViewerStore();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { gl } = useThree();

  useEffect(() => {
    // Store controls reference for other components to access
    if (controlsRef.current && gl.domElement.parentElement) {
      const parentElement = gl.domElement.parentElement as ExtendedHTMLElement;
      parentElement._controlsRef = controlsRef.current;
    }
  }, [gl]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={zoomOptions.smoothZoom}
      dampingFactor={0.05}
      minDistance={zoomOptions.zoomLimits.min}
      maxDistance={zoomOptions.zoomLimits.max}
      enabled={true} // Always enabled for basic functionality
      enablePan={activeTools.pan}
      enableZoom={
        activeTools.zoom &&
        (zoomOptions.zoomType === "scroll" || zoomOptions.zoomType === "doubleClick")
      }
      enableRotate={activeTools.orbit}
      zoomSpeed={zoomOptions.zoomSpeed}
    />
  );
}

// Error Display
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Load 3D Model</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// Info Panel
function InfoPanel({
  fileExtension,
  isLoading,
  showMeasurements,
}: {
  fileExtension?: string;
  isLoading: boolean;
  showMeasurements?: boolean;
}) {
  const { isFullscreen, activeTools, measurementPoints, selectionMode, selectedMeshes } =
    useViewerStore();

  const isSelectionActive = Object.values(selectionMode).some(Boolean);
  const activeSelectionMode = Object.entries(selectionMode).find(([, active]) => active)?.[0];

  const getSelectionTypeDisplay = () => {
    if (activeSelectionMode === "select") return "Objects";
    if (activeSelectionMode === "face") return "Faces";
    if (activeSelectionMode === "edge") return "Edges";
    if (activeSelectionMode === "vertex") return "Vertices";
    return "";
  };

  return (
    <div
      className={`absolute top-4 left-4 z-10 rounded-lg p-3 shadow-lg max-w-xs ${
        isFullscreen ? "bg-black bg-opacity-60 text-white" : "bg-white bg-opacity-90"
      }`}
    >
      <h3 className={`text-sm font-semibold mb-1 ${isFullscreen ? "text-white" : "text-gray-800"}`}>
        3D Model Viewer
      </h3>

      {isLoading ? (
        <p className={`text-xs ${isFullscreen ? "text-blue-300" : "text-blue-600"}`}>
          Loading {fileExtension?.toUpperCase()} model...
        </p>
      ) : (
        <p className={`text-xs ${isFullscreen ? "text-gray-200" : "text-gray-600"}`}>
          Viewing {fileExtension?.toUpperCase()} format
        </p>
      )}

      {activeTools.measure && showMeasurements && (
        <div className="mt-2 pt-2 border-t border-gray-400">
          <p className={`text-xs font-medium ${isFullscreen ? "text-blue-300" : "text-blue-600"}`}>
            🎯 {activeTools.measurementType.toUpperCase()} MODE
          </p>
          <p className={`text-xs ${isFullscreen ? "text-gray-300" : "text-gray-600"}`}>
            Points: {measurementPoints.length}
          </p>
        </div>
      )}

      {isSelectionActive && (
        <div className="mt-2 pt-2 border-t border-gray-400">
          <p
            className={`text-xs font-medium ${
              isFullscreen ? "text-purple-300" : "text-purple-600"
            }`}
          >
            🔍 {activeSelectionMode?.toUpperCase()} SELECTION
          </p>
          <p className={`text-xs ${isFullscreen ? "text-gray-300" : "text-gray-600"}`}>
            Selected: {selectedMeshes.size} {getSelectionTypeDisplay()}
          </p>
        </div>
      )}
    </div>
  );
}

// Controls Info
function ControlsInfo({ showMeasurements }: { showMeasurements?: boolean }) {
  const { isFullscreen, activeTools, selectionMode } = useViewerStore();

  const isSelectionActive = Object.values(selectionMode).some(Boolean);
  const activeSelectionMode = Object.entries(selectionMode).find(([, active]) => active)?.[0];

  return (
    <div
      className={`absolute bottom-4 right-4 z-10 rounded-lg p-3 shadow-lg ${
        isFullscreen ? "bg-black bg-opacity-60 text-white" : "bg-white bg-opacity-90"
      }`}
    >
      <h4 className={`text-xs font-semibold mb-1 ${isFullscreen ? "text-white" : "text-gray-800"}`}>
        Controls
      </h4>
      <div className={`text-xs space-y-1 ${isFullscreen ? "text-gray-200" : "text-gray-600"}`}>
        {activeTools.measure && showMeasurements ? (
          <>
            <div>• Click model: Add point</div>
            <div>• Use panel to complete</div>
            <div>• Double-click: Zoom IN to point</div>
          </>
        ) : isSelectionActive ? (
          <>
            <div>• Click: Select {activeSelectionMode}</div>
            <div>• Ctrl+Click: Multi-select</div>
            <div>• Click empty: Clear selection</div>
            <div>• Double-click: Zoom IN to point</div>
            {activeSelectionMode === "face" && <div>• Orange glow: Selected faces</div>}
            {activeSelectionMode === "edge" && <div>• Yellow glow: Selected edges</div>}
            {activeSelectionMode === "vertex" && <div>• Green glow: Selected vertices</div>}
            {activeSelectionMode === "select" && <div>• Blue glow: Selected objects</div>}
          </>
        ) : (
          <>
            <div>• Left drag: {activeTools.orbit ? "Rotate" : "Disabled"}</div>
            <div>• Right drag: {activeTools.pan ? "Pan" : "Disabled"}</div>
            <div>• Scroll: {activeTools.zoom ? "Zoom" : "Disabled"}</div>
            <div>• Double-click: Zoom IN to point</div>
            <div className={`text-xs mt-1 ${isFullscreen ? "text-gray-400" : "text-gray-500"}`}>
              Zoom IN features: gets closer to target, obstacle avoidance, smooth animation
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Main Component
interface EnhancedModelViewerProps {
  modelPath: string;
  showMeasurements?: boolean;
}

function EnhancedModelViewer({ modelPath, showMeasurements = true }: EnhancedModelViewerProps) {
  const [modelGroup, setModelGroup] = useState<THREE.Group | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    displayOptions,
    measurements,
    cameraPosition,
    isFullscreen,
    exitFullscreen,
    measurementPoints,
  } = useViewerStore();

  // Reset state when model changes
  useEffect(() => {
    console.log("🔄 Loading new model, clearing previous measurements");
    setHasError(false);
    setIsLoading(true);
    setModelGroup(null);

    // Clear measurements when switching models since they're model-specific
    const { clearMeasurements, clearMeasurementPoints } = useViewerStore.getState();
    clearMeasurements();
    clearMeasurementPoints();
  }, [modelPath]);

  const handleModelLoad = useCallback((group: THREE.Group) => {
    setModelGroup(group);
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleCanvasError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        exitFullscreen().catch(console.warn);
      }
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFullscreen, exitFullscreen]);

  // --- THIS IS THE FIX ---
  // First, clean the URL to remove any query parameters (like SAS tokens).
  const cleanUrl = modelPath.split('?')[0];

  // Now, get the file extension from the clean URL.
  const fileExtension = cleanUrl.toLowerCase().split('.').pop();
  const isSupported = fileExtension === "glb" || fileExtension === "gltf";

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Initializing 3D Viewer...</p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <ErrorDisplay message={`Unsupported format: ${fileExtension}. Use GLB or GLTF files.`} />
    );
  }

  if (hasError) {
    return <ErrorDisplay message="WebGL context lost. Please refresh the page." />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden">
      <style jsx>{`
        @keyframes ping {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          75%,
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        @keyframes zoomFocus {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        .zoom-feedback {
          animation: ping 0.5s ease-out;
        }

        .focus-ring {
          animation: zoomFocus 0.6s ease-out;
        }
      `}</style>

      <Canvas
        className="w-full h-full"
        camera={{ position: cameraPosition, fov: 75 }}
        shadows={displayOptions.shadows}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        onError={handleCanvasError}
        onCreated={({ gl }) => {
          if (displayOptions.shadows) {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }
        }}
      >
        <color attach="background" args={[displayOptions.backgroundColor]} />

        {/* Grid and Axes */}
        <CustomGrid
          visible={displayOptions.showGrid}
          size={displayOptions.gridSize}
          divisions={displayOptions.gridDivisions}
          opacity={displayOptions.gridOpacity}
        />
        <CustomAxes
          visible={displayOptions.showAxes}
          length={displayOptions.axisLength}
          opacity={displayOptions.axisOpacity}
        />

        {/* Lighting */}
        {displayOptions.ambientLight && (
          <ambientLight intensity={displayOptions.ambientLightIntensity} />
        )}
        {displayOptions.directionalLight && (
          <directionalLight
            position={displayOptions.directionalLightPosition}
            intensity={displayOptions.directionalLightIntensity}
            castShadow={displayOptions.shadows}
            shadow-mapSize={[2048, 2048]}
          />
        )}
        {displayOptions.pointLight && (
          <pointLight
            position={displayOptions.pointLightPosition}
            intensity={displayOptions.pointLightIntensity}
            castShadow={displayOptions.shadows}
          />
        )}

        {/* Ground for shadows */}
        {displayOptions.shadows && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={0.2} />
          </mesh>
        )}

        {/* Model */}
        <Suspense fallback={<ProgressLoader />}>
          <Model url={modelPath} onLoad={handleModelLoad} />
        </Suspense>

        {/* Measurements - Only show when on Measurements tab */}
        {showMeasurements && (
          <>
            {measurementPoints.length > 0 && (
              <MeasurementPoints
                points={measurementPoints}
                measurementType={useViewerStore.getState().activeTools.measurementType}
              />
            )}

            {measurements.map((measurement) => {
              switch (measurement.type) {
                case "distance":
                  return (
                    <MeasurementLine
                      key={measurement.id}
                      start={measurement.points[0]}
                      end={measurement.points[1]}
                      distance={measurement.value}
                    />
                  );
                case "angle":
                  return (
                    <AngleMeasurement
                      key={measurement.id}
                      points={measurement.points}
                      angle={measurement.value}
                    />
                  );
                case "area":
                  return (
                    <AreaMeasurement
                      key={measurement.id}
                      points={measurement.points}
                      area={measurement.value}
                    />
                  );
                default:
                  return null;
              }
            })}
          </>
        )}

        {/* Measurement interaction - Only allow when on Measurements tab */}
        {showMeasurements && <MeasurementHandler modelGroup={modelGroup} />}

        {/* Selection interaction - Always available */}
        <BlenderSelectionHandler modelGroup={modelGroup} />

        {/* Double-click zoom functionality - Always available */}
        <DoubleClickZoomHandler modelGroup={modelGroup} />

        {/* Box zoom functionality - Always available */}
        <BoxZoomHandler modelGroup={modelGroup} />

        {/* Region zoom functionality - Always available */}
        <RegionZoomHandler modelGroup={modelGroup} />

        {/* Zoom utilities for fit and selection */}
        <ZoomUtilities modelGroup={modelGroup} />

        {/* Selected Objects Highlighter */}
        <EnhancedSelectionHighlighter modelGroup={modelGroup} />

        {/* Camera Reset Handler */}
        <CameraResetter />

        <SmartOrbitControls />
      </Canvas>

      {/* Zoom Control Panel - Outside Canvas */}
      <ZoomControlPanel />

      {/* Box Zoom Overlay - Outside Canvas */}
      <BoxZoomOverlay />

      {/* Region Zoom Overlay - Outside Canvas */}
      <RegionZoomOverlay />

      <InfoPanel
        fileExtension={fileExtension}
        isLoading={isLoading}
        showMeasurements={showMeasurements}
      />
      <ControlsInfo showMeasurements={showMeasurements} />
    </div>
  );
}

// Export with client-side rendering
export default dynamic(() => Promise.resolve(EnhancedModelViewer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600">Loading 3D Viewer...</p>
      </div>
    </div>
  ),
});
