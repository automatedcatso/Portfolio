// Run: node scripts/test-projects.mjs
// Exercise the actual catalog and interaction code without browser dependencies.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const app = readFileSync('app.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const section = (start, end) => {
  const a = app.indexOf(start), b = app.indexOf(end, a);
  assert.ok(a >= 0 && b > a, `Interaction section missing: ${start}`);
  return app.slice(a, b);
};

function fixture(reduceMotion) {
  const document = { activeElement: null, addEventListener() {} };
  class Element {
    constructor() {
      this.children = []; this.listeners = {}; this.attributes = {}; this.dataset = {};
      this.values = {}; this.style = { setProperty: (key, value) => this.values[key] = value };
      this.classList = { toggle() {} };
    }
    set innerHTML(value) { this.html = value; this.children = []; }
    get innerHTML() { return this.html || ''; }
    set disabled(value) { this.isDisabled = value; if (value && document.activeElement === this) document.activeElement = null; }
    get disabled() { return Boolean(this.isDisabled); }
    append(...children) { this.children.push(...children); }
    appendChild(child) { this.append(child); }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(event, handler) { this.listeners[event] = handler; }
    scrollTo() {}
    scrollIntoView(options) { this.scrollRequest = options; }
    focus() { document.activeElement = this; this.listeners.focus?.(); }
    click() { if (!this.disabled) this.listeners.click?.(); }
  }
  document.createElement = () => new Element();
  const map = Object.fromEntries(['.project-orbit', '#projectOrbit', '#orbitToggle', '#orbitCoreName', '#orbitCoreRole',
    '.carousel-console-foot', '.orbit-readout span', '.carousel-console-head span', '#commandPalette', '#commandInput',
    '#commandList', '#commandButton'].map(selector => [selector, new Element()]));
  const ring = map['.project-orbit'];
  for (const [, id] of html.matchAll(/<article\b[^>]*class="[^"]*\borbit-project\b[^"]*"[^>]*data-project="([^"]+)"/g)) {
    const card = new Element(); card.dataset.project = id; ring.append(card);
  }
  const $ = (selector, root) => {
    if (!root) return map[selector];
    if (selector === '.command-item.active') return root.children.find(child => child.className.includes(' active'));
    const id = selector.match(/^\[data-project="([^"]+)"\]$/)?.[1];
    return root.children.find(child => child.dataset.project === id);
  };
  const context = vm.createContext({ window: {}, document, reduceMotion, $, $$: () => ring.children,
    location: {}, open() {}, toggleOverdrive() {}, openProjectDetail() {}, lightbox: null, gallery: null, projectDetail: null });
  vm.runInContext(readFileSync('assets/data/projects.js', 'utf8'), context);
  vm.runInContext(section('  const projectDossiers={', '  const projectDetail='), context);
  vm.runInContext('window.dossiers = projectDossiers;', context);
  vm.runInContext(section("  const orbitRing=$('.project-orbit');", "  $$('[data-project]')"), context);
  vm.runInContext(section('  // 3D dossier constellation:', '\n})();'), context);
  return { context, map, ring, document };
}

for (const reduced of [false, true]) {
  const { context, map, ring, document } = fixture(reduced);
  const dossiers = Object.values(context.window.dossiers);
  assert.equal(dossiers.length, 23);
  assert.equal(new Set(dossiers.map(d => d.code.split(' // ')[0])).size, 23);
  for (const dossier of dossiers) {
    assert.ok(dossier.code.startsWith('02.'));
    for (const field of ['tags', 'stats', 'capabilities', 'architecture', 'sourceMap', 'boundaries', 'notes', 'trace', 'images'])
      assert.ok(dossier[field]?.length, `${dossier.title}: missing ${field}`);
    for (const [image] of dossier.images) assert.ok(existsSync(image), image);
  }
  assert.equal(ring.children.length, 19);
  assert.equal(new Set(ring.children.map(card => card.dataset.project)).size, 19);
  assert.ok(ring.children.every(card => !['morselab', 'luminary'].includes(card.dataset.project)));
  const [previous, status, next] = map['.carousel-console-foot'].children[0].children;
  const visible = () => ring.children.filter(card => !card.hidden);
  assert.equal(visible().length, 8); assert.ok(previous.disabled);
  next.focus(); next.click(); assert.equal(visible().length, 8);
  next.click(); assert.equal(visible().length, 3); assert.ok(next.disabled);
  assert.equal(document.activeElement, previous, 'Paging must retain keyboard focus at the final page');
  assert.match(status.textContent, /17–19 OF 19/); assert.equal(status.attributes['aria-live'], 'polite');
  assert.equal(ring.values['--quantity'], 3); assert.equal(visible()[0].values['--index'], 0);
  previous.click(); previous.focus(); previous.click();
  assert.equal(document.activeElement, next, 'Paging must retain keyboard focus at the first page');
  assert.equal(visible().length, 8); assert.ok(previous.disabled);
  visible()[3].focus(); assert.ok(ring.style.transform.includes('rotateY(-135deg)'));
  visible()[3].listeners.blur(); assert.equal(ring.style.transform, '');
  assert.match(map['#orbitCoreRole'].textContent, /19 SYSTEMS/);
  assert.equal(map['#orbitToggle'].attributes['aria-pressed'], String(reduced));

  vm.runInContext(section('  // Command palette.', '  // Smooth internal anchors.'), context);
  const input = map['#commandInput'], list = map['#commandList'];
  input.value = 'wave'; input.listeners.input(); assert.equal(list.children.length, 1);
  assert.match(list.children[0].innerHTML, /WAVE/); assert.ok(input.attributes['aria-label']);
  input.value = ''; input.listeners.input();
  for (let i = 0; i < 25; i++) input.listeners.keydown({ key: 'ArrowDown', preventDefault() {} });
  assert.equal(list.children[25].scrollRequest.block, 'nearest', 'Keyboard selection must stay visible');
}
assert.ok(html.indexOf('assets/data/projects.js') < html.indexOf('src="app.js"'), 'Catalog must load before the app');
console.log('Project regression checks passed: 23 dossiers; 19 unique ring nodes; 8/8/3 pages; focus, search and image paths.');
