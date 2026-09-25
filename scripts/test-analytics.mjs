import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';
import { build } from 'esbuild';
import { AuditElement, AuditDetails, documentFrom } from './audit-dom.mjs';

const bundle = async entry => (await build({entryPoints: [entry], bundle: true, write: false, format: 'iife', platform: 'browser'})).outputFiles[0].text;
const analytics = await bundle('src/scripts/analytics.ts');
const game = await bundle('src/scripts/fun-world.ts');
const scan = async dir => (await Promise.all((await readdir(dir, {withFileTypes:true})).map(e => e.isDirectory() ? scan(join(dir,e.name)) : [join(dir,e.name)]))).flat();
const files = (await scan('dist')).filter(path => path.endsWith('.html'));

function create(html, path = '/', overrides = {}, hostname = 'www.ishantjuyal.com') {
  const document = documentFrom(html);
  const node = document.querySelector('#site-analytics-config');
  const config = { ...JSON.parse(node.textContent), mixpanelToken: 'test-token-never-sent', ...overrides };
  node.textContent = JSON.stringify(config);
  const mp = []; const initializations = []; const storage = new Map(); const logs = []; const windowListeners = new Map();
  const sandbox = {
    document, location: new URL(`https://${hostname}${path}`), URL, Element: AuditElement, HTMLDetailsElement: AuditDetails,
    console: {info: (...args) => logs.push(args)}, setTimeout, clearTimeout,
    sessionStorage: {getItem:k=>storage.get(k)||null, setItem:(k,v)=>storage.set(k,v), removeItem:k=>storage.delete(k)},
    matchMedia: () => ({matches:true}), addEventListener:(type,callback)=>{if(!windowListeners.has(type))windowListeners.set(type,[]);windowListeners.get(type).push(callback);},
    mixpanel: {__SV:1.2, init:(token, config)=>initializations.push(config), register() {}, track:(name, properties, options, callback)=>{mp.push({name, properties}); callback?.({status:1});}},
  };
  sandbox.window=sandbox;
  const context=vm.createContext(sandbox);
  const run=()=>vm.runInContext(analytics,context);
  run();
  const ga=()=>Array.from(sandbox.dataLayer || []).filter(args=>args[0]==='event').map(args=>({name:args[1],properties:args[2]}));
  const clear=()=>{mp.length=0;if(sandbox.dataLayer)sandbox.dataLayer.length=0;};
  return {document, sandbox, context, mp, ga, initializations, run, clear, logs, windowListeners};
}
function expected(anchor, path) {
  const href=anchor.getAttribute('href');
  if(anchor.dataset.analyticsIgnore==='true'||!href||href.startsWith('#'))return null;
  if(href.startsWith('mailto:')||href.startsWith('tel:'))return 'contact_link_clicked';
  const url=new URL(href,`https://www.ishantjuyal.com${path}`);
  if(!['https:','http:'].includes(url.protocol))return null;
  if(anchor.closest('[data-project-code]')||url.pathname.startsWith('/projects/'))return 'project_opened';
  if(url.pathname.startsWith('/notes/')&&url.hostname==='www.ishantjuyal.com')return 'note_opened';
  if(url.hostname.endsWith('substack.com'))return 'newsletter_opened';
  if(['www.linkedin.com','github.com','x.com'].includes(url.hostname))return 'social_link_clicked';
  return ['www.ishantjuyal.com','ishantjuyal.com'].includes(url.hostname)?'navigation_clicked':'outbound_link_clicked';
}
let pageCount=0, linkCount=0, redirectCount=0;
const rows=[];
for(const file of files) {
  const html=await readFile(file,'utf8');
  if(!html.includes('site-analytics-config')) {assert.match(html,/http-equiv="refresh"/);redirectCount++;continue;}
  const path=file.replace(/^dist/,'').replace(/\/index.html$/,'/') .replace(/\.html$/,'');
  const env=create(html,path);
  assert.equal(env.mp.length,1,file);assert.equal(env.mp[0].name,'page_viewed');
  assert.equal(env.ga().length,1,file);assert.equal(env.ga()[0].name,'page_view');
  env.run();assert.equal(env.mp.length,1,'duplicate Mixpanel initializer');assert.equal(env.ga().length,1,'duplicate GA initializer');
  assert.equal(env.initializations.length,1);
  assert.equal(env.initializations[0].autocapture,false);assert.equal(env.initializations[0].track_pageview,false);
  const names=new Set();
  for(const anchor of env.document.querySelectorAll('a[href]')) {
    env.clear(); anchor.dispatch('click');
    const name=expected(anchor,path);
    assert.equal(env.mp.length,name?1:0,`${file} ${anchor.getAttribute('href')}`);
    assert.equal(env.ga().length,name?1:0,`${file} GA ${anchor.getAttribute('href')}`);
    if(name) {
      assert.equal(env.mp[0].name,name);assert.equal(env.ga()[0].name,name);names.add(name);
      const props=env.mp[0].properties;
      assert.ok(!Object.values(props).some(v=>v===null||v===undefined),'empty property');
      if(name==='contact_link_clicked') {assert.ok(!('link_text' in props));assert.ok(!('destination_path' in props));}
      if(name==='project_opened') {assert.ok(props.project_name&&props.project_slug&&props.project_code);assert.equal(props.project_action,anchor.getAttribute('href').startsWith('https:')?'visit':'details');}
      if(anchor.closest('footer'))assert.equal(props.link_context,'footer');
    }
    linkCount++;
  }
  rows.push({page:path,events:[...names].sort()});pageCount++;
}
const home=await readFile('dist/index.html','utf8');
for(const host of ['localhost','127.0.0.1','blog-preview.vercel.app','unexpected.ishantjuyal.com','ishantjuyal.com.evil.test']) {
  const env=create(home,'/?analytics_debug=1',{},host);assert.equal(env.mp.length,0);assert.equal(env.ga().length,0);assert.equal(env.document.inserted.length,0);
}
let env=create(home,'/',{mixpanelToken:''});assert.equal(env.mp.length,0);assert.equal(env.ga().length,1,'GA must work without Mixpanel');
env=create(home,'/',{gaMeasurementId:'disabled'});assert.equal(env.mp.length,1);assert.equal(env.ga().length,0);
env=create(home);env.clear();env.sandbox.mixpanel.track=()=>{throw Error('blocked')};env.document.querySelector('a[href="/projects"]').dispatch('click');assert.equal(env.ga().length,1,'Mixpanel failure must not block GA');
env=create(home);env.clear();
// Use a known anchor without descendant CSS support in the small fixture.
const anchor=env.document.querySelectorAll('a').find(a=>a.getAttribute('href')==='/projects/pm-quest');
anchor.dispatch('auxclick',{button:1});assert.equal(env.mp.length,1);assert.equal(env.ga().length,1);
env.clear();anchor.dispatch('auxclick',{button:2});assert.equal(env.mp.length,0);
const work=create(await readFile('dist/work/index.html','utf8'),'/work');work.clear();
for(const details of work.document.querySelectorAll('details')) {details.open=true;details.dispatch('toggle');assert.equal(work.mp.at(-1).name,'career_details_opened');const count=work.mp.length;details.open=false;details.dispatch('toggle');assert.equal(work.mp.length,count);}
assert.equal(work.mp.length,4);
env=create(home);env.clear();vm.runInContext(game,env.context);assert.equal(env.mp.length,0,'restoring mode must not count as interaction');
env.document.querySelector('#mode-toggle').dispatch('click');assert.equal(env.mp.at(-1).name,'mode_changed');assert.equal(env.mp.at(-1).properties.mode,'fun');
for(const button of env.document.querySelectorAll('[data-stop]'))button.dispatch('click');
assert.equal(env.mp.filter(e=>e.name==='world_place_discovered').length,6);
assert.equal(env.mp.filter(e=>e.name==='world_completed').length,1);
env.document.querySelector('[data-stop]').dispatch('click');assert.equal(env.mp.filter(e=>e.name==='world_place_discovered').length,6,'revisits must not double-count discovery');
env.document.querySelector('#world-reset').dispatch('click');assert.equal(env.mp.at(-1).name,'world_restarted');
env.document.querySelector('#world-board').dispatch('keydown',{key:'Escape'});assert.equal(env.mp.at(-1).name,'mode_changed');assert.equal(env.mp.at(-1).properties.mode,'simple');
assert.equal(env.ga().length,env.mp.length,'providers must receive matching game events');
for(const method of ['keyboard','controls']) {
  env=create(home);env.clear();vm.runInContext(game,env.context);
  env.document.querySelector('#mode-toggle').dispatch('click');env.clear();
  for(let step=0;step<3;step++) {
    if(method==='keyboard')env.document.querySelector('#world-board').dispatch('keydown',{key:'ArrowUp'});
    else env.document.querySelector('[data-direction="up"]').dispatch('click');
  }
  assert.equal(env.mp.length,1,'walking only emits an event when discovering a place');
  assert.equal(env.mp[0].name,'world_place_discovered');
  assert.equal(env.mp[0].properties.input_method,method);
  assert.equal(env.mp[0].properties.place_id,'tailorup');
}
env=create(home);env.clear();
for(const callback of env.windowListeners.get('pageshow'))callback({persisted:false});
assert.equal(env.mp.length,0,'normal pageshow must not duplicate the initial page view');
for(const callback of env.windowListeners.get('pageshow'))callback({persisted:true});
assert.equal(env.mp.length,1,'back-forward cache restoration counts as a visit');
assert.equal(env.ga()[0].name,'page_view');
const cases = [
  ['https://example.com/article?email=private@example.com', 'outbound_link_clicked'],
  ['https://pmquest.ishantjuyal.com/', 'outbound_link_clicked'],
  ['https://github.com.evil.test/path', 'outbound_link_clicked'],
  ['https://example.com/notes/a', 'outbound_link_clicked'],
  ['tel:+1234567890', 'contact_link_clicked'],
  ['javascript:alert(1)', null],
  ['#main', null],
];
for(const [href,name] of cases) {
  env.clear();const link=env.document.createElement('a');link.setAttribute('href',href);link.textContent='Test link';link.dispatch('click');
  assert.equal(env.mp.length,name?1:0,href);if(name){assert.equal(env.mp[0].name,name);assert.ok(!JSON.stringify(env.mp[0].properties).includes('private@example.com'));}
}
env=create(home,'/?email=private@example.com&utm_source=newsletter&utm_campaign=launch&analytics_debug=1');
assert.equal(env.mp[0].properties.utm_source,'newsletter');
assert.ok(!env.mp[0].properties.$current_url.includes('email='));
assert.ok(!env.mp[0].properties.$current_url.includes('analytics_debug='));
console.log(JSON.stringify({status:'passed',pages:pageCount,links:linkCount,silentRedirects:redirectCount,checks:['one page view per provider','all link categories and project actions','exact production hosts only','independent provider failures','middle click','career expansion','game discovery/completion/revisit/reset/exit'],pageEvents:rows},null,2));
