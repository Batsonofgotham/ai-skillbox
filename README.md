# AI Skillbox

A giant installable toolbox of AI coding-assistant skills for Cursor, Claude, and Gemini.

## What This Includes

- 1,200 pre-written skill playbooks across brainstorming, coding, debugging, testing, security, and more.
- Role-based bundles for common team personas (full-stack, backend, security, SRE, prototyping).
- Multi-step workflows for jobs like feature delivery, incident response, and secure release.
- A searchable catalog page so people can see exactly what is included.
- A simple CLI installer that can be run through `npx`.

## Install

```bash
npx ai-skillbox --all
```

Target specific tools:

```bash
npx ai-skillbox --cursor
npx ai-skillbox --claude
npx ai-skillbox --gemini
```

Install into a specific folder:

```bash
npx ai-skillbox --all --out=/path/to/project
```

## Output Layout

Installation creates:

- `.ai-skillbox/library/skills/*.md` (full playbook library)
- `.ai-skillbox/library/bundles/*.json` (role bundles)
- `.ai-skillbox/library/workflows/*.json` (workflow definitions)
- `.ai-skillbox/catalog/index.html` (searchable catalog)

Tool-specific integration markers:

- Cursor: `.cursor/skills/ai-skillbox/manifest.json`
- Claude: `CLAUDE_SKILLS/ai-skillbox/README.md`
- Gemini: `.gemini/skills/ai-skillbox/skillbox.json`

If hidden directories are blocked by your environment, installer falls back to:

- Cursor: `cursor/skills/ai-skillbox/manifest.json`
- Gemini: `gemini/skills/ai-skillbox/skillbox.json`

## Local Development

```bash
npm run build
node ./bin/ai-skillbox.js --all --out=./sandbox-install
```
