import { traverseFiber, useContextBridge, useFiber } from "its-fine";
import { Fragment, type PropsWithChildren, StrictMode } from "react";

/**
 * Bridges renderer Context and StrictMode from a primary renderer.
 * @internal
 */
export function useBridge() {
  const fiber = useFiber();
  const ContextBridge = useContextBridge();

  return function Bridge({ children }: PropsWithChildren) {
    const strict = !!traverseFiber(
      fiber,
      true,
      (node) => node.type === StrictMode,
    );
    const Root = strict ? StrictMode : Fragment;

    return (
      <Root>
        <ContextBridge>{children}</ContextBridge>
      </Root>
    );
  };
}
