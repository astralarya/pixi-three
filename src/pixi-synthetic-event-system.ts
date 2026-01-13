import {
  type Container,
  EventBoundary,
  EventsTicker,
  EventSystem,
  type FederatedMouseEvent,
  FederatedPointerEvent,
  FederatedWheelEvent,
  type PixiTouch,
  Point,
  type Renderer,
} from "pixi.js";
import { type RefObject } from "react";

/** Constant {@link https://pixijs.download/release/docs/maths.Point.html | Point} indicating no intersection `new Point(-Infinity, -Infinity)` */
export const MISSED_POINT = new Point(-Infinity, -Infinity);

const MOUSE_POINTER_ID = 1;

const TOUCH_TO_POINTER: Record<string, string> = {
  touchstart: "pointerdown",
  touchend: "pointerup",
  touchendoutside: "pointerupoutside",
  touchmove: "pointermove",
  touchcancel: "pointercancel",
};

const MOUSE_EVENTS = ["click", "contextmenu", "dblclick"];

interface PixiPointerEvent extends PointerEvent {
  isPrimary: boolean;
  width: number;
  height: number;
  tiltX: number;
  tiltY: number;
  pointerType: string;
  pointerId: number;
  pressure: number;
  twist: number;
  tangentialPressure: number;
  isNormalized: boolean;
  type: string;
}

interface PixiRootEvents {
  pointerEvent: FederatedPointerEvent;
  wheelEvent: FederatedWheelEvent;
}

/**
 * Options for binding events to Pixi.js containers.
 *
 * @see {@link https://pixijs.download/release/docs/scene.Container.html | Pixi Container}
 * @see {@link https://pixijs.download/release/docs/events.EventBoundary.html | Pixi EventBoundary}
 */
export interface BindEventOptions<
  TEvent,
  TEventHandlers = Record<string, (event: TEvent) => void>,
> {
  container: RefObject<Container>;
  eventBoundary?: string | EventBoundary;
  guard?: EventGuard<TEvent, TEventHandlers>;
}

export type EventGuard<
  TEvent,
  TEventHandlers = Record<string, (event: TEvent) => void>,
> =
  | ((event: TEvent) => boolean)
  | {
      [K in keyof TEventHandlers]?: TEventHandlers[K] extends (
        event: infer E,
      ) => void
        ? (event: E) => boolean
        : never;
    };

/**
 * A synthetic event system that serves as a base class
 * for custom event systems.
 *
 * @see {@link https://pixijs.download/release/docs/events.EventSystem.html | Pixi EventSystem}
 * @see {@link https://pixijs.download/release/docs/events.EventBoundary.html | Pixi EventBoundary}
 * @see {@link https://pixijs.download/release/docs/events.FederatedPointerEvent.html | Pixi FederatedPointerEvent}
 */
export class PixiSyntheticEventSystem<
  TEvent,
  TEventHandlers = Record<string, (event: TEvent) => void>,
> extends EventSystem {
  private _eventBoundaries: Record<string, EventBoundary>;
  private _rootEvents: Record<string, PixiRootEvents>;

  constructor(renderer: Renderer) {
    super(renderer);

    this.domElement = renderer.events.domElement;
    Object.assign(this.features, { move: true, click: true, wheel: true });

    this._eventBoundaries = {};
    this._rootEvents = {};
  }

  /**
   * Named event boundaries, created lazily.
   */
  public get eventBoundaries(): Record<string, EventBoundary> {
    return new Proxy(this._eventBoundaries, {
      get: (target, key: string) => {
        if (!(key in target)) {
          target[key] = new EventBoundary();
          this._rootEvents[key] = {
            pointerEvent: new FederatedPointerEvent(target[key]),
            wheelEvent: new FederatedWheelEvent(target[key]),
          };
        }
        return target[key];
      },
    });
  }

  /**
   * Named root events, created lazily.
   */
  public get rootEvents(): Record<string, PixiRootEvents> {
    return new Proxy(this._rootEvents, {
      get: (target, key: string) => {
        if (!(key in target)) {
          this._eventBoundaries[key] = new EventBoundary();
          target[key] = {
            pointerEvent: new FederatedPointerEvent(this._eventBoundaries[key]),
            wheelEvent: new FederatedWheelEvent(this._eventBoundaries[key]),
          };
        }
        return target[key];
      },
    });
  }

  /**
   * Maps an event to a point in the container's coordinate space.
   * Override this method in subclasses for custom coordinate mapping.
   * @param point - The point to store the mapped coordinates in
   * @param event - The source event
   * @param _eventBoundary - The event boundary
   */
  protected mapEventToPoint(
    point: Point,
    event: Event,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _eventBoundary: EventBoundary,
  ): void {
    const mouseEvent = event as MouseEvent;
    this.mapPositionToPoint(point, mouseEvent.clientX, mouseEvent.clientY);
  }

  /**
   * Ensures that the original event object contains all data that a regular pointer event would have
   * @param event - The original event data from a touch or mouse event
   * @returns An array containing a single normalized pointer event, in the case of a pointer
   *  or mouse event, or a multiple normalized pointer events if there are multiple changed touches
   */
  protected normalizeToPointerData<
    T extends TouchEvent | MouseEvent | PointerEvent,
  >(event: T): PointerEvent[] {
    const normalizedEvents: PointerEvent[] = [];

    if (this.supportsTouchEvents && event.type.startsWith("touch")) {
      for (const touch of (event as TouchEvent)
        .changedTouches as Iterable<PixiTouch>) {
        if (typeof touch.button === "undefined") touch.button = 0;
        if (typeof touch.buttons === "undefined") touch.buttons = 1;
        if (typeof touch.isPrimary === "undefined") {
          touch.isPrimary =
            (event as TouchEvent).touches.length === 1 &&
            event.type === "touchstart";
        }
        if (typeof touch.width === "undefined")
          touch.width = touch.radiusX || 1;
        if (typeof touch.height === "undefined")
          touch.height = touch.radiusY || 1;
        if (typeof touch.tiltX === "undefined") touch.tiltX = 0;
        if (typeof touch.tiltY === "undefined") touch.tiltY = 0;
        if (typeof touch.pointerType === "undefined")
          touch.pointerType = "touch";
        if (typeof touch.pointerId === "undefined")
          touch.pointerId = touch.identifier || 0;
        if (typeof touch.pressure === "undefined")
          touch.pressure = touch.force || 0.5;
        if (typeof touch.twist === "undefined") touch.twist = 0;
        if (typeof touch.tangentialPressure === "undefined")
          touch.tangentialPressure = 0;
        // HOPE: note from pixi.js/EventSystem
        // TODO: Remove these, as layerX/Y is not a standard, is deprecated, has uneven
        // support, and the fill ins are not quite the same
        // offsetX/Y might be okay, but is not the same as clientX/Y when the canvas's top
        // left is not 0,0 on the page
        if (typeof touch.layerX === "undefined")
          touch.layerX = touch.offsetX = touch.clientX;
        if (typeof touch.layerY === "undefined")
          touch.layerY = touch.offsetY = touch.clientY;

        touch.isNormalized = true;
        touch.type = event.type;

        normalizedEvents.push({
          ...(event as PointerEvent),
          ...touch,
        });
      }
    } else if (
      !globalThis.MouseEvent ||
      (!this.supportsPointerEvents && MOUSE_EVENTS.includes(event.type))
    ) {
      const tempEvent = event as unknown as PixiPointerEvent;

      if (typeof tempEvent.isPrimary === "undefined")
        tempEvent.isPrimary = true;
      if (typeof tempEvent.width === "undefined") tempEvent.width = 1;
      if (typeof tempEvent.height === "undefined") tempEvent.height = 1;
      if (typeof tempEvent.tiltX === "undefined") tempEvent.tiltX = 0;
      if (typeof tempEvent.tiltY === "undefined") tempEvent.tiltY = 0;
      if (typeof tempEvent.pointerType === "undefined")
        tempEvent.pointerType = "mouse";
      if (typeof tempEvent.pointerId === "undefined")
        tempEvent.pointerId = MOUSE_POINTER_ID;
      if (typeof tempEvent.pressure === "undefined") tempEvent.pressure = 0.5;
      if (typeof tempEvent.twist === "undefined") tempEvent.twist = 0;
      if (typeof tempEvent.tangentialPressure === "undefined")
        tempEvent.tangentialPressure = 0;

      tempEvent.isNormalized = true;

      normalizedEvents.push(event as PointerEvent);
    } else {
      normalizedEvents.push(event as PointerEvent);
    }

    return normalizedEvents;
  }

  /**
   * Transfers mouse event data from a source event to a federated event.
   * @param federatedEvent - The federated event to populate
   * @param sourceEvent - The source event to copy from
   */
  protected transferMouseData<T extends MouseEvent>(
    federatedEvent: FederatedMouseEvent,
    sourceEvent: T,
  ): void {
    federatedEvent.isTrusted = sourceEvent.isTrusted;
    federatedEvent.srcElement = sourceEvent.srcElement!;
    federatedEvent.timeStamp = performance.now();
    federatedEvent.type = sourceEvent.type;

    federatedEvent.altKey = sourceEvent.altKey;
    federatedEvent.button = sourceEvent.button;
    federatedEvent.buttons = sourceEvent.buttons;
    federatedEvent.client.x = sourceEvent.clientX;
    federatedEvent.client.y = sourceEvent.clientY;
    federatedEvent.ctrlKey = sourceEvent.ctrlKey;
    federatedEvent.metaKey = sourceEvent.metaKey;
    federatedEvent.movement.x = sourceEvent.movementX;
    federatedEvent.movement.y = sourceEvent.movementY;
    federatedEvent.page.x = sourceEvent.pageX;
    federatedEvent.page.y = sourceEvent.pageY;
    federatedEvent.relatedTarget = null as unknown as EventTarget;
    federatedEvent.shiftKey = sourceEvent.shiftKey;
  }

  /**
   * Bootstraps a FederatedPointerEvent from a pointer event source.
   * @param federatedEvent - The federated event to populate
   * @param sourceEvent - The source pointer event
   * @param originalEvent - The original event before normalization
   * @param eventBoundary - The event boundary context for coordinate mapping
   */
  protected bootstrapPointerEvent<T extends PointerEvent>(
    federatedEvent: FederatedPointerEvent,
    sourceEvent: T,
    originalEvent: Event,
    eventBoundary: EventBoundary,
  ): void {
    federatedEvent.originalEvent = null!;
    federatedEvent.nativeEvent = sourceEvent;

    federatedEvent.pointerId = sourceEvent.pointerId;
    federatedEvent.width = sourceEvent.width;
    federatedEvent.height = sourceEvent.height;
    federatedEvent.isPrimary = sourceEvent.isPrimary;
    federatedEvent.pointerType = sourceEvent.pointerType;
    federatedEvent.pressure = sourceEvent.pressure;
    federatedEvent.tangentialPressure = sourceEvent.tangentialPressure;
    federatedEvent.tiltX = sourceEvent.tiltX;
    federatedEvent.tiltY = sourceEvent.tiltY;
    federatedEvent.twist = sourceEvent.twist;

    this.transferMouseData(federatedEvent, sourceEvent);

    this.mapEventToPoint(federatedEvent.screen, originalEvent, eventBoundary);
    federatedEvent.global.copyFrom(federatedEvent.screen);
    federatedEvent.offset.copyFrom(federatedEvent.screen);

    federatedEvent.isTrusted = sourceEvent.isTrusted;
    if (federatedEvent.type === "pointerleave") {
      federatedEvent.type = "pointerout";
    }
    if (federatedEvent.type.startsWith("mouse")) {
      federatedEvent.type = federatedEvent.type.replace("mouse", "pointer");
    }
    if (federatedEvent.type.startsWith("touch")) {
      federatedEvent.type =
        TOUCH_TO_POINTER[federatedEvent.type] || federatedEvent.type;
    }
  }

  /**
   * Handles pointer down events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source pointer/mouse/touch event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated pointer event
   */
  protected handlePointerDown<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
  ): void {
    const events = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = events.length; i < j; i++) {
      const nativeEvent = events[i];
      this.bootstrapPointerEvent(
        rootEvent,
        nativeEvent,
        sourceEvent as Event,
        eventBoundary,
      );
      eventBoundary.mapEvent(rootEvent);
    }

    this.setCursor(eventBoundary.cursor);
  }

  /**
   * Handles pointer move events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source pointer/mouse/touch event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated pointer event
   */
  protected handlePointerMove<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
  ): void {
    if (!this.features.move) return;

    EventsTicker.pointerMoved();

    const normalizedEvents = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      this.bootstrapPointerEvent(
        rootEvent,
        normalizedEvents[i],
        sourceEvent as Event,
        eventBoundary,
      );
      eventBoundary.mapEvent(rootEvent);
    }

    this.setCursor(eventBoundary.cursor);
  }

  /**
   * Handles pointer up events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source pointer/mouse/touch event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated pointer event
   */
  protected handlePointerUp<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
  ): void {
    if (!this.features.click) return;

    const target = (sourceEvent as Event).target;

    // TODO implement this
    const outside = target !== this.domElement ? "outside" : "";
    const normalizedEvents = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      this.bootstrapPointerEvent(
        rootEvent,
        normalizedEvents[i],
        sourceEvent as Event,
        eventBoundary,
      );
      rootEvent.type += outside;
      eventBoundary.mapEvent(rootEvent);
    }

    this.setCursor(eventBoundary.cursor);
  }

  /**
   * Handles pointer over/out/enter/leave events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source pointer/mouse/touch event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated pointer event
   */
  protected handlePointerOverOut<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
  ): void {
    if (!this.features.click) return;

    const normalizedEvents = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      this.bootstrapPointerEvent(
        rootEvent,
        normalizedEvents[i],
        sourceEvent as Event,
        eventBoundary,
      );
      eventBoundary.mapEvent(rootEvent);
    }

    this.setCursor(eventBoundary.cursor);
  }

  /**
   * Handles wheel events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source wheel event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated wheel event
   */
  protected handleWheel<T = WheelEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedWheelEvent,
  ): void {
    if (!this.features.wheel) return;

    const wheelEvent = sourceEvent as WheelEvent;
    this.transferMouseData(rootEvent, wheelEvent);

    // Read deltaMode after deltaX/Y/Z for Firefox compatibility
    // @see https://github.com/pixijs/pixijs/issues/8970
    rootEvent.deltaX = wheelEvent.deltaX;
    rootEvent.deltaY = wheelEvent.deltaY;
    rootEvent.deltaZ = wheelEvent.deltaZ;
    rootEvent.deltaMode = wheelEvent.deltaMode;

    this.mapEventToPoint(rootEvent.screen, sourceEvent as Event, eventBoundary);
    rootEvent.global.copyFrom(rootEvent.screen);
    rootEvent.offset.copyFrom(rootEvent.screen);

    rootEvent.nativeEvent = wheelEvent;
    rootEvent.type = wheelEvent.type;

    eventBoundary.mapEvent(rootEvent);
  }

  /**
   * Generic factory for event handler bindings.
   * @param input - Container(s) or bind options
   * @param handlers - Optional event handlers to chain
   * @param keys - Event handler keys to generate
   * @returns Event handlers object with generated bindings
   */
  protected bindFactory(
    keys: {
      key: keyof TEventHandlers;
      handler:
        | "handlePointerDown"
        | "handlePointerMove"
        | "handlePointerUp"
        | "handlePointerOverOut"
        | "handleWheel";
    }[],
    domElement: RefObject<HTMLElement>,
    input:
      | RefObject<Container>
      | BindEventOptions<TEvent, TEventHandlers>
      | (RefObject<Container> | BindEventOptions<TEvent, TEventHandlers>)[],
    handlers?: Partial<TEventHandlers>,
  ): Partial<TEventHandlers> {
    const options = (Array.isArray(input) ? input : [input]).map((item) => {
      if (Object.hasOwn(item as object, "current")) {
        return {
          container: item,
          eventBoundary: new EventBoundary(),
        } as BindEventOptions<TEvent, TEventHandlers>;
      } else if (!Object.hasOwn(item as object, "eventBoundary")) {
        return {
          ...item,
          eventBoundary: new EventBoundary(),
        } as BindEventOptions<TEvent, TEventHandlers>;
      } else {
        return item as BindEventOptions<TEvent, TEventHandlers>;
      }
    });

    const containers = options.map((opt) => opt.container);

    const eventBoundaries = options.map((opt) => {
      const spec = opt.eventBoundary;
      if (typeof spec === "string") {
        return this.eventBoundaries[spec];
      }
      return spec ?? new EventBoundary();
    });

    const rootEvents = options.map((opt, idx) => {
      const spec = opt.eventBoundary;
      if (typeof spec === "string") {
        return this.rootEvents[spec];
      }
      return {
        pointerEvent: new FederatedPointerEvent(eventBoundaries[idx]),
        wheelEvent: new FederatedWheelEvent(eventBoundaries[idx]),
      };
    });

    const testGuard = <E extends TEvent>(
      eventName: keyof TEventHandlers,
      event: E,
      idx: number,
    ): boolean => {
      const guard = options[idx].guard;
      if (!guard) return true;
      if (typeof guard === "function") {
        return guard(event);
      }
      const eventGuard = guard[eventName];
      if (!eventGuard) return true;
      return eventGuard(event);
    };

    const result: Partial<TEventHandlers> = {};

    for (const { key, handler } of keys) {
      result[key] = ((event: TEvent) => {
        (handlers?.[key] as ((event: TEvent) => void) | undefined)?.(event);
        for (const [idx, containerRef] of containers.entries()) {
          if (containerRef.current) {
            const testResult = testGuard(key, event, idx);
            eventBoundaries[idx].rootTarget = containerRef.current;
            const eventToHandle = testResult ? event : event;
            this.domElement = domElement.current;
            this[handler](
              eventToHandle,
              eventBoundaries[idx],
              rootEvents[idx][
                key === "handleWheel" ? "wheelEvent" : "pointerEvent"
              ] as FederatedPointerEvent & FederatedWheelEvent,
            );
          }
        }
      }) as TEventHandlers[keyof TEventHandlers];
    }

    return result;
  }
}
