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

const MISSED_POINT = new Point(-Infinity, -Infinity);

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

export interface PixiRootEvents {
  pointerEvent: FederatedPointerEvent;
  wheelEvent: FederatedWheelEvent;
}

/**
 * A synthetic event system for Pixi
 *
 * @see {@link https://pixijs.download/release/docs/events.EventSystem.html | Pixi EventSystem}
 * @see {@link https://pixijs.download/release/docs/events.EventBoundary.html | Pixi EventBoundary}
 * @see {@link https://pixijs.download/release/docs/events.FederatedPointerEvent.html | Pixi FederatedPointerEvent}
 */
export class PixiSyntheticEventSystem extends EventSystem {
  constructor(renderer: Renderer) {
    super(renderer);

    this.domElement = renderer.events.domElement;
    Object.assign(this.features, { move: true, click: true, wheel: true });
  }

  /**
   * Dispatches an event directly to a Pixi container.
   *
   * @param event - The DOM event
   * @param point - The point in Pixi texture space, or null to signal missed/out
   * @param container - The Pixi container to dispatch events to
   * @param eventBoundary - The event boundary for the container
   * @param rootEvents - Root federated events for pointer and wheel
   * @param domElement - The DOM element for coordinate mapping
   */
  public dispatch(
    event: Event,
    point: Point | null,
    container: Container,
    eventBoundary: EventBoundary,
    rootEvents: PixiRootEvents,
    domElement: HTMLElement,
  ): void {
    this.domElement = domElement;

    const eventPoint = point ?? MISSED_POINT;

    eventBoundary.rootTarget = container;

    const type = event.type;
    if (
      type === "pointerdown" ||
      type === "mousedown" ||
      type === "touchstart"
    ) {
      this.handlePointerDown(
        event,
        eventBoundary,
        rootEvents.pointerEvent,
        eventPoint,
      );
    } else if (
      type === "pointermove" ||
      type === "mousemove" ||
      type === "touchmove"
    ) {
      this.handlePointerMove(
        event,
        eventBoundary,
        rootEvents.pointerEvent,
        eventPoint,
      );
    } else if (
      type === "pointerup" ||
      type === "mouseup" ||
      type === "touchend"
    ) {
      this.handlePointerUp(
        event,
        eventBoundary,
        rootEvents.pointerEvent,
        eventPoint,
      );
    } else if (
      type === "pointerover" ||
      type === "pointerout" ||
      type === "pointerenter" ||
      type === "pointerleave"
    ) {
      this.handlePointerOverOut(
        event,
        eventBoundary,
        rootEvents.pointerEvent,
        eventPoint,
      );
    } else if (type === "wheel") {
      this.handleWheel(event, eventBoundary, rootEvents.wheelEvent, eventPoint);
    }
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
   * @param eventPoint - The point in container coordinates
   */
  protected bootstrapPointerEvent<T extends PointerEvent>(
    federatedEvent: FederatedPointerEvent,
    sourceEvent: T,
    eventPoint: Point,
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

    federatedEvent.screen.copyFrom(eventPoint);
    federatedEvent.global.copyFrom(eventPoint);
    federatedEvent.offset.copyFrom(eventPoint);

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
   * @param eventPoint - The point in container coordinates
   */
  protected handlePointerDown<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
    eventPoint: Point,
  ): void {
    const events = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = events.length; i < j; i++) {
      const nativeEvent = events[i];
      this.bootstrapPointerEvent(rootEvent, nativeEvent, eventPoint);
      eventBoundary.mapEvent(rootEvent);
    }

    this.setCursor(eventBoundary.cursor);
  }

  /**
   * Handles pointer move events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source pointer/mouse/touch event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated pointer event
   * @param eventPoint - The point in container coordinates
   */
  protected handlePointerMove<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
    eventPoint: Point,
  ): void {
    if (!this.features.move) return;

    EventsTicker.pointerMoved();

    const normalizedEvents = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      this.bootstrapPointerEvent(rootEvent, normalizedEvents[i], eventPoint);
      eventBoundary.mapEvent(rootEvent);
    }

    this.setCursor(eventBoundary.cursor);
  }

  /**
   * Handles pointer up events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source pointer/mouse/touch event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated pointer event
   * @param eventPoint - The point in container coordinates
   */
  protected handlePointerUp<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
    eventPoint: Point,
  ): void {
    if (!this.features.click) return;

    const target = (sourceEvent as Event).target;

    // TODO implement this
    const outside = target !== this.domElement ? "outside" : "";
    const normalizedEvents = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      this.bootstrapPointerEvent(rootEvent, normalizedEvents[i], eventPoint);
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
   * @param eventPoint - The point in container coordinates
   */
  protected handlePointerOverOut<T = TouchEvent | MouseEvent | PointerEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedPointerEvent,
    eventPoint: Point,
  ): void {
    if (!this.features.click) return;

    const normalizedEvents = this.normalizeToPointerData(
      sourceEvent as TouchEvent | MouseEvent | PointerEvent,
    );

    for (let i = 0, j = normalizedEvents.length; i < j; i++) {
      this.bootstrapPointerEvent(rootEvent, normalizedEvents[i], eventPoint);
      eventBoundary.mapEvent(rootEvent);
    }

    this.setCursor(eventBoundary.cursor);
  }

  /**
   * Handles wheel events by normalizing and mapping through an event boundary.
   * @param sourceEvent - The source wheel event (may be wrapped)
   * @param eventBoundary - The event boundary to map events through
   * @param rootEvent - The root federated wheel event
   * @param eventPoint - The point in container coordinates
   */
  protected handleWheel<T = WheelEvent>(
    sourceEvent: T,
    eventBoundary: EventBoundary,
    rootEvent: FederatedWheelEvent,
    eventPoint: Point,
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

    rootEvent.screen.copyFrom(eventPoint);
    rootEvent.global.copyFrom(eventPoint);
    rootEvent.offset.copyFrom(eventPoint);

    rootEvent.nativeEvent = wheelEvent;
    rootEvent.type = wheelEvent.type;

    eventBoundary.mapEvent(rootEvent);
  }
}
