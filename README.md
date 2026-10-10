# FastRender
Vencord/Equicord plugin that makes Discord about ~60% faster when switching channels, hovering and opening popups without making anything look or behave differently

## What it does

Discord loads its styles as hundreds of small stylesheet files and never combines them, after a while there are around 820 of them and every time Discord redraws something, the browser has to check each element against every one of those files.

FastRender merges them into a few files, keeping every rule in the same order and the original files are only switched off, never deleted...

## Comparison

| Action | Without | With | Faster by |
| --- | --- | --- | --- |
| Switching channels | 697 ms | 295 ms | 58% |
| Hovering, focusing, opening popups | 121.7 ms | 29.3 ms | 76% |
| Opening a big panel | 41.1 ms | 25.8 ms | 37% |
| **Overall** | **859.8 ms** | **350.1 ms** | **59%** |

## Setup

FastRender is a userplugin, so you need Vencord or Equicord built from source.

1. Download this repository.
2. Copy the `FastRender` folder into `src/userplugins`.
3. Run `pnpm build`.
4. Restart Discord and enable FastRender in `Settings` > `Plugins`.
