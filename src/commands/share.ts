import fs from "fs";
import path from "path";
import chalk from "chalk";
import { api } from "../utils/api";
import { getConfig } from "../utils/config";

const LOCAL_FILE = ".storemyapi.json";

function getProjectId(): string | null {
  const p = path.join(process.cwd(), LOCAL_FILE);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"))?.projectId ?? null;
  } catch {
    return null;
  }
}

function guardAuth() {
  const auth = getConfig();
  if (!auth?.accessToken) {
    console.log(chalk.red("Not authenticated."));
    console.log("Run: storemyapi login");
    return null;
  }
  return auth;
}

function guardProject() {
  const projectId = getProjectId();
  if (!projectId) {
    console.log(chalk.red("No linked project found."));
    console.log("Run: storemyapi init  or  storemyapi link");
    return null;
  }
  return projectId;
}

const VALID_PERMISSIONS = ["read", "write"];

export async function shareAdd(email: string, permission: string) {
  if (!VALID_PERMISSIONS.includes(permission)) {
    console.log(chalk.red(`Invalid permission "${permission}". Use: read or write`));
    return;
  }

  try {
    const auth = guardAuth();
    if (!auth) return;
    const projectId = guardProject();
    if (!projectId) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    await api.post(`/projects/${projectId}/share`, { email, permission }, { headers });
    console.log(chalk.green(`Shared with ${email} as ${permission}`));
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.log(chalk.red(`No user found with email "${email}".`));
      return;
    }
    if (status === 403) {
      console.log(chalk.red("Only the project owner can share it."));
      return;
    }
    console.error(chalk.red("share add failed:"), err?.response?.data || err.message);
  }
}

export async function shareRemove(email: string) {
  try {
    const auth = guardAuth();
    if (!auth) return;
    const projectId = guardProject();
    if (!projectId) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    await api.delete(`/projects/${projectId}/share`, { headers, data: { email } });
    console.log(chalk.green(`Removed ${email} from project`));
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.log(chalk.red(`"${email}" does not have access to this project.`));
      return;
    }
    if (status === 403) {
      console.log(chalk.red("Only the project owner can manage access."));
      return;
    }
    console.error(chalk.red("share remove failed:"), err?.response?.data || err.message);
  }
}

export async function shareInvites() {
  try {
    const auth = guardAuth();
    if (!auth) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const res = await api.get("/invites", { headers });
    const invites: { id: string; projectName: string; ownerEmail: string; permission: string }[] = res.data?.invites ?? [];

    if (!invites.length) {
      console.log(chalk.yellow("No pending invites."));
      return;
    }

    const inquirer = (await import("inquirer")).default;

    const { selectedId } = await inquirer.prompt([
      {
        type: "select",
        name: "selectedId",
        message: "Select an invite:",
        choices: invites.map((inv) => ({
          name: `${inv.projectName}  •  from ${inv.ownerEmail}  •  ${inv.permission}`,
          value: inv.id,
        })),
      },
    ]);

    const { action } = await inquirer.prompt([
      {
        type: "select",
        name: "action",
        message: "What do you want to do?",
        choices: [
          { name: "Accept", value: "accept" },
          { name: "Decline", value: "decline" },
        ],
      },
    ]);

    if (action === "accept") {
      await api.post(`/invites/${selectedId}/accept`, {}, { headers });
      console.log(chalk.green("Invite accepted. Run: storemyapi link  to link this project locally."));
    } else {
      await api.post(`/invites/${selectedId}/decline`, {}, { headers });
      console.log(chalk.green("Invite declined."));
    }
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.log(chalk.red("Invite not found or already resolved."));
      return;
    }
    console.error(chalk.red("share invites failed:"), err?.response?.data || err.message);
  }
}

export async function shareAccept(inviteId: string) {
  try {
    const auth = guardAuth();
    if (!auth) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    await api.post(`/invites/${inviteId}/accept`, {}, { headers });
    console.log(chalk.green("Invite accepted. Run: storemyapi link  to link this project locally."));
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.log(chalk.red("Invite not found or already resolved."));
      return;
    }
    console.error(chalk.red("share accept failed:"), err?.response?.data || err.message);
  }
}

export async function shareDecline(inviteId: string) {
  try {
    const auth = guardAuth();
    if (!auth) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    await api.post(`/invites/${inviteId}/decline`, {}, { headers });
    console.log(chalk.green("Invite declined."));
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404) {
      console.log(chalk.red("Invite not found or already resolved."));
      return;
    }
    console.error(chalk.red("share decline failed:"), err?.response?.data || err.message);
  }
}

export async function shareList() {
  try {
    const auth = guardAuth();
    if (!auth) return;
    const projectId = guardProject();
    if (!projectId) return;

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const res = await api.get(`/projects/${projectId}/share`, { headers });
    const members: { email: string; permission: string }[] = res.data?.members ?? [];

    if (!members.length) {
      console.log(chalk.yellow("No collaborators on this project."));
      return;
    }

    console.log("");
    for (const m of members) {
      const perm = m.permission === "write" ? chalk.blue("write") : chalk.gray("read");
      console.log(`${m.email} ${chalk.gray("•")} ${perm}`);
    }
    console.log("");
    console.log(chalk.gray(`${members.length} collaborator(s)`));
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 403) {
      console.log(chalk.red("Only the project owner can view collaborators."));
      return;
    }
    console.error(chalk.red("share list failed:"), err?.response?.data || err.message);
  }
}
