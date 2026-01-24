# PixiThree

Declarative 2D and 3D composition in React.

Combine the power of React Three Fiber and React Pixi to seamlessly compose 2d and 3d.
Render dynamic 2d textures onto 3d objects.
Integrate 3d objects into 2d scenes.

[Docs](https://astralarium.github.io/pixi-three/)
| [Github](https://github.com/astralarium/pixi-three)
| [NPM](https://www.npmjs.com/package/@astralarium/pixi-three)

## Installation

```bash
npm i @astralarium/pixi-three https://pkg.pr.new/pixijs/pixijs/pixi.js@11846 @pixi/react @react-three/fiber three
```

## Usage

- [`<RenderContext>`](https://astralarium.github.io/pixi-three/docs/functions/RenderContext.html): Context manager for all canvas views, which share GPU resources. Contains DOM children, including CanvasView.

- [`<CanvasView>`](https://astralarium.github.io/pixi-three/docs/functions/CanvasView.html): A canvas DOM element. Contains React Pixi children.

- [`<ThreeScene>`](https://astralarium.github.io/pixi-three/docs/functions/ThreeScene.html): A Pixi Sprite. Contains React Three Fiber children.

- [`<PixiTexture>`](https://astralarium.github.io/pixi-three/docs/functions/PixiTexture.html): A Three TextureNode. Contains React Pixi children.

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

[See examples on the documentation website](https://astralarium.github.io/pixi-three)

## Development

```bash
pnpm install
pnpm dev
```

This project uses React Compiler.
