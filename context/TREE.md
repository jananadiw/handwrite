# Tree

Compact retrieval map. Use this before opening source files.

```text
handwrite/
|-- README.md                         # setup, scripts, minimal structure
|-- AGENTS.md                         # project-level agent rules
|-- context/                          # agent routing and retrieval docs
|   |-- AGENTS.md                     # context entry point and workflow
|   |-- decisions.md                  # durable project choices
|   `-- TREE.md                       # compact source map
|-- src/app/                          # Next.js App Router routes and globals
|   |-- globals.css                   # global Tailwind/theme styles
|   |-- layout.tsx                    # root HTML/body shell and metadata
|   `-- page.tsx                      # home route UI
|-- next.config.ts                    # Next.js configuration
|-- eslint.config.mjs                 # ESLint configuration
|-- postcss.config.mjs                # PostCSS/Tailwind configuration
|-- tsconfig.json                     # TypeScript configuration
|-- package.json                      # scripts and dependencies
|-- bun.lock                          # Bun lockfile
`-- next-env.d.ts                     # generated Next.js TypeScript types
```
