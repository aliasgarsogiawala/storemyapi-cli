import axios from "axios";
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

      const statusRes = await api.get(`/cli/poll?code=${deviceCode}`);

      if (statusRes.data.verified) {
        // userId comes back from the status poll, now exchange it for tokens
        console.log("Verified user:", statusRes.data.userId);

        const tokenRes = await axios.post(
          "https://storemyapi.dev/api/cli/token",
          {
            userId: statusRes.data.userId,
          }
        );

        console.log("Token received:", tokenRes.data);

        // the token endpoint should respond with the same shape we were
        // previously getting in the status response
        const { token } = tokenRes.data;

saveConfig({
  accessToken: token,
  userId: statusRes.data.userId,
});

        // Display centered success message
        console.log("\n");
        console.log("╔════════════════════════════════════════╗");
        console.log("║   ✅ CLI Authentication                ║");
        console.log("║   CLI authenticated successfully.      ║");
        console.log("║   You can now close this window.       ║");
        console.log("╚════════════════════════════════════════╝");
        console.log("\n");
        authenticated = true;
      }
    }
  } catch (err: any) {
    console.error("Login failed:", err.message);
  }
}