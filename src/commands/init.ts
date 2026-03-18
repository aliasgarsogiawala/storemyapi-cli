import fs from "fs";
import path from "path";
import chalk from "chalk";
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
      console.log(chalk.red("Not authenticated."));
      console.log("Run: storemyapi login");
      return;
    }

    if (fs.existsSync(localPath())) {
      console.log(chalk.yellow(`${LOCAL_FILE} already exists in this folder.`));
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

    console.log("Creating project...");

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

    console.log(chalk.green("\nInitialized!"));
    console.log(`Project: ${project.name}`);
    console.log(`Linked locally via ${LOCAL_FILE}`);
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error(chalk.red("Init failed:"), status, data || err.message);
  }
}
