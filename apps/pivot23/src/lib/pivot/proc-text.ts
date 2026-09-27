
import type { Lang } from "./i18n";

type Copy = {
  title: string;
  subtitle: string;
  choices: { label: string; detail: string; flavor: string }[];
};

/** Scene generate. L'italiano resta nel motore. Qui solo inglese e spagnolo. */
export function proceduralLocale(
  lang: Lang,
  kind: string,
  ctx: { age: number; team: string; rival: string; prior: string },
): Copy | null {
  if (lang === "it") return null;
  const bag = lang === "es" ? es(ctx) : en(ctx);
  const row = bag[kind];
  if (!row) return null;
  if (!ctx.prior) return row;
  return { ...row, subtitle: `${row.subtitle} ${ctx.prior}` };
}

function en(ctx: { age: number; team: string; rival: string }): Record<string, Copy> {
  const { age, team, rival } = ctx;
  return {
    corpo: {
      title: `At ${age}, the body sends the bill`,
      subtitle: `${age} years old, ${team}. The knee speaks before the report does. How do you answer?`,
      choices: [
        { label: "You cut the minutes", detail: "Fewer games, more full days.", flavor: "You leave early. The next day's report is shorter." },
        { label: "You play anyway", detail: "The group needs you tonight.", flavor: "You stay on the floor. The crowd sees it. So does the body." },
        { label: "Gym work, out of sight", detail: "No applause. Only the right movement.", flavor: "The gym door closes. Outside, nothing happens. Inside, it does." },
      ],
    },
    sfida: {
      title: `At ${age}, ${rival} comes looking`,
      subtitle: `${rival} is keeping score, and ${team} knows it. This is not a speech. It is a game.`,
      choices: [
        { label: "You answer at the rim", detail: "The first possession is yours.", flavor: `${rival} talks. You score. The argument ends on the scoreboard.` },
        { label: "You ignore him", detail: "The system matters more than the duel.", flavor: "You don't answer. The coach notices. So does he, and that is enough." },
        { label: "You guard him", detail: "The points can wait. He doesn't.", flavor: "You take him. The bucket comes later, if it comes." },
      ],
    },
    contratto: {
      title: `At ${age}, the contract is in its last winter`,
      subtitle: `${team} can keep you or let you go. The summer is already in the room.`,
      choices: [
        { label: "You ask to stay", detail: "Same jersey, said out loud.", flavor: "You say it. The front office writes it down, and does not promise." },
        { label: "You listen to the market", detail: "A door, not a betrayal.", flavor: "You listen. No signature. Just the price of your name." },
        { label: "You let the year talk", detail: "No meeting. Just games.", flavor: "You don't ask. The numbers, in April, will ask for you." },
      ],
    },
    freddo: {
      title: `At ${age}, the shot has gone cold`,
      subtitle: `${team} keeps running the play. The rim, tonight, does not cooperate.`,
      choices: [
        { label: "You keep shooting", detail: "The slump ends only if you shoot through it.", flavor: "You shoot again. One goes down. It is not a cure. It is a start." },
        { label: "You pass out of it", detail: "The open man is the play.", flavor: "You give it up. The basket comes from someone else. The slump can wait." },
        { label: "You ask for a day", detail: "One practice, no crowd.", flavor: "You stay late. The empty gym is more honest than the box score." },
      ],
    },
    caldo: {
      title: `At ${age}, the city is on you`,
      subtitle: `${team} is winning and the ball finds you. The noise arrives before the whistle.`,
      choices: [
        { label: "You take the last shot", detail: "The possession has your name on it.", flavor: "You call for it. Make or miss, the building already decided." },
        { label: "You share it", detail: "A hot hand that still passes.", flavor: "You give the last one away. The locker room remembers that more than the points." },
        { label: "You quiet the week", detail: "No extra interviews.", flavor: "You say less. The game, on Friday, has more room." },
      ],
    },
    panchina: {
      title: `At ${age}, the minutes are not there`,
      subtitle: `${team} has a rotation, and your name is near the end of it.`,
      choices: [
        { label: "You ask the coach", detail: "A closed door, a straight question.", flavor: "You ask. He doesn't raise his voice. He moves one possession. That's it." },
        { label: "You take the garbage minutes", detail: "The end of the game still counts.", flavor: "You play the last four minutes. They are ugly. They are yours." },
        { label: "You work and wait", detail: "No scene. Just the gym.", flavor: "You don't knock. When the minutes come, the body is already ready." },
      ],
    },
    anni: {
      title: `At ${age}, the league starts counting`,
      subtitle: `The legs are still there. The calendar is not on your side anymore.`,
      choices: [
        { label: "You change the game", detail: "Less running, more reading.", flavor: "You play lower. The bucket comes a second later, and it still counts." },
        { label: "You keep the same body", detail: "The old way, one more year.", flavor: "You don't change. Some nights it works. The knee keeps the receipt." },
        { label: "You teach in the film room", detail: "The voice becomes part of the job.", flavor: "You stop the tape. A younger teammate nods. That, too, is a possession." },
      ],
    },
    numeri: {
      title: `At ${age}, the numbers already have a role`,
      subtitle: `${team} knows what you produce. The question is what you want next.`,
      choices: [
        { label: "You ask for the ball", detail: "More usage, more noise.", flavor: "You ask. The next game, the first action is yours." },
        { label: "You stay in the role", detail: "The job is already working.", flavor: "You don't ask for more. The line stays clean, and so does the locker room." },
        { label: "You add the other end", detail: "The box score is not only points.", flavor: "You take a charge. The points were already there. The stop is new." },
      ],
    },
    ruolo: {
      title: `At ${age}, the role is the question`,
      subtitle: `${team} has a shape. You can fill it, or push it.`,
      choices: [
        { label: "You play your game", detail: "Your game, without asking permission.", flavor: "You take the first move. The scheme, for a night, follows you." },
        { label: "You stay in the scheme", detail: "The drawing matters more than the impulse.", flavor: "You execute. It is not a show. It is a win that makes no noise." },
        { label: "You play the helper", detail: "Someone else scores. You take his defender.", flavor: "Nobody says your name at the microphone. In the locker room, they do." },
      ],
    },
  };
}

function es(ctx: { age: number; team: string; rival: string }): Record<string, Copy> {
  const { age, team, rival } = ctx;
  return {
    corpo: {
      title: `A los ${age}, el cuerpo pasa la factura`,
      subtitle: `${age} años, ${team}. La rodilla avisa antes que el parte. ¿Cómo respondes?`,
      choices: [
        { label: "Cortas los minutos", detail: "Menos partidos, más días enteros.", flavor: "Sales antes. El parte del día siguiente es más corto." },
        { label: "Juegas igual", detail: "El grupo te necesita esta noche.", flavor: "Te quedas en la cancha. El público lo ve. El cuerpo también." },
        { label: "Trabajo en el gimnasio, lejos", detail: "Sin aplausos. Solo el gesto correcto.", flavor: "La puerta del gimnasio se cierra. Fuera no pasa nada. Dentro sí." },
      ],
    },
    sfida: {
      title: `A los ${age}, ${rival} te busca`,
      subtitle: `${rival} lleva la cuenta, y ${team} lo sabe. No es un discurso. Es un partido.`,
      choices: [
        { label: "Le respondes al aro", detail: "La primera posesión es tuya.", flavor: `${rival} habla. Tú anotas. La discusión acaba en el marcador.` },
        { label: "Lo ignoras", detail: "El sistema vale más que el duelo.", flavor: "No contestas. El entrenador lo nota. Él también, y basta." },
        { label: "Lo defiendes", detail: "Los puntos pueden esperar. Él no.", flavor: "Te lo quedas. El canasto llega después, si llega." },
      ],
    },
    contratto: {
      title: `A los ${age}, el contrato vive su último invierno`,
      subtitle: `${team} puede retenerte o dejarte ir. El verano ya está en la sala.`,
      choices: [
        { label: "Pides quedarte", detail: "La misma camiseta, dicha en voz alta.", flavor: "Lo dices. La directiva lo apunta, y no promete." },
        { label: "Escuchas el mercado", detail: "Una puerta, no una traición.", flavor: "Escuchas. Ninguna firma. Solo el precio de tu nombre." },
        { label: "Dejas que hable el año", detail: "Sin reunión. Solo partidos.", flavor: "No preguntas. Los números, en abril, preguntarán por ti." },
      ],
    },
    freddo: {
      title: `A los ${age}, el tiro se ha enfriado`,
      subtitle: `${team} sigue corriendo la jugada. El aro, esta noche, no colabora.`,
      choices: [
        { label: "Sigues tirando", detail: "La racha solo se rompe si tiras.", flavor: "Tiras otra vez. Entra uno. No es la cura. Es un inicio." },
        { label: "La pasas", detail: "El compañero solo es la jugada.", flavor: "La das. El canasto lo mete otro. La racha puede esperar." },
        { label: "Pides un día", detail: "Un entrenamiento, sin público.", flavor: "Te quedas tarde. El gimnasio vacío es más honesto que el acta." },
      ],
    },
    caldo: {
      title: `A los ${age}, la ciudad está contigo`,
      subtitle: `${team} gana y el balón te encuentra. El ruido llega antes que el silbato.`,
      choices: [
        { label: "Tomas el último tiro", detail: "La posesión lleva tu nombre.", flavor: "La pides. Entre o no, el pabellón ya decidió." },
        { label: "La compartes", detail: "Una mano caliente que aún pasa.", flavor: "Regalas la última. El vestuario lo recuerda más que los puntos." },
        { label: "Bajas el volumen de la semana", detail: "Sin entrevistas de más.", flavor: "Dices menos. El partido del viernes tiene más sitio." },
      ],
    },
    panchina: {
      title: `A los ${age}, los minutos no están`,
      subtitle: `${team} tiene una rotación, y tu nombre está cerca del final.`,
      choices: [
        { label: "Se lo pides al entrenador", detail: "Una puerta cerrada, una pregunta clara.", flavor: "Preguntas. No alza la voz. Mueve una posesión. Basta." },
        { label: "Te quedas los minutos de la basura", detail: "El final del partido también cuenta.", flavor: "Juegas los últimos cuatro minutos. Son feos. Son tuyos." },
        { label: "Trabajas y esperas", detail: "Sin escena. Solo el gimnasio.", flavor: "No llamas. Cuando llegan los minutos, el cuerpo ya está listo." },
      ],
    },
    anni: {
      title: `A los ${age}, la liga empieza a contar`,
      subtitle: `Las piernas siguen ahí. El calendario ya no está de tu lado.`,
      choices: [
        { label: "Cambias el juego", detail: "Menos carrera, más lectura.", flavor: "Juegas más abajo. El canasto llega un segundo después, y cuenta igual." },
        { label: "Mantienes el mismo cuerpo", detail: "El modo de siempre, un año más.", flavor: "No cambias. Algunas noches funciona. La rodilla guarda el recibo." },
        { label: "Enseñas en la sala de vídeo", detail: "La voz pasa a ser parte del trabajo.", flavor: "Paras la cinta. Un compañero más joven asiente. Eso también es una posesión." },
      ],
    },
    numeri: {
      title: `A los ${age}, los números ya tienen un rol`,
      subtitle: `${team} sabe lo que produces. La pregunta es qué quieres ahora.`,
      choices: [
        { label: "Pides el balón", detail: "Más uso, más ruido.", flavor: "Lo pides. En el partido siguiente, la primera acción es tuya." },
        { label: "Te quedas en el rol", detail: "El trabajo ya funciona.", flavor: "No pides más. La línea sigue limpia, y el vestuario también." },
        { label: "Añades el otro lado", detail: "El acta no es solo puntos.", flavor: "Cargas una falta. Los puntos ya estaban. La parada es nueva." },
      ],
    },
    ruolo: {
      title: `A los ${age}, el rol es la pregunta`,
      subtitle: `${team} tiene una forma. Puedes llenarla, o empujarla.`,
      choices: [
        { label: "Juegas lo tuyo", detail: "Tu juego, sin pedir permiso.", flavor: "Tomas la primera acción. El sistema, por una noche, te sigue." },
        { label: "Te quedas en el sistema", detail: "El dibujo vale más que el impulso.", flavor: "Ejecutas. No es un espectáculo. Es una victoria que no hace ruido." },
        { label: "Haces de acompañante", detail: "Otro anota. Tú le quitas al defensor.", flavor: "Nadie dice tu nombre en el micrófono. En el vestuario, sí." },
      ],
    },
  };
}
