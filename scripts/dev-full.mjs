import { spawn } from "node:child_process";

function spawnProc(command, args, name) {
  const child = spawn(command, args, { stdio: "inherit" });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

const api = spawnProc(
  "node",
  ["--experimental-transform-types", "scripts/dev-api-node.mjs"],
  "api",
);
const app = spawnProc("yarn", ["dev"], "app");

function shutdown() {
  api.kill("SIGTERM");
  app.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
