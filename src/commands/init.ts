import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function localPath() {
  return path.join(process.cwd(), LOCAL_FILE);
}

export async function init() {
  try {
    const auth = getConfig();
    if (!auth?.accessToken) {
      console.log("❌ You are not logged in.");
      console.log("Run: storemyapi login");
      return;
    }

    console.log("token:", auth.accessToken?.slice(0, 25));

    if (fs.existsSync(localPath())) {
      console.log(`⚠️ ${LOCAL_FILE} already exists in this folder.`);
      console.log("This project is already initialized.");
      return;
    }

    const defaultName = path.basename(process.cwd());

    const { name, description } = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Project name:",
        default: defaultName,
        validate: (v) => (String(v).trim() ? true : "Project name cannot be empty"),
      },
      {
        type: "input",
        name: "description",
        message: "Description (optional):",
      },
    ]);

    console.log("Creating project on dashboard...");

    const res = await api.post(
      "/projects",
      { name, description },
      { headers: { Authorization: `Bearer ${auth.accessToken}` } }
    );

    const project = res.data.project;

    fs.writeFileSync(
      localPath(),
      JSON.stringify(
        {
          projectId: project.id,
          projectName: project.name,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log("\n✅ Initialized!");
    console.log(`Project created: ${project.name}`);
    console.log(`Linked locally via ${LOCAL_FILE}`);
  } catch (err: any) {
    const status = err?.response?.status;
    const url = err?.config?.url;
    const data = err?.response?.data;
    console.error("Init failed:", status, url, data || err.message);
  }
}