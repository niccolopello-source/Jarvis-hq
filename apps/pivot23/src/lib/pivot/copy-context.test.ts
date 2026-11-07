import test from 'node:test';
import assert from 'node:assert/strict';
import { nx, loadNarrativeEn } from './narrative';

test('team/location copy is grammatical without modifying stored text', async () => {
 await loadNarrativeEn();
 const text='Prima settimana a Atlanta Hawks: nomi, uscite, un armadietto che non è ancora tuo.';
 assert.match(nx(text,'it'), /agli Atlanta Hawks/);
 assert.match(nx(text,'en'), /First week with/);
 assert.equal(text, 'Prima settimana a Atlanta Hawks: nomi, uscite, un armadietto che non è ancora tuo.');
});

import { contextualText, developmentText, archivedRival } from './copy-context';
import { seasonsLabel, legacyAwardLabel, timelineLine } from './legacy-i18n';
import { nationLabel, roleLabel } from './labels';
import { t } from './i18n';
import { NBA_TEAMS, EURO_TEAMS } from './teams';
import { playCareerSim } from './engine';
import type { DevRow } from './types';

test('rival uses already generated name, or neutral fallback; no raw placeholder', async()=>{
 await loadNarrativeEn();
 const source='In sala video, tre azioni di __RIVAL__, una tua';
 for(const lang of ['it','en'] as const){
  const known=contextualText(source,lang,{rivalName:'Elijah Voss'});
  assert.match(known,/Elijah Voss/);assert.doesNotMatch(known,/__|PivotRival/);
  assert.match(known,lang==='en'?/film room/:/sala video/);
  const empty=contextualText(source,lang,{rivalName:''});
  assert.match(empty,lang==='en'?/an opponent/:/un avversario/);assert.doesNotMatch(empty,/Elijah|__|PivotRival/);
 }
 assert.equal(contextualText('PivotRivalDisplayToken','it'),'PivotRivalDisplayToken');
 assert.equal(contextualText('__RIVAL__','it',{rivalName:'Name $&'}),'Name $&');
 assert.equal(archivedRival([{title:'Lo scontro con Elijah Voss'}]),'Elijah Voss');
 assert.equal(archivedRival([{title:'Lo scontro con __RIVAL__'}]),undefined);
});

test('development is judged by actual delta; no threshold weakened, including fractional decline',async()=>{
 await loadNarrativeEn();
 for(const lang of ['it','en'] as const) for(const [before,after] of [[62,59],[62,62],[62,62.2],[62,61.9]]){
  const row:DevRow={season:1,label:'Estate',line:'Hai lavorato dove non si vede. A ottobre il passo è più lungo.',before,after};
  const raw=JSON.stringify(row);const out=developmentText(row,lang,22);
  if(after<before) {assert.match(out,lang==='it'?/diminuito/:/decreased/);assert.doesNotMatch(out,/più lungo|longer/);}
  else if(after===before) assert.match(out,lang==='it'?/invariato/:/unchanged/);
  else assert.match(out,lang==='it'?/più lungo/:/longer/);
  assert.equal(JSON.stringify(row),raw);
 }
});

test('age is historical season age, absent age is not guessed',async()=>{
 await loadNarrativeEn();
 const line="Arrivare a ottobre intero: a quest'età è l'unico orgoglio che conta.";
 for(const lang of ['it','en'] as const){
  assert.match(contextualText(line,lang,{age:21}),lang==='it'?/ogni età/:/every age/);
  assert.equal(contextualText(line,lang,{age:34}),nx(line,lang));
  assert.equal(contextualText(line,lang),nx(line,lang));
 }
});

test('trade text names the recorded proposal, never claims acceptance',()=>{
 const row:DevRow={season:1,label:'Mercato',line:'Utah è nel foglio. Chicago è nel foglio.',before:60,after:60,tradeDest:NBA_TEAMS[0]};
 assert.match(developmentText(row,'it'),/Proposta.*Boston Celtics/);
 assert.doesNotMatch(developmentText(row,'en'),/Utah|Chicago|signed|accepted/);
});

test('all supported team first-week articles; duplicate city and Atlanta elision',()=>{
 for(const team of [...NBA_TEAMS,...EURO_TEAMS]) assert.doesNotMatch(nx(`Prima settimana a ${team.name}: nomi, uscite.`,'it'),new RegExp(`settimana a ${team.name}`));
 assert.match(nx('Prima settimana a Golden State Warriors: nomi.','it'),/ai Golden State Warriors/);
 assert.match(nx('A Atlanta il pubblico aspetta.','it'),/^Ad Atlanta/);
 assert.equal(nx('A San Francisco, la piazza di San Francisco entra già caldo.','it'),'A San Francisco, il pubblico è già caldo.');
});

test('roles, countries and plural honors are presentation labels, unknown ids retained',()=>{
 assert.equal(roleLabel('SG','it'),'Guardia tiratrice');assert.equal(roleLabel('SG','en'),'Shooting guard');assert.equal(roleLabel('guardia','en'),'Shooting guard');assert.equal(roleLabel('centro','en'),'Center');
 for(const [id,it,en] of [['ITA','Italia','Italy'],['SRB','Serbia','Serbia'],['USA','Stati Uniti','United States'],['FRA','Francia','France']]){
  assert.equal(nationLabel(id,'it'),it);assert.equal(nationLabel(id,'en'),en);
 }
 assert.equal(nationLabel('Unknown','en'),'Unknown');
 assert.equal(timelineLine({kind:'move',subject:'Atlanta Hawks',yearLabel:'2026-27'},'it'),'Passa agli Atlanta Hawks');
 assert.equal(seasonsLabel(1,'it'),'1 stagione');assert.equal(seasonsLabel(2,'it'),'2 stagioni');
 assert.equal(seasonsLabel(1,'en'),'1 season');assert.equal(seasonsLabel(2,'en'),'2 seasons');
 assert.equal(legacyAwardLabel('Sixth Man','it'),"Sesto uomo dell'anno");assert.equal(legacyAwardLabel('Sixth Man','en'),'Sixth Man of the Year');
});

test('public claims distinguish pre-draft path and local successful persistence',()=>{
 for(const lang of ['it','en'] as const){
  assert.match(t('guide1Body',lang),/pre-draft/);assert.match(t('guide4Body',lang),/browser/);
  assert.doesNotMatch(t('guide4Body',lang),/esattamente|exactly/);
 }
 for(const lang of ['it','en'] as const) assert.doesNotMatch(nx("Hai bruciato le tappe. Il grezzo, all'inizio, era il punto di forza e il rischio.",lang),/bruciato|skipped steps/);
});

test('real complete synthetic simulations keep full state and RNG unchanged after display',async()=>{
 await loadNarrativeEn();let placeholders=0;
 for(const seed of [777001,777002,777003,7107,89081]){
  const player=playCareerSim({name:'Copy synthetic',seed,difficulty:'pro',draft:'random',retirement:'retire'});
  const raw=JSON.stringify(player);
  for(const lang of ['it','en'] as const){
   for(const c of player.choiceLog){const text=contextualText(c.title,lang,{rivalName:player.rivalName});assert.doesNotMatch(text,/__RIVAL__|PivotRivalDisplayToken/);if(c.title.includes('__RIVAL__')){placeholders++;assert.ok(text.includes(player.rivalName)||text.includes(lang==='en'?'an opponent':'un avversario'));}}
   for(const d of player.devLog) developmentText(d,lang,player.seasonHistory.find(r=>r.season===d.season)?.age);
   for(const r of player.seasonHistory) contextualText(r.mood??'',lang,{age:r.age});
  }
  assert.equal(JSON.stringify(player),raw,'all PlayerState fields including RNG must be untouched by presentation');
 }
 assert.ok(placeholders>0,'sample must actually exercise simulated rival placeholder');
});


test('route endings state recorded preparation, not an unsupported successful trajectory',async()=>{
 await loadNarrativeEn();
 for(const source of ["Tutto è partito da un campus universitario.","Il ragazzo cresciuto in Europa è arrivato più lontano di quanto molti immaginassero.","Chi ha bruciato le tappe non ha mai smesso di correre."]){
  for(const lang of ['it','en'] as const){assert.match(nx(source,lang),/pre-draft/);assert.doesNotMatch(nx(source,lang),/immagin|imagined|never stopped|mai smesso/);}
 }
});
