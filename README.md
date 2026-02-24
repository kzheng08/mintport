# mintport

A CLI tool that converts GitBook documentation to [Mintlify](https://mintlify.com) format.

## What it does

- Reads your GitBook export (folder, zip, or live URL)
- Converts all GitBook-specific syntax to Mintlify MDX components
- Generates a valid `mint.json` config with navigation
- Copies all images and assets
- Produces a `_migration_report.md` summarizing what was converted and what needs manual review

## Install

```bash
npm install -g mintport
```

Or run without installing:

```bash
npx mintport convert <input> --output <dir>
```

## Usage

**From a local GitBook export folder:**
```bash
mintport convert ./my-gitbook-export --output ./my-mintlify-docs
```

**From a zip file:**
```bash
mintport convert export.zip --output ./my-mintlify-docs
```

**From a live GitBook URL:**
```bash
mintport convert https://docs.yoursite.com --output ./my-mintlify-docs
```

**Preview without writing files:**
```bash
mintport convert ./my-gitbook-export --output ./out --dry-run
```

**See detailed output:**
```bash
mintport convert ./my-gitbook-export --output ./out --verbose
```

## What gets converted

| GitBook syntax | Mintlify output |
|---|---|
| `{% hint style="info" %}` | `<Note>` |
| `{% hint style="warning" %}` | `<Warning>` |
| `{% hint style="success" %}` | `<Check>` |
| `{% hint style="danger" %}` | `<Warning>` |
| `{% tabs %}` / `{% tab %}` | `<Tabs>` / `<Tab>` |
| `{% stepper %}` / `{% step %}` | `<Steps>` / `<Step>` |
| `{% accordion %}` | `<Accordion>` |
| `{% code title="..." %}` | Code block with title |
| `{% embed url="..." %}` | Markdown link + review flag |
| `{% content-ref %}` | Internal link |
| Synced blocks | Inlined + review flag |
| API/Swagger blocks | Flagged for manual review |

## Output structure

```
output/
├── mint.json               # Mintlify config (navigation, branding, colors)
├── _migration_report.md    # Summary of what needs manual review
├── images/                 # All copied assets
└── **/*.mdx                # Converted pages with frontmatter
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run against the test fixture
npm run test:fixture
```
