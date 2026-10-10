/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { lodash } from "@webpack/common";

const logger = new Logger("FastRender");

const mergedCss = new Map<HTMLStyleElement, string>();
const absorbed = new Set<HTMLLinkElement>();

function linkCss(el: Element) {
    if (!(el instanceof HTMLLinkElement) || el.rel !== "stylesheet" || absorbed.has(el) || el.onload != null || el.sheet == null || el.media) return null;
    try {
        let css = "";
        for (const rule of el.sheet.cssRules) {
            if (rule instanceof CSSImportRule) return null;
            css += rule.cssText + "\n";
        }
        return css;
    } catch {
        return null;
    }
}

function merge(run: [Element, string][]) {
    const style = document.createElement("style");
    const css = run.map(([, text]) => text).join("");
    style.textContent = css;
    run[0][0].before(style);
    mergedCss.set(style, css);

    for (const [el] of run) {
        if (el instanceof HTMLStyleElement) {
            mergedCss.delete(el);
            el.remove();
        } else if (el instanceof HTMLLinkElement && el.sheet) {
            el.sheet.disabled = true;
            absorbed.add(el);
        }
    }
}

function compact() {
    const start = performance.now();
    let run: [Element, string][] = [];
    let merges = 0;
    const flush = () => {
        if (run.length > 1) {
            merge(run);
            merges++;
        }
        run = [];
    };

    for (const el of [...document.head.children]) {
        if (el instanceof HTMLLinkElement && absorbed.has(el)) continue;
        const css = el instanceof HTMLStyleElement ? mergedCss.get(el) : linkCss(el);
        if (css != null) run.push([el, css]);
        else if (el instanceof HTMLStyleElement || el instanceof HTMLLinkElement && el.rel === "stylesheet") flush();
    }
    flush();

    if (merges) logger.debug(`Merged ${merges} runs in ${Math.round(performance.now() - start)}ms, ${absorbed.size} sheets absorbed`);
}

let idleId: number | undefined;
let scheduleCompact: ReturnType<typeof lodash.debounce<() => void>> | undefined;

function onLoad(e: Event) {
    if (e.target instanceof HTMLLinkElement && e.target.rel === "stylesheet") scheduleCompact?.();
}

export default definePlugin({
    name: "FastRender",
    description: "Tweak some things for a lighter Discord",
    authors: [{ name: "nobody", id: 0n }],

    start() {
        scheduleCompact = lodash.debounce(() => {
            idleId = requestIdleCallback(compact, { timeout: 5000 });
        }, 1000);
        document.addEventListener("load", onLoad, true);
        scheduleCompact();
    },

    stop() {
        scheduleCompact?.cancel();
        scheduleCompact = undefined;
        if (idleId !== undefined) cancelIdleCallback(idleId);
        document.removeEventListener("load", onLoad, true);
        for (const link of absorbed) if (link.sheet) link.sheet.disabled = false;
        for (const style of mergedCss.keys()) style.remove();
        absorbed.clear();
        mergedCss.clear();
    }
});
