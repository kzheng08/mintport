# mintport

A command-line tool that migrates documentation from GitBook to Mintlify.

---

## What it does

Point it at a GitBook export — a folder, a zip file, or a live URL — and it produces a fully structured Mintlify project ready to deploy.

**It handles:**
- Converting all GitBook-specific syntax (callouts, tabs, steps, accordions, code blocks) to Mintlify MDX components
- Building `mint.json` with the full navigation structure from GitBook's `SUMMARY.md`
- Copying images and rewriting internal links
- Prompting for branding (logo, colors, favicon) — auto-detecting what it can
- Generating a migration report that flags anything needing manual review (API blocks, embeds, synced content)

---

## Usage

```bash
# Convert a local GitBook export folder
node dist/index.js convert ./my-gitbook --output ./mintlify-docs

# Convert a zip file
node dist/index.js convert export.zip --output ./mintlify-docs

# Convert a live GitBook site
node dist/index.js convert https://docs.example.com --output ./mintlify-docs

# Preview without writing any files
node dist/index.js convert ./my-gitbook --output ./mintlify-docs --dry-run
```

---

## Output

```
mintlify-docs/
├── mint.json               # Navigation, branding, and colors config
├── _migration_report.md    # What converted cleanly and what needs review
├── images/                 # All assets copied over
└── **/*.mdx                # Every page, converted with proper frontmatter
```

---

## A note on this project

I built this with the help of Claude Code (Anthropic's AI coding assistant). I'm not a software engineer by background — I worked through the architecture, requirements, and iteration with AI as my collaborator, handled the setup and toolchain from scratch on a fresh Mac, and made decisions throughout about structure, behavior, and edge cases.

The goal was to ship something real and useful, not just a prototype. I think it does that.

---

## Tech stack

TypeScript · Node.js · commander · gray-matter · cheerio · axios · inquirer · fs-extra
