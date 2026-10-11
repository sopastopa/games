import { readdir, readFile, mkdir, writeFile, rm, cp } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const gamesDir = join(root, "games");
const portalDir = join(root, "apps/portal");
const output = join(root, "dist");
const slugPattern = /^[a-z][a-z0-9-]*$/;
const discovered = [];
for (const entry of await readdir(gamesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const metadata = JSON.parse(
    await readFile(join(gamesDir, entry.name, "game.json"), "utf8"),
  );
  if (
    !slugPattern.test(entry.name) ||
    metadata.id !== entry.name ||
    typeof metadata.title !== "string" ||
    !metadata.title.trim() ||
    typeof metadata.description !== "string" ||
    typeof metadata.category !== "string" ||
    typeof metadata.icon !== "string" ||
    typeof metadata.accent !== "string" ||
    typeof metadata.published !== "boolean"
  ) {
    throw new Error(`Invalid game metadata: ${entry.name}`);
  }
  if (metadata.published) discovered.push(metadata);
}
discovered.sort((a, b) => a.title.localeCompare(b.title, "fr"));
await mkdir(join(portalDir, "public"), { recursive: true });
const catalog = discovered.map(
  ({ id, title, description, category, icon, accent }) => ({
    id,
    title,
    description,
    category,
    icon,
    accent,
  }),
);
await writeFile(
  join(portalDir, "public/catalog.json"),
  JSON.stringify(catalog, null, 2) + "\n",
);
function build(directory) {
  const result = spawnSync("pnpm", ["exec", "vite", "build"], {
    cwd: directory,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error(`Build failed: ${directory}`);
}
await rm(output, { recursive: true, force: true });
build(portalDir);
await cp(join(portalDir, "dist"), output, { recursive: true });
for (const game of discovered) {
  const directory = join(gamesDir, game.id);
  build(directory);
  await mkdir(join(output, "play", game.id), { recursive: true });
  await cp(join(directory, "dist"), join(output, "play", game.id), {
    recursive: true,
  });
}
await writeFile(join(output, ".nojekyll"), "");
console.log(
  `Built portal and ${discovered.length} published game(s) into dist/`,
);
