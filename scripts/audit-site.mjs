import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { documentFrom } from './audit-dom.mjs';

const origin='https://www.ishantjuyal.com';
const scan=async dir=>(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?scan(join(dir,e.name)):[join(dir,e.name)]))).flat();
const files=(await scan('dist')).filter(p=>p.endsWith('.html'));
const titles=new Set(), canonicals=new Set();let redirects=0,links=0,articles=0;
for(const file of files){
  const document=documentFrom(await readFile(file,'utf8'));
  const canonical=document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  assert.ok(canonical?.startsWith(origin+'/'),`canonical domain: ${file}`);
  const refresh=document.querySelector('meta[http-equiv="refresh"]');
  if(refresh){
    assert.equal(document.querySelector('#site-analytics-config'),null,'redirect must not initialize analytics');
    assert.equal(refresh.getAttribute('content'),'0;url='+canonical);
    assert.equal(document.querySelector('meta[name="robots"]').getAttribute('content'),'noindex');
    redirects++;continue;
  }
  const path=file.replace(/^dist/,'').replace(/\/index.html$/,'/').replace(/\.html$/,'').replace(/\/$/,'')||'/';
  assert.equal(canonical,origin+path,`self canonical: ${file}`);
  assert.ok(document.title.length>=10&&document.title.length<=85,`title length: ${file}`);
  assert.ok(!titles.has(document.title),'duplicate title');titles.add(document.title);
  const description=document.querySelector('meta[name="description"]')?.getAttribute('content');
  assert.ok(description?.length>=30,`missing description: ${file}`);
  const isHidden=el=>{for(let node=el;node;node=node.parentElement)if(node.hidden)return true;return false;};
  assert.equal(document.querySelectorAll('h1').filter(el=>!isHidden(el)).length,1,`heading hierarchy: ${file}`);
  assert.equal(document.querySelectorAll('#site-analytics-config').length,1);
  const schema=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(schema['@context'],'https://schema.org');
  assert.ok(schema['@graph'].some(e=>e['@type']==='Person'&&e.name==='Ishant Juyal'));
  const webpage=schema['@graph'].find(e=>e.url===canonical&&e['@id'].endsWith('#webpage'));
  assert.ok(webpage,`page schema: ${file}`);
  if(path==='/')assert.equal(webpage['@type'],'ProfilePage');
  if(path.startsWith('/notes/')){assert.equal(webpage['@type'],'BlogPosting');assert.ok(webpage.datePublished);assert.equal(document.querySelector('meta[property="og:type"]').getAttribute('content'),'article');articles++;}
  for(const key of ['og:title','og:description','og:url','og:image','og:image:alt'])assert.ok(document.querySelector(`meta[property="${key}"]`),`${key}: ${file}`);
  const image=document.querySelector('meta[property="og:image"]').getAttribute('content');await access('dist'+new URL(image).pathname);
  if(path==='/404')assert.ok(document.querySelector('meta[name="robots"]').getAttribute('content').includes('noindex'));
  else {assert.equal(document.querySelector('meta[name="robots"]'),null,`production page blocked: ${file}`);canonicals.add(canonical);}
  for(const anchor of document.querySelectorAll('a[href]')){
    const href=anchor.getAttribute('href');if(!href.startsWith('/'))continue;
    assert.ok(!/^\/(lab|writing|resume)(\/|$)/.test(href),`old internal link: ${file}`);
    let dest='dist'+decodeURIComponent(new URL(href,origin).pathname);
    if(!/\.[a-z0-9]+$/i.test(dest))dest=dest.replace(/\/$/,'')+'/index.html';
    await access(dest);links++;
  }
}
const sitemap=await readFile('dist/sitemap.xml','utf8');
const entries=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual(new Set(entries),canonicals,'sitemap must contain exactly the indexable canonical pages');
assert.equal(entries.length,new Set(entries).size,'duplicate sitemap URL');
const robots=await readFile('dist/robots.txt','utf8');assert.ok(robots.includes('Allow: /'));assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
console.log(`SEO passed: ${canonicals.size} indexable pages, ${articles} article schemas, ${redirects} silent redirects, ${links} internal links, 404 excluded, social images present.`);
