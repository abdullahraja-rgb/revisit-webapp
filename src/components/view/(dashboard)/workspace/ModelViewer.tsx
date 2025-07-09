"use client";

import * as THREE from "three";
import { Suspense, useState, useRef } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Box, Text } from "@react-three/drei";
import { USDZLoader } from "three/examples/jsm/loaders/USDZLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Error Message Component
function ErrorMessage({ message }: { message: string }) {
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Load 3D Model</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="text-sm text-gray-500">
          <p className="mb-2">For better web compatibility:</p>
          <ul className="text-left space-y-1">
            <li>• Use GLB/GLTF format (recommended for web)</li>
            <li>• Convert USDZ to GLB using online tools</li>
            <li>• Ensure the file is not corrupted</li>
            <li>• USDZ has limited web browser support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// USDZ Model Component
function USDZModel({ url, onError }: { url: string; onError: (message: string) => void }) {
  const model = useLoader(USDZLoader, url, undefined, (error) => {
    console.warn("USDZ loading failed:", error);
    onError(
      "USDZ format has limited web browser support. Consider converting to GLB/GLTF format for better compatibility."
    );
  });

  return <primitive object={model} />;
}

// GLTF Model Component
function GLTFModel({ url, onError }: { url: string; onError: (message: string) => void }) {
  const gltf = useLoader(GLTFLoader, url, undefined, (error) => {
    console.warn("GLB/GLTF loading failed:", error);
    onError("Failed to load GLB/GLTF file. Please check if the file is corrupted.");
  });

  return <primitive object={gltf.scene} />;
}

// Model Component with proper hook usage
function Model({ url, onError }: { url: string; onError: (message: string) => void }) {
  const fileExtension = url.toLowerCase().split(".").pop();

  // Conditionally render different components instead of conditionally calling hooks
  if (fileExtension === "usdz") {
    return <USDZModel url={url} onError={onError} />;
  } else if (fileExtension === "glb" || fileExtension === "gltf") {
    return <GLTFModel url={url} onError={onError} />;
  } else {
    // Handle unsupported format
    onError(`Unsupported file format: ${fileExtension}. Please use GLB, GLTF, or USDZ files.`);
    return null;
  }
}

// Loading Component
function LoadingModel() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <Box ref={meshRef} args={[1, 1, 1]}>
        <meshStandardMaterial color="#6366f1" wireframe />
      </Box>
      <Text position={[0, -2, 0]} fontSize={0.5} color="#6366f1" anchorX="center" anchorY="middle">
        Loading 3D Model...
      </Text>
    </group>
  );
}

export default function ModelViewer({ modelPath }: { modelPath: string }) {
  const [hasLoadingError, setHasLoadingError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleModelError = (message: string) => {
    setErrorMessage(message);
    setHasLoadingError(true);
  };

  const fileExtension = modelPath.toLowerCase().split(".").pop();
  const isUSDZ = fileExtension === "usdz";

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Info Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-xs">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">3D Model Viewer</h3>
        <p className="text-xs text-gray-600">
          {isUSDZ
            ? "⚠️ USDZ format has limited web support. GLB/GLTF recommended."
            : `Viewing ${fileExtension?.toUpperCase()} format 3D model.`}
        </p>
        {isUSDZ && (
          <p className="text-xs text-orange-600 mt-1">
            Consider converting to GLB format for better web compatibility.
          </p>
        )}
      </div>

      {/* Controls Info */}
      <div className="absolute bottom-4 right-4 z-10 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
        <h4 className="text-xs font-semibold text-gray-800 mb-1">Controls</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Left click + drag: Rotate</div>
          <div>• Right click + drag: Pan</div>
          <div>• Scroll: Zoom</div>
        </div>
      </div>

      {hasLoadingError ? (
        <ErrorMessage message={errorMessage || "The 3D model could not be loaded."} />
      ) : (
        <Canvas
          className="w-full h-full"
          camera={{ position: [5, 5, 5], fov: 75 }}
          onCreated={() => setHasLoadingError(false)}
        >
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Model with Suspense for loading */}
          <Suspense fallback={<LoadingModel />}>
            <Model url={modelPath} onError={handleModelError} />
          </Suspense>

          {/* Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            screenSpacePanning={false}
            minDistance={1}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      )}
    </div>
  );
}
