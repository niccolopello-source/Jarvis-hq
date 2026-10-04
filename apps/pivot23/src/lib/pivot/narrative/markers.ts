/**
 * Language give-aways. Used to judge text the catalog could not resolve, and by the tests that
 * scan a whole screen for the wrong language. Case-sensitive on purpose: "PER" is a stat; "per" is left out because English uses it too ("per game").
 */
const IT_WORDS = "il|lo|la|gli|le|di|che|non|una|un|sei|hai|del|della|delle|dei|nel|nella|con|è|ti|si|al|alla|ma|più|tuo|tua|tuoi|anni|punti|stagione|squadra|partita|ancora|dopo|sempre|niente|anche|questa|questo|ogni|resta|chiude|chiudi";
const IT_CAPS = "Il|Lo|La|Gli|Le|Di|Che|Non|Una|Un|Sei|Hai|Nel|Nella|Con|È|Ti|Si|Ma|Più|Tuo|Tua|Niente|Ogni|Dopo|Ancora|Questa|Questo";
export const IT_PROSE = new RegExp(`(^|[^\\p{L}'’])(${IT_WORDS}|${IT_CAPS})(?=$|[^\\p{L}'’])`, "u");

const EN_WORDS = "the|you|your|and|with|of|is|are|was|for|this|that|season|team|game|years|points|still|after|before|every|nothing|into|from";
const EN_CAPS = "The|You|Your|And|With|This|That|Every|Nothing|After|Before";
export const EN_PROSE = new RegExp(`(^|[^\\p{L}'’])(${EN_WORDS}|${EN_CAPS})(?=$|[^\\p{L}'’])`, "u");
