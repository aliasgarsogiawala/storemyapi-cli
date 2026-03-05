import open from "open";
import { api } from "../utils/api";
import { saveConfig } from "../utils/config";

type LoginOptions = {
  browser?: boolean; 
};

export async function login(opts: LoginOptions = {}) {
  try {
    console.log("Starting CLI authentication...");

    
    const { data } = await api.post("/cli/start");

    const {
      deviceCode,
      userCode,
      verificationUrl,           
      verificationUrlNoBrowser,  
    } = data;

    if (opts.browser === false) {
      console.log(`
🔐 Authentication required

1. Open this URL:
   ${verificationUrlNoBrowser}

2. Enter this code:
   ${userCode}

Waiting for confirmation...
`);
    } else {
      console.log("Opening browser to authenticate...");
      await open(verificationUrl);
      console.log("Waiting for verification...");
    }

    while (true) {
      await new Promise((res) => setTimeout(res, 3000));

      const pollRes = await api.get(`/cli/poll?code=${deviceCode}`);

      if (pollRes.data?.expired) {
        console.log("❌ Code expired. Run: storemyapi login");
        return;
      }

      if (pollRes.data?.verified) {
        const userId = pollRes.data.userId;

        const tokenRes = await api.post("/cli/token", { userId });
        const { token } = tokenRes.data;

        saveConfig({
          accessToken: token,
          userId,
        });

        console.log("\n✅ Logged in successfully!");
        return;
      }
    }
  } catch (err: any) {
    const status = err?.response?.status;
    const url = err?.config?.url;
    const data = err?.response?.data;
    console.error("Login failed:", status, url, data || err.message);
  }
}