import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogDir = path.join(root, "catalog");
const htmlPath = path.join(catalogDir, "index.html");
const skillsJsonPath = path.join(catalogDir, "skills.json");
const skillsJson = fs.readFileSync(skillsJsonPath, "utf8");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>AI Skillbox Catalog</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
    .intro {
      border: 1px solid #666;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      margin: 0.5rem 0 1rem;
      line-height: 1.45;
    }
    input { width: 100%; padding: 0.75rem; font-size: 1rem; border-radius: 8px; border: 1px solid #888; }
    .meta { margin: 1rem 0; opacity: .8; }
    .layout { display: grid; grid-template-columns: minmax(420px, 1fr) 420px; gap: 1rem; align-items: start; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
    .load-sentinel { height: 1px; }
    .card {
      border: 1px solid #666; border-radius: 10px; padding: 0.75rem; cursor: pointer;
      background: transparent; text-align: left;
    }
    .card:hover { border-color: #8caeff; }
    .card.active { border-color: #6ea8ff; box-shadow: 0 0 0 1px #6ea8ff inset; }
    .id { font-family: ui-monospace, monospace; font-size: .9rem; opacity: .85; }
    .tags { margin-top: 0.5rem; font-size: .85rem; opacity: .85; }
    .panel { border: 1px solid #666; border-radius: 10px; padding: 1rem; position: sticky; top: 1rem; }
    .panel h2 { margin-top: 0.25rem; }
    .muted { opacity: .85; }
    .prompt {
      white-space: pre-wrap;
      border: 1px solid #666;
      border-radius: 8px;
      padding: 0.75rem;
      font-family: ui-monospace, monospace;
      font-size: .9rem;
      margin: 0.75rem 0;
    }
    .row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    button.action {
      border: 1px solid #777; border-radius: 8px; background: transparent; color: inherit;
      padding: 0.45rem 0.7rem; cursor: pointer;
    }
    button.action:hover { border-color: #a5a5a5; }
    @media (max-width: 980px) {
      .layout { grid-template-columns: 1fr; }
      .panel { position: static; }
    }
  </style>
</head>
<body>
  <h1>AI Skillbox Catalog</h1>
  <div class="intro">
    AI Skillbox is a public library of 1,200+ reusable playbooks for AI coding assistants like Cursor,
    Claude, and Gemini. Use this catalog to discover reliable prompts for brainstorming, coding, debugging,
    testing, security review, and delivery workflows. Click any skill card to view its full explanation,
    copy a ready-to-run prompt, and adapt it to your project.
  </div>
  <p>Search across all skills by id, title, category, difficulty, or tags.</p>
  <input id="q" placeholder="Try: security advanced or skill-0931" />
  <div class="meta" id="meta">Loading...</div>
  <div class="layout">
    <div>
      <div class="grid" id="list"></div>
      <div class="load-sentinel" id="loadSentinel"></div>
    </div>
    <aside class="panel" id="detail">
      <div class="muted">Select a skill card to view explanation and prompt.</div>
    </aside>
  </div>

  <script>
    const EMBEDDED_DATA = ${skillsJson};
    const q = document.getElementById("q");
    const meta = document.getElementById("meta");
    const list = document.getElementById("list");
    const detail = document.getElementById("detail");
    const loadSentinel = document.getElementById("loadSentinel");
    let activeSkillId = null;
    let filteredSkills = [];
    let totalSkills = 0;
    let visibleCount = 0;
    const batchSize = 25;
    let observer = null;

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function createPromptTemplate(s) {
      return [
        "You are my AI coding assistant.",
        "",
        "Use this skill:",
        "- id: " + s.id,
        "- title: " + s.title,
        "- category: " + s.category,
        "- difficulty: " + s.difficulty,
        "",
        "Instruction:",
        s.instruction,
        "",
        "Context: <repo/module/system details>",
        "Goal: <what outcome is required>",
        "Constraints: <time, quality, compatibility constraints>",
        "Output format: <how results should be structured>"
      ].join("\\n");
    }

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const tmp = document.createElement("textarea");
        tmp.value = text;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
      }
    }

    function renderDetail(skill) {
      if (!skill) {
        detail.innerHTML = '<div class="muted">Select a skill card to view explanation and prompt.</div>';
        return;
      }
      const prompt = createPromptTemplate(skill);
      detail.innerHTML = \`
        <div class="id">\${escapeHtml(skill.id)}</div>
        <h2>\${escapeHtml(skill.title)}</h2>
        <div class="muted">Category: <b>\${escapeHtml(skill.category)}</b> | Difficulty: <b>\${escapeHtml(skill.difficulty)}</b></div>
        <div class="tags">Tags: \${(skill.tags || []).map(escapeHtml).join(", ")}</div>
        <h3>Explanation</h3>
        <p>\${escapeHtml(skill.instruction)}</p>
        <h3>Prompt</h3>
        <div class="prompt" id="promptBox">\${escapeHtml(prompt)}</div>
        <div class="row">
          <button class="action" id="copyPrompt">Copy prompt</button>
          <button class="action" id="copyInstruction">Copy explanation</button>
        </div>
      \`;

      document.getElementById("copyPrompt").addEventListener("click", () => copyText(prompt));
      document.getElementById("copyInstruction").addEventListener("click", () => copyText(skill.instruction));
    }

    function render(chooseFirst = false) {
      const shown = filteredSkills.slice(0, visibleCount);
      meta.textContent = "Showing " + shown.length + " of " + totalSkills + " skills";
      if (chooseFirst && shown.length > 0) activeSkillId = shown[0].id;
      if (activeSkillId && !shown.some((s) => s.id === activeSkillId)) {
        activeSkillId = shown[0] ? shown[0].id : null;
      }

      list.innerHTML = shown.map((s) => \`
        <button class="card \${s.id === activeSkillId ? "active" : ""}" data-skill-id="\${s.id}">
          <div class="id">\${s.id}</div>
          <h3>\${s.title}</h3>
          <div>Category: <b>\${s.category}</b></div>
          <div>Difficulty: <b>\${s.difficulty}</b></div>
          <div class="tags">Tags: \${s.tags.join(", ")}</div>
        </button>
      \`).join("");

      const active = shown.find((s) => s.id === activeSkillId) || null;
      renderDetail(active);

      list.querySelectorAll("[data-skill-id]").forEach((el) => {
        el.addEventListener("click", () => {
          activeSkillId = el.getAttribute("data-skill-id");
          render(false);
        });
      });
    }

    function resetAndRender(skills) {
      filteredSkills = skills;
      totalSkills = skills.length;
      visibleCount = Math.min(batchSize, filteredSkills.length);
      render(true);
      if (observer) observer.disconnect();
      observer = new IntersectionObserver((entries) => {
        if (!entries[0] || !entries[0].isIntersecting) return;
        if (visibleCount >= filteredSkills.length) return;
        visibleCount = Math.min(visibleCount + batchSize, filteredSkills.length);
        render(false);
      }, { rootMargin: "200px 0px" });
      observer.observe(loadSentinel);
    }

    function setupCatalog(data) {
      const all = data.skills || [];
      resetAndRender(all);
      q.addEventListener("input", () => {
        const needle = q.value.toLowerCase().trim();
        if (!needle) return resetAndRender(all);
        const filtered = all.filter((s) =>
          [s.id, s.title, s.category, s.difficulty, ...(s.tags || [])]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        );
        resetAndRender(filtered);
      });
    }

    Promise.resolve(EMBEDDED_DATA)
      .then(setupCatalog)
      .catch((err) => {
        meta.textContent = "Failed to load embedded catalog: " + err.message;
        return fetch("./skills.json").then((r) => r.json()).then(setupCatalog);
      })
      .catch((err) => {
        meta.textContent = "Failed to load catalog: " + err.message;
      });
  </script>
</body>
</html>
`;

fs.mkdirSync(catalogDir, { recursive: true });
fs.writeFileSync(htmlPath, html, "utf8");
console.log("Built catalog page.");
