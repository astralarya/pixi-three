import {
  type Container,
  type EventBoundary,
  type Point,
  type Rectangle,
  type Renderer,
} from "pixi.js";
import type { PointerEventHandler, RefObject, WheelEventHandler } from "react";

import {
  type EventGuard,
  PixiSyntheticEventSystem,
} from "./pixi-synthetic-event-system";

/**
 * DOM event handlers for Pixi.js integration.
 *
 * @see {@link https://pixijs.download/release/docs/events.EventBoundary.html | Pixi EventBoundary}
 */
export interface DomEventHandlers {
  onPointerUp?: PointerEventHandler;
  onPointerDown?: PointerEventHandler;
  onPointerOver?: PointerEventHandler;
  onPointerOut?: PointerEventHandler;
  onPointerLeave?: PointerEventHandler;
  onPointerMove?: PointerEventHandler;
  onPointerCancel?: PointerEventHandler;
  onWheel?: WheelEventHandler;
}

/**
 * Options for binding DOM events to Pixi.js containers.
 *
 * @see {@link https://pixijs.download/release/docs/scene.Container.html | Pixi Container}
 * @see {@link https://pixijs.download/release/docs/events.EventBoundary.html | Pixi EventBoundary}
 */
export interface PixiDomEventBindOptions {
  container: RefObject<Container>;
  eventBoundary?: string | EventBoundary;
  guard?: EventGuard<PointerEvent | WheelEvent, DomEventHandlers>;
}

/**
 * Event system for DOM event integration with Pixi.js.
 * Extends PixiSyntheticEventSystem to provide direct DOM coordinate mapping
 * from standard browser events (mouse, pointer, touch).
 *
 * @see {@link https://pixijs.download/release/docs/rendering.Renderer.html | Pixi Renderer}
 * @see {@link https://pixijs.download/release/docs/events.EventSystem.html | Pixi EventSystem}
 */
export class PixiDomEventSystem extends PixiSyntheticEventSystem<
  PointerEvent | WheelEvent,
  DomEventHandlers
> {
  constructor(renderer: Renderer) {
    super(renderer);
  }

  /**
   * Override mapEventToPoint to use standard DOM client coordinates.
   * Maps a DOM event's clientX/clientY to a point in Pixi space.
   *
   * @param point - The point to write the result to
   * @param event - The source DOM event
   * @param eventBoundary - The event boundary context
   * @see {@link https://pixijs.download/release/docs/maths.Point.html | Pixi Point}
   * @see {@link https://pixijs.download/release/docs/events.EventBoundary.html | Pixi EventBoundary}
   */
  protected override mapEventToPoint(
    point: Point,
    event: Event,
    eventBoundary: EventBoundary,
  ): void {
    const domEvent = event as MouseEvent;
    const viewRect = eventBoundary.rootTarget.hitArea as Rectangle;
    const rect = this.domElement.isConnected
      ? this.domElement.getBoundingClientRect()
      : {
          x: 0,
          y: 0,
          width: (this.domElement as HTMLCanvasElement).width,
          height: (this.domElement as HTMLCanvasElement).height,
          left: 0,
          top: 0,
        };

    point.x = ((domEvent.clientX - rect.left) / rect.width) * viewRect.width;
    point.y = ((domEvent.clientY - rect.top) / rect.height) * viewRect.height;
  }

  /**
   * Binds DOM event handlers to Pixi containers.
   *
   * @param domElement - HTML element to attach events to
   * @param container - {@link https://pixijs.download/release/docs/scene.Container.html | Container}(s) or bind options
   * @param handlers - Optional event handlers to chain
   * @returns DomEventHandlers object for use with React or direct event binding
   */
  public bind(
    domElement: RefObject<HTMLElement>,
    container:
      | RefObject<Container>
      | PixiDomEventBindOptions
      | (RefObject<Container> | PixiDomEventBindOptions)[],
    handlers?: DomEventHandlers,
  ): DomEventHandlers {
    return {
      ...this.bindFactory(
        [
          {
            key: "onPointerUp",
            handler: "handlePointerUp",
          },
          {
            key: "onPointerDown",
            handler: "handlePointerDown",
          },
          {
            key: "onPointerOver",
            handler: "handlePointerOverOut",
          },
          {
            key: "onPointerOut",
            handler: "handlePointerOverOut",
          },
          {
            key: "onPointerLeave",
            handler: "handlePointerOverOut",
          },
          {
            key: "onPointerMove",
            handler: "handlePointerMove",
          },
          {
            key: "onPointerCancel",
            handler: "handlePointerUp",
          },
          {
            key: "onWheel",
            handler: "handleWheel",
          },
        ],
        domElement,
        container,
        handlers,
      ),
    };
  }
}
