import { describe, expect, it } from 'vitest';
import { computeNextScores, isSessionComplete, resolveTossStarter } from './gameLogic';

describe('gameLogic', () => {
  it('computeNextScores increments target score on success', () => {
    const next = computeNextScores({ DoDo: 2, JoJo: 3 }, 'DoDo', true);
    expect(next).toEqual({ DoDo: 3, JoJo: 3 });
  });

  it('computeNextScores keeps score unchanged on failure', () => {
    const next = computeNextScores({ DoDo: 2, JoJo: 3 }, 'JoJo', false);
    expect(next).toEqual({ DoDo: 2, JoJo: 3 });
  });

  it('isSessionComplete returns true at target', () => {
    expect(isSessionComplete(46, 46)).toBe(true);
    expect(isSessionComplete(47, 46)).toBe(true);
    expect(isSessionComplete(45, 46)).toBe(false);
  });

  it('resolveTossStarter picks matching chooser', () => {
    const starter = resolveTossStarter(
      { DoDo: 'Pile', JoJo: 'Face' },
      'Pile',
      () => 'JoJo',
    );
    expect(starter).toBe('DoDo');
  });

  it('resolveTossStarter uses tie breaker when no unique match', () => {
    const starter = resolveTossStarter(
      { DoDo: 'Pile', JoJo: 'Pile' },
      'Face',
      () => 'JoJo',
    );
    expect(starter).toBe('JoJo');
  });

  it('full round flow: start -> toss -> score -> next turn', () => {
    // Start game baseline
    let turn: 'DoDo' | 'JoJo' = 'DoDo';
    let scores = { DoDo: 0, JoJo: 0 };
    let answered = 0;
    const targetQuestions = 46;

    // Toss phase: DoDo chooses Pile, JoJo chooses Face, result is Face => JoJo starts
    const starter = resolveTossStarter(
      { DoDo: 'Pile', JoJo: 'Face' },
      'Face',
      () => 'DoDo',
    );
    expect(starter).toBe('JoJo');
    turn = starter;

    // Round launch implies challenger=turn and target=other player
    const target: 'DoDo' | 'JoJo' = turn === 'DoDo' ? 'JoJo' : 'DoDo';
    expect(target).toBe('DoDo');

    // Score decision: success gives +1 to target, then next turn = target
    scores = computeNextScores(scores, target, true);
    answered += 1;
    turn = target;

    expect(scores).toEqual({ DoDo: 1, JoJo: 0 });
    expect(turn).toBe('DoDo');
    expect(isSessionComplete(answered, targetQuestions)).toBe(false);
  });
});
