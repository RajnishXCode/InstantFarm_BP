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
- Ore radar
  - Opens a live radar panel while the Ore Detector is selected in the hotbar.
  - Scans a 24-block radius every 2 seconds and displays up to three nearby ore veins.
  - Shows each ore's direction, distance, and vertical offset from the player.

## Project structure

- `src/main.ts` - registers and initializes all enabled features.
- `src/core/registry.ts` - simple feature registration and startup system.
- `src/features/crops/index.ts` - crop growth logic.
- `src/features/trees/index.ts` - instant tree generation logic.
- `src/features/ore-radar/` - ore scanning, radar display, and compass tracking.
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

Enable **both** the behavior pack and resource pack in the world. The resource pack is required for the radar panel and item texture.

To use the radar, craft an Ore Detector or run `/give @s instantfarm:ore_detector`, then select it in your hotbar. The radar panel opens automatically and closes when you select another item.

## Scripts

- `npm run build` - runs TypeScript validation and bundles the script for the behavior pack.
- `npm run watch` - rebuilds automatically when source files change.
- `npm run typecheck` - runs a TypeScript-only type check without bundling.

## Notes

This project is intended as a small survival helper pack. It is designed for experimentation and local Minecraft add-on development, and it can be expanded with additional gameplay features over time.
