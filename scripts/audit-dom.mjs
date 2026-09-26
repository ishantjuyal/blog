import { parse } from 'parse5';

// Small DOM fixture for running the actual bundled trackers against built pages.
// SDK calls are recorded in memory; these checks never send analytics traffic.
export class AuditElement {
  constructor(node, parent, document) {
    this.tagName = (node.tagName || '').toUpperCase();
    this.parentElement = parent;
    this.ownerDocument = document;
    this.attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
    this.children = (node.childNodes || []).filter(n => n.tagName).map(n => wrap(n, this, document));
    this.childNodes = node.childNodes || [];
    this.style = {};
    this.listeners = new Map();
    this.hidden = 'hidden' in this.attrs;
    this.open = 'open' in this.attrs;
    this.dataset = new Proxy({}, {
      get: (_, key) => this.attrs['data-' + String(key).replace(/[A-Z]/g, m => '-' + m.toLowerCase())],
      set: (_, key, value) => { this.attrs['data-' + String(key).replace(/[A-Z]/g, m => '-' + m.toLowerCase())] = String(value); return true; },
    });
  }
  get textContent() {
    if (this.text !== undefined) return this.text;
    const read = n => n.nodeName === '#text' ? n.value : (n.childNodes || []).map(read).join('');
    return this.childNodes.map(read).join('');
  }
  set textContent(value) { this.text = value; }
  get innerText() { return this.textContent; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
  matches(selector) {
    return selector.split(',').some(s => {
      s = s.trim();
      const tag = s.match(/^[a-z][a-z0-9-]*/i)?.[0];
      if (tag && this.tagName !== tag.toUpperCase()) return false;
      for (const [, id] of s.matchAll(/#([\w-]+)/g)) if (this.attrs.id !== id) return false;
      for (const [, cls] of s.matchAll(/\.([\w-]+)/g)) if (!(this.attrs.class || '').split(/\s+/).includes(cls)) return false;
      for (const [, key, value] of s.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) if (!(key in this.attrs) || (value !== undefined && this.attrs[key] !== value)) return false;
      return true;
    });
  }
  closest(selector) { for (let n = this; n; n = n.parentElement) if (n.matches(selector)) return n; return null; }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(callback); }
  focus() { this.ownerDocument.activeElement = this; }
  click() { this.dispatch('click'); }
  appendChild(child) { this.children.push(child); this.ownerDocument.inserted.push(child); }
  dispatch(type, extra = {}) {
    const event = { target: this, type, button: 0, preventDefault() {}, ...extra };
    for (const callback of this.ownerDocument.listeners.get(type) || []) callback(event);
    for (let n = this; n; n = n.parentElement) for (const callback of n.listeners.get(type) || []) callback(event);
  }
}
export class AuditDetails extends AuditElement {}
function wrap(node, parent, document) { return new (node.tagName === 'details' ? AuditDetails : AuditElement)(node, parent, document); }
export function documentFrom(html) {
  const document = { listeners: new Map(), inserted: [], referrer: 'https://www.google.com/', hidden: false };
  const tree = parse(html);
  document.root = wrap(tree, null, document);
  document.querySelectorAll = selector => document.root.querySelectorAll(selector);
  document.querySelector = selector => document.root.querySelector(selector);
  document.head = document.querySelector('head');
  document.title = document.querySelector('title')?.textContent || '';
  document.createElement = tagName => wrap({ tagName }, null, document);
  document.addEventListener = (type, callback) => { if (!document.listeners.has(type)) document.listeners.set(type, []); document.listeners.get(type).push(callback); };
  return document;
}
