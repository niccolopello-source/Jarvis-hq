/** Read-only synthetic copy corpus; never reads browser/user saves. Run from apps/pivot23. */
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {playCareerSim,verdictOf} from '../apps/pivot23/src/lib/pivot/engine.ts';
import {careerCommentary} from '../apps/pivot23/src/lib/pivot/legacy.ts';
import {contextualText,developmentText} from '../apps/pivot23/src/lib/pivot/copy-context.ts';
import {nx,loadNarrativeEn} from '../apps/pivot23/src/lib/pivot/narrative/index.ts';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
await loadNarrativeEn();
const cases=[
 {seed:777001,role:'PG',path:'NCAA',nationality:'Italia'},
 {seed:777002,role:'SG',path:'Europa',nationality:'USA'},
 {seed:777003,role:'SF',path:'G-League',nationality:'Serbia'},
 {seed:7107,role:'PF',path:'NCAA',nationality:'Francia'},
 {seed:89081,role:'C',path:'Europa',nationality:'Canada'},
] as const;
const corpus=cases.map(c=>{
 const p=playCareerSim({...c,name:'Synthetic copy corpus',difficulty:'pro',draft:'random',retirement:'retire'});
 const before=JSON.stringify(p);
 const display={choices:p.choiceLog.map(row=>({...row,it:contextualText(row.title,'it',{rivalName:p.rivalName}),en:contextualText(row.title,'en',{rivalName:p.rivalName})})),
  development:p.devLog.map(row=>{const age=p.seasonHistory.find(r=>r.season===row.season)?.age;return {...row,age,it:developmentText(row,'it',age),en:developmentText(row,'en',age)};}),
  seasons:p.seasonHistory.map(row=>({season:row.season,age:row.age,overall:row.overall,raw:row.mood,it:contextualText(row.mood??'','it',{age:row.age}),en:contextualText(row.mood??'','en',{age:row.age})})),
  ending:{raw:verdictOf(p).closing,it:nx(verdictOf(p).closing,'it'),en:nx(verdictOf(p).closing,'en'),commentIt:nx(careerCommentary(p),'it'),commentEn:nx(careerCommentary(p),'en')}};
 const after=JSON.stringify(p);if(before!==after)throw Error(`copy mutated full PlayerState for ${c.seed}`);
 return {...c,engineVersion:p.engineVersion,rivalName:p.rivalName,fullStateBefore:hash(before),fullStateAfter:hash(after),unchanged:true,display};
});
writeFileSync(process.argv[2]!,JSON.stringify({purpose:'Synthetic semantic review sample, not population statistics or cross-revision equivalence proof',corpus},null,2)+'\n');
console.log('5 complete careers / all5 roles / all3 paths: PlayerState incl RNG unchanged; bilingual corpus written');
