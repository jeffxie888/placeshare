"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` at import time, so it can only load in the
// browser - dynamic + ssr:false keeps it out of the server render.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-900">
      Loading map…
    </div>
  ),
});

export default MapView;
