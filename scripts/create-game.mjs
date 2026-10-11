import { cp, readdir, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";

const slug = process.argv[2];
const title = process.argv.slice(3).join(" ") || slug;
if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error(
    "Usage: pnpm create:game <slug> [Title] (lowercase letters, digits and hyphens)",
  );
  process.exit(1);
}
const root = resolve(import.meta.dirname, "..");
const source = join(root, "templates/game");
const target = join(root, "games", slug);
try {
  await access(target);
  console.error(`Game already exists: ${slug}`);
  process.exit(1);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await cp(source, target, { recursive: true });
async function replace(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await replace(file);
    else {
      const content = await readFile(file, "utf8");
      await writeFile(
        file,
        content.replaceAll("__SLUG__", slug).replaceAll("__TITLE__", title),
      );
    }
  }
}
await replace(target);
console.log(
  `Created games/${slug}. Implement the game and its tests, then run pnpm verify.`,
);
