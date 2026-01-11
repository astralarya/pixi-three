import { useRef, useState } from "react";
import { type ThreeElements, useFrame } from "@react-three/fiber";
import { type Mesh } from "three";
import { TextureNode } from "three/webgpu";
import { Container, Graphics } from "pixi.js";
import { extend, useTick } from "@pixi/react";

import { PixiTexture } from "#pixi-texture";
import {
  usePixiTextureContext,
  usePixiTextureEvents,
} from "#pixi-texture-context";

extend({ Graphics });

export function SpinnyCube(props: ThreeElements["mesh"]) {
  const ref = useRef<Mesh>(null);
  const [hovered, hover] = useState(false);
  const [clicked, click] = useState(false);
  console.log(clicked);

  useFrame((_state, delta) => {
    ref.current!.rotation.x += delta * (hovered ? 0.2 : 1);
    ref.current!.rotation.y += delta * 0.5 * (hovered ? 0.2 : 1);
  });

  const pixiTexture = useRef<TextureNode>(null!);
  const containerRef = useRef<Container>(null!);
  const eventHandlers = usePixiTextureEvents(containerRef, {
    onClick: () => click((x) => !x),
    onPointerOver: () => hover(true),
    onPointerOut: () => hover(false),
  });

  return (
    <mesh {...props} ref={ref} scale={clicked ? 1.5 : 1} {...eventHandlers}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicNodeMaterial>
        <PixiTexture
          ref={pixiTexture}
          containerRef={containerRef}
          width={clicked ? 64 : 128}
          height={clicked ? 64 : 128}
          attach="colorNode"
        >
          <SpinnyCubeTexture />
        </PixiTexture>
      </meshBasicNodeMaterial>
    </mesh>
  );
}

function randomColor() {
  return (
    0xff0000 * Math.random() +
    0x00ff00 * Math.random() +
    0x0000ff * Math.random()
  );
}

function SpinnyCubeTexture() {
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);

  const star1 = useRef<Graphics>(null!);
  const star2 = useRef<Graphics>(null!);
  const star1_color1 = useRef(randomColor());
  const star1_color2 = useRef(randomColor());
  const star2_color1 = useRef(randomColor());
  const star2_color2 = useRef(randomColor());

  const { render } = usePixiTextureContext();
  const time1 = useRef(0);
  const time2 = useRef(0);
  useTick((ticker) => {
    time1.current += ticker.deltaMS * (hover1 ? 0.2 : 1);
    time2.current += ticker.deltaMS * (hover2 ? 0.2 : 1);
    star1.current.rotation = ((time1.current % 4000) / 4000) * 2 * Math.PI;
    star2.current.scale = Math.sin((time2.current / 1000 / 2) * Math.PI) + 1.5;
    render();
  });

  function drawStar1(graphics: Graphics) {
    graphics.clear();
    graphics.star(64, 64, 5, 32).stroke({
      width: 8,
      color: star1_color1.current,
    });
  }
  function drawStar1_hover(graphics: Graphics) {
    graphics.clear();
    graphics.star(64, 64, 5, 32).stroke({
      width: 8,
      color: star1_color2.current,
    });
  }

  function drawStar2(graphics: Graphics) {
    graphics.clear();
    graphics.star(64, 64, 5, 32).stroke({
      width: 8,
      color: star2_color1.current,
    });
  }

  function drawStar2_hover(graphics: Graphics) {
    graphics.clear();
    graphics.star(64, 64, 5, 32).stroke({
      width: 8,
      color: star2_color2.current,
    });
  }

  return (
    <>
      <pixiGraphics
        ref={star1}
        eventMode="static"
        draw={hover1 ? drawStar1_hover : drawStar1}
        origin={64}
        onPointerEnter={() => setHover1(true)}
        onPointerLeave={() => setHover1(false)}
      />
      <pixiGraphics
        ref={star2}
        eventMode="static"
        draw={hover2 ? drawStar2_hover : drawStar2}
        origin={64}
        onPointerEnter={() => setHover2(true)}
        onPointerLeave={() => setHover2(false)}
      />
    </>
  );
}
