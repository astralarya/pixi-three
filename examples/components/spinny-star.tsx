import { usePixiViewContext, useViewport } from "@astralarium/pixi-three";
import { extend, useTick } from "@pixi/react";
import { type ColorSource, Container, Graphics, Point } from "pixi.js";
import { type ComponentProps, useRef, useState } from "react";
import { type Vector3 } from "three";

import { pixiRed, threeBlue } from "#components/lib/colors";

export const PIXI_THREE_STAR = {
  star1: threeBlue[500],
  star1Hover: threeBlue[300],
  star2: pixiRed[600],
  star2Hover: pixiRed[400],
} as const;

extend({ Container, Graphics });

function randomColor(): ColorSource {
  return (
    0xff0000 * Math.random() +
    0x00ff00 * Math.random() +
    0x0000ff * Math.random()
  );
}

export interface SpinnyStarColors {
  star1?: ColorSource;
  star1Hover?: ColorSource;
  star2?: ColorSource;
  star2Hover?: ColorSource;
}

export interface StarTipData {
  position: Vector3;
  /** World normal (transformed by mesh rotation), used for camera-facing check */
  normal: Vector3;
  /** Local normal (not transformed), used for face shading */
  localNormal: Vector3;
  /** UV coordinates (0-1) used for edge scaling */
  uv: { x: number; y: number };
  color: ColorSource;
}

export interface SpinnyStarProps {
  speed?: number;
  initialColors?: SpinnyStarColors;
  onStarTipsUpdate?: (tips: StarTipData[]) => void;
}

export function SpinnyStar({
  speed = 1,
  initialColors,
  onStarTipsUpdate,
  ...props
}: SpinnyStarProps & ComponentProps<"pixiContainer">) {
  const size = useViewport();
  const { parentThree } = usePixiViewContext();
  const center = new Point(size.width / 2, size.height / 2);
  const scale = Math.min(size.width, size.height);
  const radius = scale / 4;
  const width = scale / 16;

  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);
  const [justClicked1, setJustClicked1] = useState(false);
  const [justClicked2, setJustClicked2] = useState(false);

  const star1 = useRef<Graphics>(null!);
  const star2 = useRef<Graphics>(null!);
  const [star1_color, setStar1Color] = useState(
    () => initialColors?.star1 ?? randomColor(),
  );
  const [star1_colorHover, setStar1ColorHover] = useState(
    () => initialColors?.star1Hover ?? randomColor(),
  );
  const [star2_color, setStar2Color] = useState(
    () => initialColors?.star2 ?? randomColor(),
  );
  const [star2_colorHover, setStar2ColorHover] = useState(
    () => initialColors?.star2Hover ?? randomColor(),
  );

  const time1 = useRef(0);
  const time2 = useRef(0);
  const _point = useRef(new Point());

  useTick((ticker) => {
    time1.current += ticker.deltaMS * (hover1 ? 0.2 : 1) * speed;
    time2.current += ticker.deltaMS * (hover2 ? 0.2 : 1) * speed;
    star1.current.rotation = ((time1.current % 4000) / 4000) * 2 * Math.PI;
    star2.current.scale = Math.sin((time2.current / 1000 / 2) * Math.PI) + 1.5;

    if (onStarTipsUpdate && parentThree) {
      const tips: StarTipData[] = [];

      for (let i = 0; i < 5; i++) {
        const baseAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;

        // Star 1 tip - all faces
        const star1Angle = baseAngle + star1.current.rotation;
        _point.current.x = center.x + Math.cos(star1Angle) * radius;
        _point.current.y = center.y + Math.sin(star1Angle) * radius;
        const star1Uv = {
          x: _point.current.x / size.width,
          y: _point.current.y / size.height,
        };
        const star1World = parentThree.mapPixiToParentThree(_point.current);
        const star1Local = parentThree.mapPixiToParentThreeLocal(
          _point.current,
        );
        for (let j = 0; j < star1World.length; j++) {
          tips.push({
            position: star1World[j].position.clone(),
            normal: star1World[j].normal.clone(),
            localNormal: star1Local[j].normal.clone(),
            uv: star1Uv,
            color: star1_color,
          });
        }

        // Star 2 tip - all faces
        const currentRadius = radius * star2.current.scale.x;
        _point.current.x = center.x + Math.cos(baseAngle) * currentRadius;
        _point.current.y = center.y + Math.sin(baseAngle) * currentRadius;
        const star2Uv = {
          x: _point.current.x / size.width,
          y: _point.current.y / size.height,
        };
        const star2World = parentThree.mapPixiToParentThree(_point.current);
        const star2Local = parentThree.mapPixiToParentThreeLocal(
          _point.current,
        );
        for (let j = 0; j < star2World.length; j++) {
          tips.push({
            position: star2World[j].position.clone(),
            normal: star2World[j].normal.clone(),
            localNormal: star2Local[j].normal.clone(),
            uv: star2Uv,
            color: star2_color,
          });
        }
      }

      onStarTipsUpdate(tips);
    }
  });

  function drawStar1(graphics: Graphics) {
    graphics.clear();
    graphics.star(center.x, center.y, 5, radius).stroke({
      width,
      color: star1_color,
    });
  }
  function drawStar1_hover(graphics: Graphics) {
    graphics.clear();
    graphics.star(center.x, center.y, 5, radius).stroke({
      width,
      color: star1_colorHover,
    });
  }

  function drawStar2(graphics: Graphics) {
    graphics.clear();
    graphics.star(center.x, center.y, 5, radius).stroke({
      width,
      color: star2_color,
    });
  }

  function drawStar2_hover(graphics: Graphics) {
    graphics.clear();
    graphics.star(center.x, center.y, 5, radius).stroke({
      width,
      color: star2_colorHover,
    });
  }

  return (
    <pixiContainer {...props}>
      <pixiGraphics
        ref={star1}
        eventMode="static"
        draw={hover1 && !justClicked1 ? drawStar1_hover : drawStar1}
        origin={center}
        onPointerEnter={() => setHover1(true)}
        onPointerLeave={() => {
          setHover1(false);
          setJustClicked1(false);
        }}
        onPointerDown={() => {
          setStar1Color(randomColor());
          setStar1ColorHover(randomColor());
          setJustClicked1(true);
        }}
      />
      <pixiGraphics
        ref={star2}
        eventMode="static"
        draw={hover2 && !justClicked2 ? drawStar2_hover : drawStar2}
        origin={center}
        onPointerEnter={() => setHover2(true)}
        onPointerLeave={() => {
          setHover2(false);
          setJustClicked2(false);
        }}
        onPointerDown={() => {
          setStar2Color(randomColor());
          setStar2ColorHover(randomColor());
          setJustClicked2(true);
        }}
      />
    </pixiContainer>
  );
}
