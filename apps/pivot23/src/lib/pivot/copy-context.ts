/** Render-only corrections. Never called by the engine, never mutate saves or consume RNG. */
import { t, tf, type Lang } from './i18n';
import type { DevRow } from './types';
import { nx } from './narrative';

export function contextualText(text: string, lang: Lang, ctx: {rivalName?:string;age?:number} = {}): string {
 let token='PivotRivalDisplayToken';
 while(text.includes(token)) token+='X';
 let out=nx(text.replaceAll('__RIVAL__',token),lang);
 const rival=ctx.rivalName?.trim();
 out=out.replaceAll(token, () => rival && !rival.includes('__') ? rival : t('copyOpponent',lang));
 if (typeof ctx.age === "number" && Number.isFinite(ctx.age) && ctx.age < 30) {
  const ageLines = [
   "Arrivare a ottobre intero: a quest'età è l'unico orgoglio che conta.",
   "Arrivare a ottobre intero: a quest'età è l'unico orgoglio che conta, e tu l'hai tenuto senza dichiararlo.",
   "Hai dormito, camminato, tornato. L'orgoglio, a quest'età, è arrivare a ottobre intero.",
  ];
  for (const line of ageLines) out=out.replaceAll(nx(line,lang),t('copyEveryAge',lang));
  const phase=t('copyAgePhase',lang);
  out=out.replace(/a quest'età|at this age/gi,match=>match[0]===match[0].toUpperCase()?phase:phase[0].toLowerCase()+phase.slice(1));
 }
 return out;
}

export function developmentText(row: DevRow, lang: Lang, age?:number): string {
 if(row.tradeDest) return tf('copyTradeProposal',{team:row.tradeDest.name},lang);
 const delta=row.after-row.before;
 // These lines claim progress, not merely participation. Judge against the displayed OVR,
 // without inventing an attribute increase from unavailable historical attribute snapshots.
 if (Number.isFinite(delta) && delta<=0 && /(?:passo.*(?:più lungo|un altro)|tiro.*più pulito|ruolo.*(?:più tuo|un altro)|letture.*prima|gesto.*(?:un altro|cambiato)|passo lo dice)/i.test(row.line)) {
  if(delta<0) return t('copyDevDecline',lang);
  return t('copyDevStable',lang);
 }
 return contextualText(row.line,lang,{age});
}

/** Old archive formats omit rivalName. Reuse only an explicit stored encounter, else neutral. */
export function archivedRival(choices: readonly {title:string}[]): string | undefined {
 for (const c of choices) { const m=/^Lo scontro con (.+)$/.exec(c.title);if(m && !m[1].includes('__') && m[1].trim()) return m[1]; }
 return undefined;
}
