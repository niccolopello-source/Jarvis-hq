import { test,expect } from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
let raw:string;
test.beforeAll(()=>{const f=join(mkdtempSync(join(tmpdir(),'copy-fixture-')),'save.json');execFileSync('node',['--import=tsx',join(here,'fixtures/make-copy-save.ts'),f]);raw=readFileSync(f,'utf8');});
for(const lang of ['it','en'] as const) test(`copy ${lang}: simulated save → actual Life → retirement → Legacy/archive`,async({page})=>{
 await page.setViewportSize({width:390,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(({raw,lang})=>{if(!sessionStorage.getItem('copy-seeded')){sessionStorage.setItem('copy-seeded','1');localStorage.setItem('pivot-v2-save',raw);localStorage.setItem('pivot-lang',lang);}},{raw,lang});
 await page.goto('/');await page.getByRole('button',{name:lang==='it'?'Vita':'Life',exact:true}).click();
 await expect(page.getByText(lang==='it'?"Al termine dell'estate, l'overall è diminuito.":"At summer's end, overall has decreased.",{exact:false})).toBeVisible();
 await expect(page.getByText(lang==='it'?"Al termine dell'estate, l'overall è invariato.":"At summer's end, overall is unchanged.",{exact:false})).toBeVisible();
 await expect(page.getByText(lang==='it'?'La preparazione per ottobre conta a ogni età.':'Preparation for October matters at every age.',{exact:false})).toBeVisible();
 await expect(page.locator('.review-pane')).toContainText(lang==='it'?'tre azioni di Elijah Voss':'three plays by Elijah Voss');
 expect(await page.locator('body').innerText()).not.toContain('__RIVAL__');
 const scoreLines=await page.locator('.swipe-slide.on').evaluate(el=>{
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const lines:number[]=[];
  while(walker.nextNode()){const node=walker.currentNode;for(const m of (node.textContent??'').matchAll(/\b\d-\d\b/g)){const range=document.createRange();range.setStart(node,m.index!);range.setEnd(node,m.index!+m[0].length);lines.push(range.getClientRects().length);}}
  return lines;
 });
 expect(scoreLines.length).toBeGreaterThan(0);expect(scoreLines.every(n=>n===1)).toBe(true);
 // A native scroll-to-content must not scroll the hidden carousel ancestors horizontally.
 await page.getByText(lang==='it'?"Al termine dell'estate, l'overall è diminuito.":"At summer's end, overall has decreased.",{exact:false}).scrollIntoViewIfNeeded();
 await page.waitForTimeout(450);
 const hiddenScroll=await page.locator('.career-view,.swipe-pager').evaluateAll(els=>els.map(el=>el.scrollLeft));
 expect(hiddenScroll).toEqual([0,0]);
 const out=process.env.COPY_SHOTS;
 if(out){
  mkdirSync(out,{recursive:true});
  await page.getByText(lang==='it'?"Al termine dell'estate, l'overall è diminuito.":"At summer's end, overall has decreased.",{exact:false}).scrollIntoViewIfNeeded();
  await page.screenshot({path:join(out,`390-${lang}-development.png`),animations:'disabled'});
  await page.locator('.swipe-slide.on').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  console.log('COPY_GEOMETRY',lang,await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,x:scrollX,roots:[...document.querySelectorAll('.career-view,.swipe-pager,.swipe-slide.on')].map(el=>({class:el.className,x:el.getBoundingClientRect().x,width:el.getBoundingClientRect().width,scrollLeft:el.scrollLeft}))})));
  await page.screenshot({path:join(out,`390-${lang}-life.png`),animations:'disabled'});
 }

 await page.getByRole('button',{name:lang==='it'?'Storia':'Story',exact:true}).click();
 await page.getByRole('button',{name:lang==='it'?/Chiudi ora/:/Retire now/}).click();
 await expect(page.getByRole('region',{name:'Career Card'})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:lang==='it'?/Archivio/:/Archive/}).click();await page.locator('.archive-card').first().click();
 await expect(page.getByText(lang==='it'?'In sala video, tre azioni di Elijah Voss, una tua':'In the film room, three plays by Elijah Voss, one of yours',{exact:false})).toBeVisible();
 expect(await page.locator('body').innerText()).not.toContain('__RIVAL__');
 const archived=await page.evaluate(()=>localStorage.getItem('pivot-v2-archive'));
 expect(archived).toContain('__RIVAL__'); // raw history deliberately preserved, display resolves it
 if(out)await page.screenshot({path:join(out,`390-${lang}-archive.png`),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
