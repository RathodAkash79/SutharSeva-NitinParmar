// Backend API base URL (from environment)
const ENV_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

export const API_BASE_URL = ENV_API_BASE_URL.replace(/\/$/, "");

if (!API_BASE_URL) {
  console.error("❌ CRITICAL: API_BASE_URL is not configured!");
  console.error("API calls will FAIL. Check environment setup.");
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;
  console.debug(`📡 API Call: ${url}`);
  return url;
}

export function resolveApiAssetUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (!API_BASE_URL) return url;
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function optimizeImageUrl(
  url: string,
  options: { width?: number; quality?: number } = {}
): string {
  if (!url) return url;
  const width = options.width || 800;
  const quality = options.quality || 60;

  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const [prefix, rest] = url.split("/upload/");
  if (!rest) return url;

  const firstSegment = rest.split("/")[0] || "";
  if (firstSegment.startsWith("f_") || firstSegment.startsWith("q_") || firstSegment.startsWith("w_")) {
    return url;
  }

  const transform = `f_auto,q_${quality},w_${width},c_limit`;
  return `${prefix}/upload/${transform}/${rest}`;
}

// Test API connectivity (call once on app start)
export async function testApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/api/health"), {
      method: "GET",
      mode: "cors",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      console.log("❌ API health check failed");
      return false;
    }
    const data = await response.json().catch(() => null);
    const isOk = !!data && data.status === "ok";
    console.log(isOk ? "✅ API is healthy" : "❌ API health check failed");
    return isOk;
  } catch (error) {
    console.error("❌ API unreachable:", error);
    return false;
  }
}
