import { mapUvToThreeLocal } from "@astralarium/pixi-three";
import { type ThreeElements } from "@react-three/fiber";
import { Color as PixiColor, type ColorSource } from "pixi.js";
import { useRef } from "react";
import { Color, InstancedMesh, Mesh, Object3D, Vector3 } from "three";

import { SpinnyCube, type SpinnyCubeProps } from "./spinny-cube";
import {
  SpinnyStar,
  type SpinnyStarColors,
  type StarTipData,
} from "./spinny-star";

// 10 star tips × 6 cube faces = 60 instances max
const MAX_INSTANCES = 60;

// Shade offsets indexed by cube face direction
const FACE_SHADE_OFFSETS: Record<string, number> = {
  "+x": 0, // right face: original color
  "-x": 0.3, // left face: much lighter
  "+y": -0.25, // top face: darker
  "-y": 0.15, // bottom face: lighter
  "+z": 0.4, // front face: very light
  "-z": -0.35, // back face: very dark
};

function getNormalFaceKey(normal: Vector3): string {
  const ax = Math.abs(normal.x);
  const ay = Math.abs(normal.y);
  const az = Math.abs(normal.z);

  if (ax > ay && ax > az) {
    return normal.x > 0 ? "+x" : "-x";
  } else if (ay > ax && ay > az) {
    return normal.y > 0 ? "+y" : "-y";
  } else {
    return normal.z > 0 ? "+z" : "-z";
  }
}

export interface SpinnyCubeWithFollowersProps extends SpinnyCubeProps {
  initialColors?: SpinnyStarColors;
}

function shadedColor(color: ColorSource, shadeOffset = 0): Color {
  const pixiColor = new PixiColor(color);
  const threeColor = new Color(pixiColor.toNumber());

  if (shadeOffset !== 0) {
    const hsl = { h: 0, s: 0, l: 0 };
    threeColor.getHSL(hsl);
    hsl.l = Math.max(0, Math.min(1, hsl.l + shadeOffset));
    threeColor.setHSL(hsl.h, hsl.s, hsl.l);
  }

  return threeColor;
}

export function SpinnyCubeWithFollowers({
  size = 1,
  speed = 1,
  initialColors,
  ...props
}: Omit<ThreeElements["mesh"], "ref"> & SpinnyCubeWithFollowersProps) {
  const meshRef = useRef<Mesh>(null);
  const instancedMeshRef = useRef<InstancedMesh>(null);

  // Initialize instance colors to trigger shader compilation
  const initializeColors = (mesh: InstancedMesh) => {
    instancedMeshRef.current = mesh;
    if (!mesh) return;
    const white = new Color(0xffffff);
    for (let i = 0; i < MAX_INSTANCES; i++) {
      mesh.setColorAt(i, white);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  };

  // Reusable objects to avoid allocations per frame
  const _object = new Object3D();
  const _color = new Color();

  const handleStarTipsUpdate = (tips: StarTipData[]) => {
    if (!meshRef.current || !instancedMeshRef.current) return;

    const instancedMesh = instancedMeshRef.current;
    let instanceIndex = 0;

    for (const tip of tips) {
      const results = mapUvToThreeLocal(tip.uv, meshRef.current);

      for (const result of results) {
        if (instanceIndex >= MAX_INSTANCES) break;

        const faceKey = getNormalFaceKey(result.normal);
        const shadeOffset = FACE_SHADE_OFFSETS[faceKey] ?? 0;
        const threeColor = shadedColor(tip.color, shadeOffset);

        // Scale based on distance from face edge using UV coordinates
        // For a cube, each face spans 0-1 in UV, so distance from edge is min(u, 1-u, v, 1-v)
        const u = tip.uv.x % 1; // Handle wrapped UVs
        const v = tip.uv.y % 1;
        const distFromEdge = Math.min(u, 1 - u, v, 1 - v);
        // distFromEdge is 0 at edge, 0.5 at center. Scale from 0 to 1.
        const edgeScale = Math.min(1, distFromEdge * 2);

        const pos = result.position.clone();
        pos.addScaledVector(result.normal, 0.15);
        meshRef.current.localToWorld(pos);

        _object.position.copy(pos);
        _object.scale.setScalar(edgeScale);
        _object.updateMatrix();
        instancedMesh.setMatrixAt(instanceIndex, _object.matrix);

        _color.copy(threeColor);
        instancedMesh.setColorAt(instanceIndex, _color);

        instanceIndex++;
      }
    }

    instancedMesh.count = instanceIndex;

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  };

  return (
    <>
      <SpinnyCube size={size} speed={speed} ref={meshRef} {...props}>
        <SpinnyStar
          speed={speed * 2}
          onStarTipsUpdate={handleStarTipsUpdate}
          initialColors={initialColors}
        />
      </SpinnyCube>
      <instancedMesh
        ref={initializeColors}
        args={[undefined, undefined, MAX_INSTANCES]}
      >
        <sphereGeometry args={[0.15 * (size / 3), 16, 16]} />
        <meshBasicMaterial />
      </instancedMesh>
    </>
  );
}
