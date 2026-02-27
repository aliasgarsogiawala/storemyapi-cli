import { api } from "../utils/api";
import { saveConfig } from "../utils/config";
import open from "open";

export async function login() {
  try {
    console.log("Starting CLI authentication...");

    const { data } = await api.post("/cli/start");

    const { deviceCode, verificationUrl } = data;

    console.log("Opening browser to authenticate...");
    await open(verificationUrl);

    console.log("Waiting for verification...");

    let authenticated = false;

    while (!authenticated) {
      await new Promise((res) => setTimeout(res, 3000));

      const statusRes = await api.get(`/cli/status?code=${deviceCode}`);

      if (statusRes.data.verified) {
        const { accessToken, refreshToken, user } = statusRes.data;

        saveConfig({
          accessToken,
          refreshToken,
          userId: user.id,
          email: user.email,
        });

        console.log("✅ Logged in successfully!!");
        authenticated = true;
      }
    }
  } catch (err: any) {
    console.error("Login failed:", err.message);
  }
}