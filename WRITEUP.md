# Mintport: Design Notes & Honest Assessment

---

## What I Built and Why I Made the Choices I Did

Mintport is a CLI tool that takes a GitBook export — a directory, a `.zip` file, or a live URL — and produces a Mintlify project ready to run with `mintlify dev`. The core problem is that GitBook and Mintlify use different flavors of extended Markdown. GitBook uses Liquid-style block tags (`{% hint %}`, `{% tabs %}`, `{% stepper %}`, etc.) while Mintlify uses MDX components (`<Note>`, `<Tabs>`, `<Steps>`). A straight copy-paste won't render. The tool exists to close that gap automatically.

**Why a CLI, not a web app.** The people most likely to use this are developers or technical writers who already live in the terminal. A CLI fits their workflow — pipe it into a script, run it in CI, point it at a directory and get output. A web app would add friction for no gain.

**Why TypeScript.** The input is messy (real GitBook exports have inconsistent formatting, mixed HTML and Markdown, partial front-matter). Strong typing makes the data pipeline easier to reason about — I know what shape a `ParsedPage` is by the time it reaches the converter, and the compiler catches mismatches before they become runtime bugs.

**Why a pipeline architecture.** Each converter (`hints.ts`, `tabs.ts`, `stepper.ts`, etc.) handles exactly one GitBook syntax and is applied in sequence. This made it easy to add, test, and debug each component independently. The alternative — one giant regex-replace function — would have been faster to write but impossible to maintain.

**Why `gray-matter` for front-matter.** GitBook exports sometimes include YAML front-matter, sometimes don't, sometimes have malformed YAML. `gray-matter` handles all three cases gracefully and separates content from metadata cleanly, so the converter only ever sees body text.

**Why Turndown for the URL scraper.** When scraping a live GitBook URL, the tool gets back HTML. Turndown converts that HTML to Markdown well enough to feed into the rest of the pipeline. It's not perfect, but it covers the common cases (headings, lists, code blocks, links) without hand-rolling a converter.

---

## Branding Parity: What It Automates, What It Prompts For, and Where It Falls Short

### What It Automates

When a URL is provided as input, the tool fetches the page and attempts to extract branding from the HTML:

- **Site name** — from `<title>` or the `og:site_name` meta tag
- **Primary color** — from CSS custom properties (`--primary`, `--color-primary`)
- **Logo** — by looking for `<img>` elements with `logo` in their `alt`, `class`, or `src`
- **Favicon** — from `<link rel="icon">` or `<link rel="shortcut icon">`

All detected values are written to `mint.json` and listed in the migration report under "auto-detected."

### What It Prompts For

In interactive mode (a real terminal session), the tool uses `inquirer` to ask for any branding fields it couldn't detect: site name, primary color, logo paths, and favicon path. Pre-detected values are shown as defaults and can be accepted with Enter.

In non-interactive mode (piped input, CI environments), it falls back silently to built-in defaults (`"My Docs"`, `#0066CC`, `/images/logo-light.png`, etc.) and prints a note telling the user to edit `mint.json` after the fact.

### Where It Falls Short

**Modern GitBook is a JavaScript SPA.** The scraper fetches static HTML. If the GitBook site renders its navigation and content client-side (which most modern GitBook-hosted sites do), the scraper gets a near-empty shell with almost no extractable content or branding. URL input works best on older or statically-served GitBook instances; for everything else, a downloaded export gives much better results.

**Color extraction is brittle.** CSS custom properties vary by theme. If a GitBook site uses a non-standard property name for its primary color, the tool won't find it and will fall back to the default blue. There's no fallback that parses computed styles or checks button/link colors directly.

**Logo files aren't downloaded automatically.** When a logo URL is detected, the tool records the URL in `mint.json` but doesn't fetch and save the image file. The user still has to copy the logo into `/images/` manually.

**Dark/light logo variants.** Mintlify supports separate logos for light and dark mode (`logo.light` and `logo.dark` in `mint.json`). GitBook typically has one logo. The tool sets placeholder paths for both variants and leaves it to the user to provide the right files.

---

## What Breaks or Degrades at Scale

### At 6+ Migrations Per Week

**Varied source quality becomes the main problem.** The converter was built against GitBook's documented syntax. In practice, GitBook exports from older workspaces, third-party themes, or heavily customized setups contain syntax variations the tool doesn't expect:

- Hints with custom `icon="..."` attributes are stripped, not converted
- Columns blocks lose their layout (content is preserved but flattened with `---` dividers)
- Swagger/OpenAPI blocks (`{% swagger %}`) aren't converted at all — they're commented out and flagged for manual review
- Embedded iframes (YouTube, CodePen, Loom, Figma) become plain links

Each of these is a known gap. At low volume they're acceptable. At 6+ migrations a week, they create a backlog of manual cleanup work that compounds.

**Image path flattening breaks at scale.** All images are copied to a single flat `/images/` directory, regardless of their original folder structure. If two pages reference different files that happen to share the same filename (e.g., `diagram.png` in two different subdirectories), one silently overwrites the other. This is unlikely in a single migration but becomes a real problem across varied source repos.

**Sequential URL scraping is slow.** The scraper fetches pages one at a time. For a large GitBook site with 100+ pages, this can take minutes. There's no concurrency, no progress indicator, and no retry logic for flaky network responses. A failed page mid-scrape means starting over.

**No deduplication across runs.** If the same GitBook export is converted twice to the same output directory, everything is overwritten without warning. There's no diff, no merge, no way to detect "this page hasn't changed since last time."

### With Varied Source Formats

**The tool assumes `SUMMARY.md` exists.** GitBook's export format always includes one, but if a workspace was exported partially or manually assembled, a missing or malformed `SUMMARY.md` causes the entire conversion to fail. There's no fallback that infers structure from the file tree.

**ZIP extraction assumes GitBook's zip layout.** If a zip file has a top-level wrapper directory (or doesn't), the extractor may resolve paths incorrectly. The logic handles the common case but not every variation.

---

## What I'd Improve or Add With More Time

**Swagger/API block conversion.** This is the biggest gap. A large share of developer documentation uses inline API references. Auto-converting Swagger blocks to Mintlify's `<API>` components or OpenAPI references would eliminate the most common reason a page needs manual review.

**Concurrent scraping with retry.** The URL scraper should fetch pages in parallel (with a configurable concurrency limit) and retry on transient errors. This alone would make URL-based migrations 5–10x faster for large sites.

**Logo fetching.** When a logo URL is auto-detected, download it and save it to `/images/`. This would make branding fully automated for URL-based inputs rather than stopping at "here's the URL."

**Incremental / diff mode.** A `--update` flag that compares the current source against a previously-converted output and only rewrites pages that have changed. This would make mintport useful for ongoing sync, not just one-time migration.

**Better column block handling.** Right now column layouts are flattened to `---` dividers. Mintlify supports side-by-side layouts via `<CardGroup cols={2}>` and similar components. Mapping GitBook columns to the closest Mintlify equivalent would preserve more of the original page structure.

**Richer migration report.** The current report is a Markdown file listing pages that need review. A more useful version would generate a Mintlify page (an `.mdx` file) that renders inline previews of each flagged block alongside its original source, so reviewers can see what converted and what didn't without jumping between files.

**Config file support.** Right now all options are CLI flags. A `mintport.config.json` would let teams set defaults (output directory, branding overrides, which block types to auto-skip) and run the same conversion repeatedly without re-specifying everything.
