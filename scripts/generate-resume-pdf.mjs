import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const tempDir = path.join(projectRoot, "tmp", "resume-pdf");
const bundledDataPath = path.join(tempDir, "resume-data.mjs");
const jsonDataPath = path.join(tempDir, "resume-data.json");
const resumeSourcePath = path.join(projectRoot, "src", "data", "resume.ts");
const rendererPath = path.join(__dirname, "render-resume-pdf.py");

await mkdir(tempDir, { recursive: true });

await build({
  entryPoints: [resumeSourcePath],
  outfile: bundledDataPath,
  bundle: true,
  format: "esm",
  platform: "node",
  logLevel: "silent",
});

const resumeModule = await import(`${pathToFileURL(bundledDataPath).href}?t=${Date.now()}`);
const resume = resumeModule.resume;

if (resume == null || typeof resume !== "object") {
  throw new Error("Expected src/data/resume.ts to export a resume object.");
}

const outputPath = path.join(projectRoot, "public", resume.pdfPath.replace(/^\//, ""));
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(jsonDataPath, JSON.stringify(resume, null, 2));

const bundledPython = path.join(
  os.homedir(),
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "python",
  "bin",
  "python3",
);

const pythonCandidates = [
  process.env.PYTHON,
  existsSync(bundledPython) ? bundledPython : undefined,
  "python3",
].filter(Boolean);

const failures = [];
let rendered = false;

for (const python of pythonCandidates) {
  const result = spawnSync(python, [rendererPath, jsonDataPath, outputPath], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  if (result.status === 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    rendered = true;
    break;
  }

  failures.push({
    python,
    status: result.status,
    error: result.error?.message,
    stderr: result.stderr,
  });
}

await rm(tempDir, { recursive: true, force: true });

if (!rendered) {
  console.error("Could not generate the resume PDF.");
  console.error("Tried Python commands:");
  for (const failure of failures) {
    console.error(`- ${failure.python}: ${failure.error || failure.stderr || `exit ${failure.status}`}`);
  }
  console.error("Install reportlab for your Python environment, or run with PYTHON=/path/to/python.");
  process.exit(1);
}

console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
