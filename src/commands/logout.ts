import { clearConfig, getConfig } from "../utils/config";
import { jwtDecode } from "jwt-decode";

type TokenPayload = {
  iat?: number;
  exp?: number;
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function logout() {
  const cfg = getConfig();

  if (!cfg?.accessToken) {
    console.log("You are not logged in.");
    return;
  }

  try {
    const decoded = jwtDecode<TokenPayload>(cfg.accessToken);

    let duration = "";
    if (decoded?.iat) {
      const now = Math.floor(Date.now() / 1000);
      const sessionSeconds = now - decoded.iat;
      duration = formatDuration(sessionSeconds);
    }

    clearConfig();

    console.log("✅ Logged out successfully.");

    if (duration) {
      console.log(`Session duration: ${duration}`);
    }
  } catch {
    clearConfig();
    console.log("✅ Logged out successfully.");
  }
}