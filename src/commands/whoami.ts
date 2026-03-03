import axios from "axios";
import { getConfig } from "../utils/config";

export async function whoami() {
  try {
    const config = getConfig();

    if (!config?.accessToken) {
      console.log("❌ You are not logged in.");
      console.log("Run: storemyapi login");
      return;
    }

    const res = await axios.get(
      "https://storemyapi.dev/api/cli/me",
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
      }
    );

    console.log("👤 Logged in as:");
    console.log("User ID:", res.data.userId);

  } catch (err: any) {
    console.log("❌ Session invalid or expired.");
    console.log("Run: storemyapi login");
  }
}