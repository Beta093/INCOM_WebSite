import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'team/index.html', '404.html'];
let checked = 0;
for (const page of pages) {
  const source = readFileSync(resolve(root, page), 'utf8');
  assert.equal((source.match(/<h1\b/g) || []).length, 1, `${page}: one h1`);
  assert.match(source, /lang="ko"/);
  for (const [, reference] of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(reference)) continue;
    const [path, anchor] = reference.split('#');
    let target = path ? resolve(path.startsWith('/') ? root : dirname(resolve(root, page)), path.replace(/^\//, '').split('?')[0]) : resolve(root, page);
    assert.ok(existsSync(target), `${page}: missing ${reference}`);
    if (statSync(target).isDirectory()) target = resolve(target, 'index.html');
    assert.ok(existsSync(target), `${page}: missing index ${reference}`);
    if (anchor && target.endsWith('.html')) assert.ok(readFileSync(target, 'utf8').includes(`id="${anchor}"`), `${page}: missing anchor ${reference}`);
    checked++;
  }
}
const team = readFileSync(resolve(root, 'team/index.html'), 'utf8');
for (const name of ['서준영','성소민','류현승','서혜빈','정유민','서정화','임다미','배주환','김규헌','조민해','김유현']) {
  assert.equal(team.split(name).length - 1, 1, `roster name: ${name}`);
}
assert.equal((team.match(/class="person"/g) || []).length, 10);
assert.ok(!team.includes('gallery.js'), 'subpage must not run homepage-only choreography');
console.log(`PASS: ${pages.length} pages, ${checked} local references, 11 source roster names.`);
