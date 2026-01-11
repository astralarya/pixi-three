import { useRef, useState } from "react";
import { Graphics } from "pixi.js";
import { useTick } from "@pixi/react";

function randomColor() {
  return (
    0xff0000 * Math.random() +
    0x00ff00 * Math.random() +
    0x0000ff * Math.random()
  );
}

export function SpinnyStar() {
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);

  const star1 = useRef<Graphics>(null!);
  const star2 = useRef<Graphics>(null!);
  const star1_color1 = useRef(randomColor());
  const star1_color2 = useRef(randomColor());
  const star2_color1 = useRef(randomColor());
  const star2_color2 = useRef(randomColor());

  const time1 = useRef(0);
  const time2 = useRef(0);
  useTick((ticker) => {
    time1.current += ticker.deltaMS * (hover1 ? 0.2 : 1);
    time2.current += ticker.deltaMS * (hover2 ? 0.2 : 1);
    star1.current.rotation = ((time1.current % 4000) / 4000) * 2 * Math.PI;
    star2.current.scale = Math.sin((time2.current / 1000 / 2) * Math.PI) + 1.5;
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
