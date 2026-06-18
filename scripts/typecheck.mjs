import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const isWindows = process.platform === "win32";
function runStep(command, args) {
  const result = isWindows
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", command, ...args], {
        cwd,
        stdio: "inherit",
      })
    : spawnSync(command, args, {
        cwd,
        stdio: "inherit",
        shell: false,
      });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

runStep("node", ["scripts/clean-next-dev-artifacts.mjs"]);
runStep("npx", ["next", "typegen"]);
runStep("npx", ["tsc", "--noEmit", "--incremental", "false"]);
