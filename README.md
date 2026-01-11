# Pixi-Three

Write declarative apps seamlessly blending 2d and 3d components in React.

## Installation

```bash
pnpm install @pixi/react @react-three/fiber pixi.js react react-dom three @astralarium/pixi-three
```

Pixi-Three assumes the `hidden` Tailwind class is available. If not, you may see an extra canvas.

## Usage

```tsx
<CanvasContext>
  <CanvasView>
    <ThreeScene>
      <SpinnyCube /> // Three.js Object
    </ThreeScene>
    <SpinnySprite /> // Pixi.js Sprite
  </CanvasView>
</CanvasContext>
```

- `<CanvasContext>`: Context manager for all canvas views, which share GPU resources. Contains DOM children, including CanvasView.

- `<CanvasView>`: A canvas DOM element. Contains React Pixi children.

- `<ThreeScene>`: A Pixi Sprite. Contains React Three Fiber children.

- `<PixiTexture>`: A Three TextureNode. Contains React Pixi children.

See [a full working example](./doc/App.tsx)

## Development

```bash
pnpm install
pnpm dev
```
