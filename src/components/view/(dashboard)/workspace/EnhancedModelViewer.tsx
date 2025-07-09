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

  const { scene } = useGLTF(url);

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

// Blender-like Selection Handler with Face/Edge/Vertex support
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

// Smart OrbitControls Component - Fixed to work like Blender
function SmartOrbitControls() {
  const { activeTools } = useViewerStore();

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      minDistance={1}
      maxDistance={20}
      enabled={true} // Always enabled for basic functionality
      enablePan={activeTools.pan}
      enableZoom={activeTools.zoom}
      enableRotate={activeTools.orbit}
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
          </>
        ) : isSelectionActive ? (
          <>
            <div>• Click: Select {activeSelectionMode}</div>
            <div>• Ctrl+Click: Multi-select</div>
            <div>• Click empty: Clear selection</div>
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
    const { clearMeasurements, clearMeasurementPoints, setUnitConversionFactor } =
      useViewerStore.getState();
    clearMeasurements();
    clearMeasurementPoints();
    setUnitConversionFactor(2.0); // Reset to the calculated optimal factor
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

  const fileExtension = modelPath.toLowerCase().split(".").pop();
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

        {/* Selected Objects Highlighter */}
        <EnhancedSelectionHighlighter modelGroup={modelGroup} />

        {/* Camera Reset Handler */}
        <CameraResetter />

        <SmartOrbitControls />
      </Canvas>

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
