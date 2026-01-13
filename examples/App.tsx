import type { PropsWithChildren } from "react";
import { useState } from "react";

import { BasicScene } from "./scene/basic-scene";
import { DemandRendering } from "./scene/demand-rendering";

type Tab = "unmounted" | "basic" | "demand";

function App() {
  const [tab, setTab] = useState<Tab>("basic");

  const tabStyle = (t: Tab) =>
    `cursor-pointer p-2 rounded-sm ${
      tab === t ? "bg-amber-400" : "bg-amber-500 hover:bg-amber-400"
    }`;

  return (
    <div className="flex h-screen flex-col">
      <div className="bg-neutral-300 p-4">
        <h1 className="text-2xl">Pixi + Three</h1>
        <div className="mt-2 flex items-center gap-2">
          <button
            className={tabStyle("unmounted")}
            onClick={() => setTab("unmounted")}
          >
            Unmount
          </button>
          <button className={tabStyle("basic")} onClick={() => setTab("basic")}>
            Basic
          </button>
          <button
            className={tabStyle("demand")}
            onClick={() => setTab("demand")}
          >
            Demand
          </button>
        </div>
      </div>
      {tab === "unmounted" && (
        <CenteredContent>Canvas unmounted</CenteredContent>
      )}
      {tab === "basic" && <BasicScene />}
      {tab === "demand" && <DemandRendering />}
    </div>
  );
}

function CenteredContent({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-1 items-center justify-center">{children}</div>
  );
}

export default App;
