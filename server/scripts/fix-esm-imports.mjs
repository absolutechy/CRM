// Post-build step: rewrite extensionless relative imports in dist/ to add the
// .js extension. TypeScript emits `import x from "./config/env"` in bundler
// mode, but Node ESM requires `./config/env.js`. This makes `node dist` work
// (and lets the Vercel function import dist/app.js).
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { join, dirname, extname } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../dist", import.meta.url))

const walk = (dir) => {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (extname(p) === ".js") out.push(p)
  }
  return out
}

const needsExt = (spec) =>
  (spec.startsWith("./") || spec.startsWith("../")) &&
  !extname(spec) &&
  !spec.endsWith(".json")

for (const file of walk(root)) {
  let src = readFileSync(file, "utf8")
  const original = src
  const dir = dirname(file)
  // Match both `from "..."` and `import("...")` specifiers.
  src = src.replace(
    /(from\s+|import\s*\()(["'])(\.{1,2}\/[^"')]+)(["'])/g,
    (match, pre, q, spec, q2) => {
      if (!needsExt(spec)) return match
      // "./foo" -> "./foo.js" when that file exists, otherwise "./foo/index.js"
      // for a barrel directory. Node ESM supports neither bare form.
      try {
        if (statSync(join(dir, spec + ".js")).isFile()) {
          return `${pre}${q}${spec}.js${q2}`
        }
      } catch {
        // fall through to the directory case
      }
      try {
        if (statSync(join(dir, spec, "index.js")).isFile()) {
          return `${pre}${q}${spec}/index.js${q2}`
        }
      } catch {
        return match
      }
      return match
    }
  )
  if (src !== original) writeFileSync(file, src)
}

console.log("Rewrote extensionless relative imports in dist/")
