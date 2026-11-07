/** Synthetic presentation edges, not naturally observed season outcomes. */
import { writeFileSync } from 'node:fs';
import { playCareerSim } from '../../src/lib/pivot/engine.ts';
import { buildLiveSave } from '../../src/lib/pivot/save.ts';
const p=playCareerSim({name:'Copy synthetic',seed:777002,difficulty:'pro',draft:'random',retirement:'retire'});
p.careerId='copy-synthetic-777002';p.rivalName='Elijah Voss';p.nationality='Italia';
p.choiceLog=[{season:1,title:'Lo scontro con Elijah Voss',pick:'Gioco di squadra'},{season:2,title:'In sala video, tre azioni di __RIVAL__, una tua',pick:'Chiedi le tue tre, dopo'}];
p.devLog=[
 {season:1,label:'Estate di mobilità, già fatta',line:'Hai lavorato dove non si vede. A ottobre il passo è più lungo.',before:62,after:59},
 {season:2,label:'Estate di mobilità, già fatta',line:'Hai lavorato dove non si vede. A ottobre il passo è più lungo.',before:62,after:62},
 {season:3,label:'La tregua del corpo, tenuta per intero',line:"Arrivare a ottobre intero: a quest'età è l'unico orgoglio che conta.",before:62,after:63},
];
writeFileSync(process.argv[2]!,JSON.stringify(buildLiveSave(p,{kind:'retire'},[],'career','career',1)));
