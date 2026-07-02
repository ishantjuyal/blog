import { spawn, spawnSync } from "node:child_process";
import { existsSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const resumeSourcePath = path.join(projectRoot, "src", "data", "resume.ts");
const generateScriptPath = path.join(__dirname, "generate-resume-pdf.mjs");
const astroBin = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "astro.cmd" : "astro",
);

function generateResumePdf() {
  const result = spawnSync(process.execPath, [generateScriptPath], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  return result.status === 0;
}

if (!existsSync(astroBin)) {
  console.error("Could not find Astro in node_modules. Run npm install first.");
  process.exit(1);
}

if (!generateResumePdf()) {
  process.exit(1);
}

let debounceTimer;
const resumeWatcher = watch(resumeSourcePath, { persistent: true }, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log("Resume data changed. Regenerating PDF...");
    generateResumePdf();
  }, 250);
});

const astro = spawn(astroBin, ["dev", ...process.argv.slice(2)], {
  cwd: projectRoot,
  stdio: "inherit",
});

function shutdown(signal) {
  resumeWatcher.close();
  astro.kill(signal);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

astro.on("exit", (code, signal) => {
  resumeWatcher.close();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
