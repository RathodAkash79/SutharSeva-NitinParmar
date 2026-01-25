// Railway Production Backend ONLY
export const API_BASE_URL = "https://sutharseva-nitinparmar-production.up.railway.app";

if (!API_BASE_URL) {
  console.error("❌ CRITICAL: API_BASE_URL is not configured!");
  console.error("API calls will FAIL. Check environment setup.");
}

export function apiUrl(path: string): string {
  const url = `${API_BASE_URL}${path}`;
  console.debug(`📡 API Call: ${url}`);
  return url;
}

// Test API connectivity (call once on app start)
export async function testApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/api/health"), {
      method: "GET",
    });
    const isOk = response.ok;
    console.log(isOk ? "✅ API is healthy" : "❌ API health check failed");
    return isOk;
  } catch (error) {
    console.error("❌ API unreachable:", error);
    return false;
  }
}
