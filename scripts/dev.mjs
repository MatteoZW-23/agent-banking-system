import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  ["--watch", "--import", "tsx", "./server/_core/index.ts"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
