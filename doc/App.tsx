import type { PropsWithChildren } from "react";
import { useState } from "react";
import { BasicScene } from "./scene/basic-scene";

type Tab = "unmounted" | "basic";

function App() {
  const [tab, setTab] = useState<Tab>("basic");

  const tabStyle = (t: Tab) =>
    `cursor-pointer p-2 rounded-sm ${
      tab === t ? "bg-amber-400" : "bg-amber-500 hover:bg-amber-400"
    }`;

  return (
    <div className="h-screen flex flex-col">
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
        </div>
      </div>
      {tab === "unmounted" && (
        <CenteredContent>Canvas unmounted</CenteredContent>
      )}
      {tab === "basic" && <BasicScene />}
    </div>
  );
}

function CenteredContent({ children }: PropsWithChildren) {
  return (
    <div className="flex-1 flex items-center justify-center">{children}</div>
  );
}

export default App;
