import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { apiUrl } from "@/lib/api";
import { db } from "@/lib/firebase";

interface HealthSnapshot {
  api: string;
  firebase: string;
  cloudinary: string;
  timestamp: number;
}

interface SystemHealthProbeProps {
  enabled?: boolean;
  verbose?: boolean;
}

// Hidden, opt-in health probe for development diagnostics. No UI is rendered.
export function SystemHealthProbe({ enabled = false, verbose = false }: SystemHealthProbeProps) {
  const [status, setStatus] = useState<HealthSnapshot | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let isCancelled = false;
    const controller = new AbortController();

    const log = (label: string, value: string) => {
      if (verbose) {
        console.info(`[system-health] ${label}: ${value}`);
      }
    };

    const checkApi = async () => {
      try {
        const response = await fetch(apiUrl("/health"), {
          method: "HEAD",
          signal: controller.signal,
        });
        return response.ok ? "ok" : `http-${response.status}`;
      } catch (error: any) {
        return error?.message || "api-unreachable";
      }
    };

    const checkFirebase = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, limit(1));
        await getDocs(q);
        return "ok";
      } catch (error: any) {
        return error?.message || "firebase-error";
      }
    };

    const checkCloudinary = async () => {
      const sampleUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
      try {
        const response = await fetch(sampleUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        return response.ok ? "ok" : `cdn-${response.status}`;
      } catch (error: any) {
        return error?.message || "cloudinary-unreachable";
      }
    };

    const run = async () => {
      const [api, firebase, cloudinary] = await Promise.all([
        checkApi(),
        checkFirebase(),
        checkCloudinary(),
      ]);

      if (isCancelled) return;

      const snapshot: HealthSnapshot = {
        api,
        firebase,
        cloudinary,
        timestamp: Date.now(),
      };

      setStatus(snapshot);
      log("api", api);
      log("firebase", firebase);
      log("cloudinary", cloudinary);
    };

    run();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [enabled, verbose]);

  // Hidden by default; can be toggled via code when needed.
  return null;
}
