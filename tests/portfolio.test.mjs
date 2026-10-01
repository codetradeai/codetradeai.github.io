import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'index-en.html'];
const read = (name) => readFileSync(resolve(root, name), 'utf8');

for (const page of pages) {
    const html = read(page);

    test(`${page}: three named, accessible project cases before older work`, () => {
        const cards = [...html.matchAll(/<article class="project-card" aria-labelledby="([^"]+)">([\s\S]*?)<\/article>/g)];
        assert.equal(cards.length, 3);
        assert.deepEqual(cards.map((card) => card[1]), ['projeto-chat', 'projeto-solar', 'projeto-servicos']);
        for (const [, id, body] of cards) {
            assert.ok(body.includes(`<h3 id="${id}">`));
            assert.match(body, /class="project-stack"/);
            assert.match(body, /class="project-status"/);
            assert.equal((body.match(/<p/g) || []).length, 5);
        }
        assert.ok(html.indexOf('id="projetos"') < html.indexOf('id="entregas"'));
    });

    test(`${page}: IDs, local links, assets and language navigation are valid`, () => {
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
        assert.equal(new Set(ids).size, ids.length, 'duplicate IDs');
        for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
            if (ref.startsWith('#')) assert.ok(ids.includes(ref.slice(1)), `missing target ${ref}`);
            else if (!/^[a-z]+:/i.test(ref)) assert.ok(existsSync(resolve(root, ref.split('?')[0])), `missing asset ${ref}`);
        }
        assert.match(html, page === 'index.html' ? /lang="pt-BR"/ : /lang="en-US"/);
        assert.ok(html.includes(`href="${page === 'index.html' ? 'index-en.html' : 'index.html'}"`));
        assert.equal((html.match(/<h1>/g) || []).length, 1);
    });

    test(`${page}: private repository URLs are not exposed`, () => {
        const githubUrls = [...html.matchAll(/https:\/\/github\.com\/[^\s"<]+/g)].map((match) => match[0]);
        assert.deepEqual(githubUrls, ['https://github.com/codetradeai']);
        const highlights = html.split('<section aria-labelledby="projetos">')[1].split('</section>')[0];
        assert.doesNotMatch(highlights, /https?:\/\//);
    });

    test(`${page}: theme toggling is repeatable and restores the saved theme`, () => {
        const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
        for (const savedTheme of [null, 'light', 'dark']) {
            const attrs = new Map();
            const storage = new Map(savedTheme ? [['theme', savedTheme]] : []);
            const handlers = new Map();
            const context = vm.createContext({
                localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
                document: {
                    documentElement: {
                        getAttribute: (key) => attrs.get(key) ?? null,
                        setAttribute: (key, value) => attrs.set(key, value),
                        removeAttribute: (key) => attrs.delete(key),
                    },
                    getElementById: (id) => id === 'theme-toggle' ? { addEventListener: (event, handler) => handlers.set(event, handler) } : {},
                },
            });
            for (const script of scripts) new vm.Script(script).runInContext(context);
            assert.equal(attrs.get('data-theme') === 'dark', savedTheme === 'dark');
            for (let click = 1; click <= 4; click++) {
                handlers.get('click')();
                const dark = click % 2 ? savedTheme !== 'dark' : savedTheme === 'dark';
                assert.equal(attrs.get('data-theme') === 'dark', dark);
                assert.equal(storage.get('theme'), dark ? 'dark' : 'light');
            }
        }
    });
}

test('PT and EN feature the same projects, anchors and technologies', () => {
    const extract = (html, pattern) => [...html.matchAll(pattern)].map((match) => match[1]);
    assert.deepEqual(extract(read(pages[0]), /\bid="([^"]+)"/g), extract(read(pages[1]), /\bid="([^"]+)"/g));
    for (const term of ['codetrade.chat', 'CodeSolar', 'TypeScript', 'Supabase/PostgreSQL', 'MCP']) {
        for (const page of pages) assert.ok(read(page).includes(term));
    }
});
