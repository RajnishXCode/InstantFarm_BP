# InstantFarm Behavior Pack

InstantFarm is a Minecraft Bedrock behavior pack that adds a few quality-of-life survival tweaks to make farming and tree growth faster without changing the base game rules too aggressively.

This project is written in TypeScript and bundled into a Minecraft script module for the Bedrock Edition script API.

## Features

- Instant crop growth
  - Automatically pushes planted crops to their maximum growth state when placed.
  - Supports common crops such as wheat, carrots, potatoes, beetroot, melon stems, pumpkin stems, torchflower, and pitcher crops.
- Instant tree generation
  - Replaces planted saplings with the matching tree feature so large trees appear almost immediately.
  - Supports the default tree variants included in the feature configuration.
- Ore Sectors Radar
  - Holding the Ore Detector in your main hand shows the radar in the actionbar above the hotbar. Switching to another item hides it.
  - The radar shows your facing direction as a heading in degrees, a compass tape with the current direction in brackets, and a top-down grid with you at the center and forward at the top. Ores appear in their real direction.
  - Scans a 32-block radius every second for coal, iron, copper, gold, redstone, lapis, diamond, emerald, nether gold, nether quartz and ancient debris, including deepslate variants.
  - Lists the three nearest ore veins sorted by distance, each with its distance, a plain-language direction (ahead, behind-left, right, and so on) and vertical offset.
  - Direction and distance update as you move or turn, without rescanning.

## Project structure

- `src/main.ts` - registers and initializes all enabled features.
- `src/core/registry.ts` - simple feature registration and startup system.
- `src/features/crops/index.ts` - crop growth logic.
- `src/features/trees/index.ts` - instant tree generation logic.
- `src/features/ore-radar/index.ts` - ore radar initialization and tick loop.
- `src/features/ore-radar/detector.ts` - held-item detection, scan scheduling, and per-player radar state.
- `src/features/ore-radar/scanner.ts` - chunk-based ore scanning with a short-lived chunk cache.
- `src/features/ore-radar/direction.ts` - view-relative direction, distance, and vertical offset.
- `src/features/ore-radar/hud.ts` - actionbar text layout.
- `src/features/ore-radar/config.ts` - radius, intervals, result limit, and supported ore blocks.
- `behavior_pack/manifest.json` - behavior pack metadata and script entry configuration.
- `behavior_pack/scripts/main.js` - generated bundled script output.

## Tech stack

- TypeScript
- ESBuild
- Minecraft Bedrock Script API (`@minecraft/server`)

## Prerequisites

- Node.js 18 or newer
- A Minecraft Bedrock edition project or local add-on setup

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the script bundle:
   ```bash
   npm run build
   ```
3. Watch for changes during development:
   ```bash
   npm run watch
   ```

## Usage

After building, the generated script is written to:

```text
behavior_pack/scripts/main.js
```

Place the `behavior_pack` folder into your Minecraft Bedrock add-ons folder or import it into a world as a behavior pack.

Enable **both** the behavior pack and resource pack in the world. The resource pack provides the Ore Detector item texture and name.

To use the radar, craft an Ore Detector (copper ingots, amethyst shard, redstone and a compass in a crafting table) or run `/give @s instantfarm:ore_detector`, then hold it in your main hand. The radar appears automatically and disappears when you select another item.

### Ore radar limitations

- The radar is drawn through the actionbar. Bedrock's Script API can only update the actionbar, title and subtitle text. It cannot draw a custom HUD layout, so the radar is text-only and sits above the hotbar.
- Replacing vanilla HUD layouts would require shipping a full copy of the game's `hud_screen.json`, which is not included.
- The actionbar is shared, so the radar replaces other actionbar messages while the Ore Detector is held.
- Ore veins are counted from the 128 nearest ore blocks in range. Blocks in unloaded chunks are skipped until those chunks load.

## Scripts

- `npm run build` - runs TypeScript validation and bundles the script for the behavior pack.
- `npm run watch` - rebuilds automatically when source files change.
- `npm run typecheck` - runs a TypeScript-only type check without bundling.

## Notes

This project is intended as a small survival helper pack. It is designed for experimentation and local Minecraft add-on development, and it can be expanded with additional gameplay features over time.
