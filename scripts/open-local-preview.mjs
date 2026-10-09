import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const uniCommand = resolve(projectRoot, "node_modules", ".bin", "uni.cmd");
const host = "127.0.0.1";
const port = 5173;
const url = `http://${host}:${port}/#/pages/library/index`;

if (!existsSync(uniCommand)) {
  console.error("缺少项目依赖，请先在当前目录运行 pnpm install。");
  process.exit(1);
}

console.log("正在启动 Idol Dance 本地 MVP…");
console.log(`预览地址：${url}`);
console.log("保持此窗口开启即可使用；关闭窗口会停止本地预览。\n");

const escapedUniCommand = uniCommand.replaceAll("'", "''");
const serverCommand = `& '${escapedUniCommand}' --host ${host} --port ${port} --strictPort`;
const server = spawn("powershell.exe", ["-NoProfile", "-Command", serverCommand], {
  cwd: projectRoot,
  stdio: "inherit",
});

let browserOpened = false;
const openBrowserWhenReady = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) return;
    try {
      const response = await fetch(`http://${host}:${port}/`);
      if (response.ok) {
        const powershell = spawn(
          "powershell.exe",
          ["-NoProfile", "-Command", `Start-Process '${url}'`],
          { detached: true, stdio: "ignore", windowsHide: true },
        );
        powershell.unref();
        browserOpened = true;
        console.log("已在默认浏览器打开 Idol Dance。\n");
        return;
      }
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  console.error(`无法自动打开浏览器，请手动访问：${url}`);
};

openBrowserWhenReady();

const stop = () => {
  if (server.exitCode === null) server.kill("SIGINT");
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => {
  if (!browserOpened && code) console.error("本地预览启动失败，请确认 5173 端口没有被占用。");
  process.exit(code ?? 0);
});
