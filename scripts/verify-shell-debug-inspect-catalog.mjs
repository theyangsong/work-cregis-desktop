#!/usr/bin/env node
/**
 * 对照 eds-desktop 组件根 `eds-*` 类与 Shell Debug inspect catalog。
 * 缺 domClass 时 dev 只能靠 Vue owner，易在大壳内误冒泡 — 跑此脚本补 catalog，不必逐页人工点选。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(import.meta.url), '..', '..');
const dsRoot = join(repoRoot, '..', 'eds-desktop', 'packages', 'components', 'src');
const catalogPath = join(repoRoot, 'src/dev/shell-debug/inspect/edsInspectCatalog.ts');

const INTERIOR_EDS_DOM_CLASSES = new Set([
  'eds-avatar-robot',
  'eds-crypto-address-flotation',
  'eds-flotation-menu-add',
  'eds-flotation-menu-body',
  'eds-flotation-menu-footer',
  'eds-input-control',
  'eds-input-unit',
]);

const STRUCTURAL = new Set([
  'eds-batch-bar-glass',
  'eds-frosted-menu-chrome',
  'eds-frosted-page-chrome',
  'eds-nav-bar-shell',
  'eds-popover-content',
  'eds-popup-box-content',
  'eds-popup-inner-backdrop',
  'eds-scroll-area-hidden-scrollbar',
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (name.endsWith('.vue')) {
      out.push(full);
    }
  }
  return out;
}

function readCatalogDomClasses(source) {
  const matches = source.matchAll(/domClass:\s*'(eds-[^']+)'/g);
  return new Set([...matches].map((m) => m[1]));
}

function readComponentRootClasses(vueSource) {
  const found = new Set();
  const patterns = [
    /class="(eds-[a-z0-9-]+)/g,
    /class='(eds-[a-z0-9-]+)/g,
    /:class="\['(eds-[a-z0-9-]+)/g,
    /:class="\[\s*'(eds-[a-z0-9-]+)/g,
  ];
  for (const pattern of patterns) {
    for (const match of vueSource.matchAll(pattern)) {
      found.add(match[1]);
    }
  }
  return found;
}

const catalogSource = readFileSync(catalogPath, 'utf8');
const catalogDom = readCatalogDomClasses(catalogSource);

const componentRoots = new Map();
for (const file of walk(dsRoot)) {
  const source = readFileSync(file, 'utf8');
  for (const className of readComponentRootClasses(source)) {
    if (STRUCTURAL.has(className)) continue;
    if (INTERIOR_EDS_DOM_CLASSES.has(className)) continue;
    if (className.includes('eds-bar-') && className.endsWith('-line-height')) continue;
    if (!componentRoots.has(className)) {
      componentRoots.set(className, []);
    }
    componentRoots.get(className).push(relative(dsRoot, file));
  }
}

const missing = [...componentRoots.keys()]
  .filter((className) => !catalogDom.has(className))
  .sort();

if (missing.length === 0) {
  console.log('verify-shell-debug-inspect-catalog: OK — DS 组件根 eds-* 均已入 catalog');
  process.exit(0);
}

console.error('verify-shell-debug-inspect-catalog: 以下 DS 组件根 eds-* 未入 inspect catalog:\n');
for (const className of missing) {
  const files = componentRoots.get(className).slice(0, 3);
  console.error(`  ${className}`);
  for (const file of files) {
    console.error(`    - ${file}`);
  }
  if (componentRoots.get(className).length > 3) {
    console.error(`    … +${componentRoots.get(className).length - 3} more`);
  }
}
console.error('\n补条目：src/dev/shell-debug/inspect/edsInspectCatalog.ts');
process.exit(1);
