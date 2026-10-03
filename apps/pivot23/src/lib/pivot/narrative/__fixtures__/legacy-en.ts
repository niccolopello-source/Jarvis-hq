/**
 * Test fixture: the English procedural copy that releases before this one wrote into saves
 * when a career was played in English (copied verbatim from the removed proc-text.ts, plus the
 * contract pitches and the "year before" line). Used to prove old saves still read in Italian.
 */
type Copy = { title: string; subtitle: string; choices: { label: string; detail: string; flavor: string }[] };

export function legacyProcEn(ctx: { age: number; team: string; rival: string }): Record<string, Copy> {
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

export function legacyPitchEn(team: string): string[] {
  return [
    `Extension. ${team} wants you to stay.`,
    `${team} is chasing a ring. Less money, a real contender.`,
    `${team} offers market money and a lead role.`,
    `The richest offer comes from ${team}. The project comes after the check.`,
    `EuroLeague: ${team}. Another stage, the same ball.`,
    `Two years at ${team} to show the peak is not behind you.`,
    `${team} wants a piece for a title run. Real minutes.`,
    `${team} offers a lead role, without promising June.`,
    `${team} is rebuilding. The minutes come now. The wins come later.`,
  ];
}

export const LEGACY_PRIOR_EN = [
  "The year before, you finished at 14.2 points.",
  "The year before, you finished at 18.0 points, 6.1 rebounds, 4.4 assists.",
  "The year before, you finished at 9.5 points, 1.2 steals and 0.8 blocks.",
];
