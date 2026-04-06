#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const wantsHelp = args.has("--help") || args.has("-h");
  const targets = {
    cursor: args.has("--cursor"),
    claude: args.has("--claude"),
    gemini: args.has("--gemini")
  };
  const all = args.has("--all") || (!targets.cursor && !targets.claude && !targets.gemini);
  const outArg = argv.find((arg) => arg.startsWith("--out="));
  return {
    wantsHelp,
    all,
    targets,
    outDir: outArg ? outArg.slice("--out=".length) : process.cwd()
  };
}

function printHelp() {
  console.log(`ai-skillbox installer

Usage:
  npx ai-skillbox [options]

Options:
  --cursor      Install Cursor integration files
  --claude      Install Claude integration files
  --gemini      Install Gemini integration files
  --all         Install all supported integrations (default)
  --out=<dir>   Install into a specific directory (default: current directory)
  -h, --help    Show this help
`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function canCreateDir(dirPath) {
  try {
    ensureDir(dirPath);
    return true;
  } catch (error) {
    if (error && (error.code === "EPERM" || error.code === "EACCES")) return false;
    throw error;
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function installLibrary(outDir) {
  const librarySrc = path.join(rootDir, "library");
  const catalogSrc = path.join(rootDir, "catalog");
  if (!fs.existsSync(librarySrc) || !fs.existsSync(catalogSrc)) {
    throw new Error(
      "Missing generated assets. Run `npm run build` in the ai-skillbox package before installing."
    );
  }
  const installRoot = path.join(outDir, ".ai-skillbox");
  ensureDir(installRoot);
  copyDir(librarySrc, path.join(installRoot, "library"));
  copyDir(catalogSrc, path.join(installRoot, "catalog"));
  return installRoot;
}

function installCursor(outDir, installRoot) {
  const preferredBase = path.join(outDir, ".cursor");
  const baseDir = canCreateDir(preferredBase) ? preferredBase : path.join(outDir, "cursor");
  const cursorDir = path.join(baseDir, "skills", "ai-skillbox");
  ensureDir(cursorDir);
  writeJson(path.join(cursorDir, "manifest.json"), {
    source: "ai-skillbox",
    libraryPath: path.relative(cursorDir, path.join(installRoot, "library")),
    bundlesPath: path.relative(cursorDir, path.join(installRoot, "library", "bundles")),
    workflowsPath: path.relative(cursorDir, path.join(installRoot, "library", "workflows"))
  });
}

function installClaude(outDir, installRoot) {
  const claudeDir = path.join(outDir, "CLAUDE_SKILLS", "ai-skillbox");
  ensureDir(claudeDir);
  fs.writeFileSync(
    path.join(claudeDir, "README.md"),
    `# Claude Skillbox Integration

Point Claude to this skill library path:
\`${path.join(installRoot, "library")}\`

Catalog:
\`${path.join(installRoot, "catalog", "index.html")}\`
`,
    "utf8"
  );
}

function installGemini(outDir, installRoot) {
  const preferredBase = path.join(outDir, ".gemini");
  const baseDir = canCreateDir(preferredBase) ? preferredBase : path.join(outDir, "gemini");
  const geminiDir = path.join(baseDir, "skills", "ai-skillbox");
  ensureDir(geminiDir);
  writeJson(path.join(geminiDir, "skillbox.json"), {
    libraryPath: path.join(installRoot, "library"),
    catalogPath: path.join(installRoot, "catalog", "index.html"),
    formatVersion: 1
  });
}

function main() {
  try {
    const config = parseArgs(process.argv);
    if (config.wantsHelp) {
      printHelp();
      process.exit(0);
    }

    const outDir = path.resolve(config.outDir);
    ensureDir(outDir);
    const installRoot = installLibrary(outDir);

    const installCursorFlag = config.all || config.targets.cursor;
    const installClaudeFlag = config.all || config.targets.claude;
    const installGeminiFlag = config.all || config.targets.gemini;

    if (installCursorFlag) installCursor(outDir, installRoot);
    if (installClaudeFlag) installClaude(outDir, installRoot);
    if (installGeminiFlag) installGemini(outDir, installRoot);

    console.log("Installed AI Skillbox successfully.");
    console.log(`Library: ${path.join(installRoot, "library")}`);
    console.log(`Catalog: ${path.join(installRoot, "catalog", "index.html")}`);
    console.log(
      `Integrations: ${[
        installCursorFlag ? "cursor" : null,
        installClaudeFlag ? "claude" : null,
        installGeminiFlag ? "gemini" : null
      ]
        .filter(Boolean)
        .join(", ")}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`ai-skillbox install failed: ${message}`);
    process.exit(1);
  }
}

main();
