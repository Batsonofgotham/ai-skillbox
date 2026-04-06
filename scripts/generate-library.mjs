import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const libraryRoot = path.join(root, "library");
const skillsRoot = path.join(libraryRoot, "skills");
const bundlesRoot = path.join(libraryRoot, "bundles");
const workflowsRoot = path.join(libraryRoot, "workflows");
const catalogRoot = path.join(root, "catalog");

const categories = [
  "brainstorming",
  "coding",
  "debugging",
  "testing",
  "security",
  "architecture",
  "devops",
  "refactoring",
  "documentation",
  "performance",
  "data",
  "frontend"
];

const categoryPrompts = {
  brainstorming: "Generate options, rank trade-offs, and produce a concrete action plan.",
  coding: "Implement clean production-ready code with explicit assumptions and edge-case handling.",
  debugging: "Reproduce failures, isolate root cause, and suggest minimal-risk fixes with validation.",
  testing: "Design robust unit/integration tests, include failure modes, and improve coverage.",
  security: "Inspect for vulnerabilities, prioritize exploitability, and recommend hardening steps.",
  architecture: "Evaluate system design alternatives and justify a scalable maintainable approach.",
  devops: "Automate build/deploy pipelines with safe rollbacks and operational observability.",
  refactoring: "Restructure code safely with behavior-preserving changes and measurable outcomes.",
  documentation: "Create clear docs that explain usage, context, and operational caveats.",
  performance: "Profile bottlenecks and deliver quantified optimization recommendations.",
  data: "Improve data models, transformations, and validation with reliability constraints.",
  frontend: "Ship accessible UX improvements with resilient state handling and testability."
};

const roleBundles = {
  "fullstack-engineer": ["coding", "testing", "debugging", "frontend", "architecture"],
  "backend-engineer": ["coding", "testing", "debugging", "architecture", "performance"],
  "security-reviewer": ["security", "debugging", "testing", "documentation"],
  "sre-devops": ["devops", "debugging", "performance", "architecture", "security"],
  "product-prototyper": ["brainstorming", "frontend", "coding", "documentation"]
};

const workflows = [
  {
    id: "feature-delivery",
    title: "Feature Delivery Workflow",
    steps: ["brainstorming", "architecture", "coding", "testing", "documentation"]
  },
  {
    id: "incident-response",
    title: "Incident Response Workflow",
    steps: ["debugging", "security", "devops", "testing", "documentation"]
  },
  {
    id: "performance-hardening",
    title: "Performance Hardening Workflow",
    steps: ["performance", "debugging", "refactoring", "testing", "devops"]
  },
  {
    id: "secure-release",
    title: "Secure Release Workflow",
    steps: ["security", "testing", "devops", "documentation"]
  }
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function wipeDir(p) {
  fs.rmSync(p, { recursive: true, force: true });
  ensureDir(p);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeSkill(skill) {
  const filePath = path.join(skillsRoot, `${skill.id}.md`);
  fs.writeFileSync(
    filePath,
    `# ${skill.title}

## Metadata
- id: ${skill.id}
- category: ${skill.category}
- difficulty: ${skill.difficulty}
- tags: ${skill.tags.join(", ")}

## Instruction
${skill.instruction}

## Input Template
1. Context: <repo/module/system details>
2. Goal: <what outcome is required>
3. Constraints: <time, quality, compatibility constraints>
4. Output format: <how results should be structured>

## Success Checklist
- Provides assumptions and risks explicitly.
- Produces action-oriented output, not generic advice.
- Includes validation or test guidance before completion.
`,
    "utf8"
  );
}

function buildSkills() {
  const skills = [];
  const total = 1200;
  const levels = ["beginner", "intermediate", "advanced"];
  for (let i = 1; i <= total; i += 1) {
    const category = categories[(i - 1) % categories.length];
    const difficulty = levels[(i - 1) % levels.length];
    const id = `skill-${String(i).padStart(4, "0")}`;
    const title = `${category[0].toUpperCase()}${category.slice(1)} ${String(i).padStart(4, "0")}`;
    const tags = [category, difficulty, "reliability", "playbook"];
    const instruction = `${categoryPrompts[category]} Use deterministic steps, ask only necessary clarifying questions, and return a concise execution plan plus final deliverables.`;

    const skill = { id, title, category, difficulty, tags, instruction };
    skills.push(skill);
    writeSkill(skill);
  }
  return skills;
}

function buildBundles(skills) {
  const byCategory = new Map(categories.map((c) => [c, []]));
  for (const skill of skills) byCategory.get(skill.category).push(skill.id);

  for (const [name, categoryList] of Object.entries(roleBundles)) {
    const skillIds = categoryList.flatMap((category) => byCategory.get(category).slice(0, 40));
    writeJson(path.join(bundlesRoot, `${name}.json`), {
      id: name,
      title: name
        .split("-")
        .map((x) => x[0].toUpperCase() + x.slice(1))
        .join(" "),
      categories: categoryList,
      skillCount: skillIds.length,
      skills: skillIds
    });
  }
}

function buildWorkflows(skills) {
  const byCategory = new Map(categories.map((c) => [c, []]));
  for (const skill of skills) byCategory.get(skill.category).push(skill.id);

  for (const workflow of workflows) {
    const resolvedSteps = workflow.steps.map((category, index) => ({
      order: index + 1,
      category,
      recommendedSkills: byCategory.get(category).slice(0, 8)
    }));

    writeJson(path.join(workflowsRoot, `${workflow.id}.json`), {
      id: workflow.id,
      title: workflow.title,
      description: `A multi-step workflow for ${workflow.title.toLowerCase()}.`,
      steps: resolvedSteps
    });
  }
}

function buildCatalog(skills) {
  ensureDir(catalogRoot);
  writeJson(path.join(catalogRoot, "skills.json"), {
    generatedAt: new Date().toISOString(),
    totalSkills: skills.length,
    categories,
    skills
  });
}

function main() {
  wipeDir(libraryRoot);
  ensureDir(skillsRoot);
  ensureDir(bundlesRoot);
  ensureDir(workflowsRoot);
  ensureDir(catalogRoot);

  const skills = buildSkills();
  buildBundles(skills);
  buildWorkflows(skills);
  buildCatalog(skills);
  console.log(`Generated ${skills.length} skills.`);
}

main();
