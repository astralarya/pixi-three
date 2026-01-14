import { useViewport } from "@astralarium/pixi-three";
import { extend, useTick } from "@pixi/react";
import { type ColorSource, Graphics, Point } from "pixi.js";
import { useRef, useState } from "react";

extend({ Graphics });

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

export interface SpinnyStarProps {
  speed?: number;
  initialColors?: SpinnyStarColors;
}

export function SpinnyStar({ speed = 1, initialColors }: SpinnyStarProps) {
  const size = useViewport();
  const center = new Point(size.width / 2, size.height / 2);
  const scale = Math.min(size.width, size.height);
  const radius = scale / 4;
  const width = scale / 16;

  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);

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
  useTick((ticker) => {
    time1.current += ticker.deltaMS * (hover1 ? 0.2 : 1) * speed;
    time2.current += ticker.deltaMS * (hover2 ? 0.2 : 1) * speed;
    star1.current.rotation = ((time1.current % 4000) / 4000) * 2 * Math.PI;
    star2.current.scale = Math.sin((time2.current / 1000 / 2) * Math.PI) + 1.5;
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
    <>
      <pixiGraphics
        ref={star1}
        eventMode="static"
        draw={hover1 ? drawStar1_hover : drawStar1}
        origin={center}
        onPointerEnter={() => setHover1(true)}
        onPointerLeave={() => setHover1(false)}
        onPointerDown={() => {
          setStar1Color(randomColor());
          setStar1ColorHover(randomColor());
        }}
      />
      <pixiGraphics
        ref={star2}
        eventMode="static"
        draw={hover2 ? drawStar2_hover : drawStar2}
        origin={center}
        onPointerEnter={() => setHover2(true)}
        onPointerLeave={() => setHover2(false)}
        onPointerDown={() => {
          setStar2Color(randomColor());
          setStar2ColorHover(randomColor());
        }}
      />
    </>
  );
}
