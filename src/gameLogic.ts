import type { Player } from './game';

export type TossSide = 'Pile' | 'Face';

export interface TossChoices {
  DoDo: TossSide | '';
  JoJo: TossSide | '';
}

export function computeNextScores(
  scores: { DoDo: number; JoJo: number },
  target: Player,
  success: boolean,
): { DoDo: number; JoJo: number } {
  if (!success) return { ...scores };
  return {
    ...scores,
    [target]: scores[target] + 1,
  };
}

export function isSessionComplete(nextAnswered: number, targetQuestions: number): boolean {
  return nextAnswered >= targetQuestions;
}

export function resolveTossStarter(
  choices: TossChoices,
  side: TossSide,
  tieBreaker: () => Player,
): Player {
  const candidates = (['DoDo', 'JoJo'] as Player[]).filter((player) => choices[player] === side);

  if (candidates.length === 1) {
    return candidates[0];
  }

  return tieBreaker();
}
