import { useEffect, useState } from "react";

type ReportedPosture = "continuous" | "folded";
export type Posture = ReportedPosture | "unsupported";

interface DevicePosture extends EventTarget {
  readonly type: ReportedPosture;
}

// Local augmentation also works with lib.dom versions that omit this API.
type FoldableNavigator = Navigator & { readonly devicePosture?: DevicePosture };

export function useDevicePosture(): { posture: Posture; isFlex: boolean } {
  const [posture, setPosture] = useState<Posture>("unsupported");

  useEffect(() => {
    const device = (navigator as FoldableNavigator).devicePosture;
    if (device) {
      const update = () => setPosture(device.type);
      device.addEventListener("change", update);
      update();
      return () => device.removeEventListener("change", update);
    }

    if (typeof window.matchMedia !== "function") return;
    const folded = window.matchMedia("(device-posture: folded)");
    const continuous = window.matchMedia("(device-posture: continuous)");
    // Unknown media features match neither query, even on a flat screen.
    const update = () => setPosture(folded.matches ? "folded" :
      continuous.matches ? "continuous" : "unsupported");
    folded.addEventListener("change", update);
    continuous.addEventListener("change", update);
    update();
    return () => {
      folded.removeEventListener("change", update);
      continuous.removeEventListener("change", update);
    };
  }, []);

  return { posture, isFlex: posture === "folded" };
}
