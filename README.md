# Pixi-Three

Write declarative apps seamlessly blending 2d and 3d components in React.

## Installation

```bash
npm install @astralarium/pixi-three https://pkg.pr.new/pixijs/pixijs/pixi.js@11816 @pixi/react @react-three/fiber three
```

## Usage

- [`<RenderContext>`](https://astralarium.github.io/pixi-three/functions/RenderContext.html): Context manager for all canvas views, which share GPU resources. Contains DOM children, including CanvasView.

- [`<CanvasView>`](https://astralarium.github.io/pixi-three/functions/CanvasView.html): A canvas DOM element. Contains React Pixi children.

- [`<ThreeScene>`](https://astralarium.github.io/pixi-three/functions/ThreeScene.html): A Pixi Sprite. Contains React Three Fiber children.

- [`<PixiTexture>`](https://astralarium.github.io/pixi-three/functions/PixiTexture.html): A Three TextureNode. Contains React Pixi children.

```tsx
<RenderContext>
  <CanvasView>
    <ThreeScene>
      <SpinnyCube /> // Three.js Object
    </ThreeScene>
    <SpinnyStar /> // Pixi.js Graphic
  </CanvasView>
</RenderContext>
```

[See a full working example](https://github.com/astralarya/pixi-three/tree/main/examples)

## Development

```bash
pnpm install
pnpm dev
```
