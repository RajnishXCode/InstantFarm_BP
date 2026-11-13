// Renders site/index.html into release/index.html.
// Values come from the project files at build time, so the page stays static
// and only needs redeploying when the project changes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

const pkg = read("package.json");
const bpManifest = read("behavior_pack/manifest.json");
const recipe = read("behavior_pack/recipes/ore_detector.json")["minecraft:recipe_shaped"];

const ITEM_LABELS = {
    "minecraft:emerald": "Emerald",
    "minecraft:iron_ingot": "Iron Ingot",
    "minecraft:redstone": "Redstone",
    "minecraft:diamond": "Diamond",
    "minecraft:copper_ingot": "Copper Ingot",
    "minecraft:amethyst_shard": "Amethyst Shard",
    "minecraft:compass": "Compass"
};

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function itemLabel(itemId) {
    return ITEM_LABELS[itemId] ?? itemId.replace(/^minecraft:/, "").replace(/_/g, " ");
}

function renderRecipe() {
    const used = new Map();
    const cells = [];

    for (const row of recipe.pattern) {
        for (const symbol of row) {
            if (symbol === " ") {
                cells.push(`<div class="slot empty">empty</div>`);
                continue;
            }

            const item = recipe.key[symbol].item;
            used.set(symbol, item);
            cells.push(
                `<div class="slot" title="${escapeHtml(itemLabel(item))}">` +
                `<span class="letter">${escapeHtml(symbol)}</span>` +
                `${escapeHtml(itemLabel(item))}</div>`
            );
        }
    }

    const legend = [...used.entries()]
        .map(([symbol, item]) => `<li><strong>${escapeHtml(symbol)}</strong> = ${escapeHtml(itemLabel(item))}</li>`)
        .join("");

    return {
        grid: `<div class="recipe-grid">${cells.join("")}</div>`,
        legend
    };
}

function apiVersion() {
    const dependency = bpManifest.dependencies.find(d => d.module_name === "@minecraft/server");
    return dependency?.version ?? "unknown";
}

function render() {
    const env = process.env;
    const { grid, legend } = renderRecipe();

    const values = {
        VERSION: pkg.version,
        MIN_ENGINE: bpManifest.header.min_engine_version.join("."),
        SCRIPT_API: apiVersion(),
        DEPLOYED_AT_ISO: env.DEPLOYED_AT_ISO ?? new Date().toISOString(),
        DEPLOYED_AT: env.DEPLOYED_AT ?? new Date().toUTCString(),
        BUILD_COMMIT: env.BUILD_COMMIT ?? "local",
        BUILD_URL: env.BUILD_URL ?? "#",
        BUILD_NUMBER: env.GITHUB_RUN_NUMBER ?? "0",
        RECIPE_GRID: grid,
        RECIPE_LEGEND: legend
    };

    const template = fs.readFileSync(path.join(root, "site/index.html"), "utf8");

    const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => {
        if (!(key in values)) {
            throw new Error(`Unknown placeholder in site template: ${match}`);
        }

        return values[key];
    });

    if (/\{\{[A-Z_]+\}\}/.test(html)) {
        throw new Error("Unreplaced placeholder left in rendered page");
    }

    fs.mkdirSync(path.join(root, "release"), { recursive: true });
    fs.writeFileSync(path.join(root, "release/index.html"), html);

    console.log(`Rendered release/index.html for v${pkg.version}`);
}

render();
