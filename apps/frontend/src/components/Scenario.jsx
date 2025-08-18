import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import * as THREE from "three";

export const Scenario = () => {
  const cameraControls = useRef();
  
  useEffect(() => {
    cameraControls.current.setLookAt(0, 2.2, 5, 0, 1.0, 0, true);
  }, []);

  return (
    <>
      <CameraControls ref={cameraControls} />
      
      {/* White background */}
      <color attach="background" args={['#ffffff']} />
      
      {/* Basic lighting setup */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />
      
      {/* Simple ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      <Avatar />
    </>
  );
};