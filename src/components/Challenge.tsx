import React, { useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { CATEGORIES, PLAYER_ANIMAL, type GameData, type GameHistoryCreate, type Player } from '../game.ts';
import { computeNextScores, isSessionComplete } from '../gameLogic';

interface ChallengeProps {
  game: GameData;
  myPseudo: Player;
}

const CIRCLE_LENGTH = 754;

export default function Challenge({ game, myPseudo }: ChallengeProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(game.timer_limit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const hasWrittenFinished = useRef(false);
  const hasWrittenScore = useRef(false);

  const isChallenger = myPseudo === game.challenger;
  const isTarget = myPseudo === game.target;
  const isCritical = timeLeft <= 3 && timeLeft > 0;
  const isMultipleChoiceRound = game.question_options.length > 0 && game.correct_option_index >= 0;
  const hasSelectedOption = game.selected_option_index >= 0;
  const computedSuccess = hasSelectedOption && game.selected_option_index === game.correct_option_index;

  useEffect(() => {
    hasWrittenFinished.current = false;
  }, [game.start_time, game.status, game.question_text]);

  useEffect(() => {
    if (game.status !== 'active' || !game.start_time) return;

    const timerId = window.setInterval(() => {
      const elapsedMs = Date.now() - game.start_time!.toMillis();
      const remainingSeconds = Math.max(0, game.timer_limit - elapsedMs / 1000);
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0 && !hasWrittenFinished.current) {
        hasWrittenFinished.current = true;
        void updateDoc(doc(db, 'games', 'active_duel'), { status: 'finished' });
      }
    }, 100);

    return () => window.clearInterval(timerId);
  }, [game.start_time, game.status, game.timer_limit]);

  const handleScore = async (success: boolean) => {
    if (!isChallenger || hasWrittenScore.current || isSubmitting) return;
    if (game.session_mode !== 'playing') return;

    hasWrittenScore.current = true;
    setIsSubmitting(true);
    setSubmitError('');

      // Determine who scores this round:
      // - If success=true: the answerer (game.target) gets the point
      // - If success=false: the asker (game.challenger) gets the point (they stumped them)
      const pointWinner: Player = success ? game.target : game.challenger;
      const nextScores = computeNextScores(game.scores, pointWinner, true);
    const nextAnswered = game.questions_answered + 1;
    const sessionComplete = isSessionComplete(nextAnswered, game.target_questions);
      const loser: Player = pointWinner === 'DoDo' ? 'JoJo' : 'DoDo';

    try {
      // Write game history entry
      const historyEntry: GameHistoryCreate = {
          winner: pointWinner,
        loser,
        category: game.category,
        question_text: game.question_text,
        success,
        timestamp: serverTimestamp(),
        scores_snapshot: nextScores,
      };

      await addDoc(collection(db, 'game_history'), historyEntry);

      // Compute next turn: switch to the NOT-asker (the one who will ask next)
      const nextTurn: Player = game.challenger === 'DoDo' ? 'JoJo' : 'DoDo';

      // Update game state
      await updateDoc(doc(db, 'games', 'active_duel'), {
        scores: nextScores,
        turn: nextTurn,
        status: 'waiting',
        score_pending: false,
        questions_answered: nextAnswered,
        session_mode: sessionComplete ? 'menu' : 'playing',
        needs_coin_toss: false,
        toss_clicks: { DoDo: false, JoJo: false },
        toss_choices: { DoDo: '', JoJo: '' },
        toss_side: '',
        toss_starter: '',
        challenger: '',
        target: '',
        category: '',
        question_text: '',
        flag_url: '',
        math_expression: '',
        question_options: [],
        correct_option_index: -1,
        selected_option_index: -1,
      });

      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setSubmitError(`Erreur lors de l enregistrement: ${message}`);
      setIsSubmitting(false);
      hasWrittenScore.current = false;
    }
  };

  const handleSelectOption = async (index: number) => {
    if (!isTarget || !isMultipleChoiceRound) return;
    if (game.status !== 'active') return;
    if (hasSelectedOption) return;

    try {
      if (hasWrittenScore.current || isSubmitting) return;
      hasWrittenScore.current = true;
      setIsSubmitting(true);
      setSubmitError('');

      const success = index === game.correct_option_index;
      const pointWinner: Player = success ? game.target : game.challenger;
      const nextScores = computeNextScores(game.scores, pointWinner, true);
      const nextAnswered = game.questions_answered + 1;
      const sessionComplete = isSessionComplete(nextAnswered, game.target_questions);
      const loser: Player = pointWinner === 'DoDo' ? 'JoJo' : 'DoDo';
      const nextTurn: Player = game.challenger === 'DoDo' ? 'JoJo' : 'DoDo';

      const historyEntry: GameHistoryCreate = {
        winner: pointWinner,
        loser,
        category: game.category,
        question_text: game.question_text,
        success,
        timestamp: serverTimestamp(),
        scores_snapshot: nextScores,
      };

      await addDoc(collection(db, 'game_history'), historyEntry);

      await updateDoc(doc(db, 'games', 'active_duel'), {
        scores: nextScores,
        turn: nextTurn,
        status: 'waiting',
        score_pending: false,
        questions_answered: nextAnswered,
        session_mode: sessionComplete ? 'menu' : 'playing',
        needs_coin_toss: false,
        toss_clicks: { DoDo: false, JoJo: false },
        toss_choices: { DoDo: '', JoJo: '' },
        toss_side: '',
        toss_starter: '',
        challenger: '',
        target: '',
        category: '',
        question_text: '',
        flag_url: '',
        math_expression: '',
        question_options: [],
        correct_option_index: -1,
        selected_option_index: -1,
      });

      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setSubmitError(`Erreur lors du choix de la reponse: ${message}`);
      setIsSubmitting(false);
      hasWrittenScore.current = false;
    }
  };

  const progress = useMemo(() => {
    return Math.max(0, Math.min(100, (timeLeft / game.timer_limit) * 100));
  }, [timeLeft, game.timer_limit]);

  const showManualScoreButtons =
    isChallenger && !isMultipleChoiceRound && (game.status === 'active' || game.status === 'finished');

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#F0F0F0] px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <section className="card text-center">
          <p className="text-xs uppercase tracking-widest text-[#888888] mb-2">Categorie</p>
          <div className="flex items-center justify-center gap-3 mb-3">
            <p className="text-4xl">{CATEGORIES[game.category as keyof typeof CATEGORIES]?.emoji || '❓'}</p>
            <div className="text-left">
              <h1 className="text-2xl font-bold">{game.category}</h1>
              <p className="text-xs text-[#888888] max-w-xs">
                {CATEGORIES[game.category as keyof typeof CATEGORIES]?.description || ''}
              </p>
            </div>
          </div>
          <p className="text-base text-[#F0F0F0] leading-relaxed mt-4">{game.question_text}</p>
          {game.flag_url && (
            <img
              src={game.flag_url}
              alt="Drapeau du pays a deviner"
              className="mx-auto mt-4 w-40 h-auto rounded-md border border-[#2c2c2c]"
            />
          )}
          {game.math_expression && (
            <p className="text-sm text-[#cfcfcf] mt-3">{game.math_expression}</p>
          )}
          <p className="text-sm mt-3 text-[#2DD4A0]">
            Repondant: <strong>{game.target}</strong> ({PLAYER_ANIMAL[game.target]})
          </p>
        </section>

        {isMultipleChoiceRound && (
          <section className="card">
            <p className="text-xs uppercase tracking-widest text-[#888888] mb-3">Choix multiple</p>
            <div className="grid grid-cols-1 gap-2">
              {game.question_options.map((option, index) => {
                const isSelected = game.selected_option_index === index;
                return (
                  <button
                    key={`${index}-${option}`}
                    type="button"
                    className={`w-full text-left px-4 py-3 rounded-lg border ${
                      isSelected ? 'border-[#2DD4A0] bg-[#123026]' : 'border-[#2c2c2c] bg-[#111111]'
                    }`}
                    disabled={!isTarget || game.status !== 'active' || hasSelectedOption}
                    onClick={() => void handleSelectOption(index)}
                  >
                    <span className="text-xs text-[#888888] mr-2">{String.fromCharCode(65 + index)}.</span>
                    <span className="text-sm text-[#F0F0F0]">{option}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#888888] mt-3">
              {isTarget
                ? hasSelectedOption
                  ? 'Reponse envoyee. Calcul du score...'
                  : 'Selectionne une seule reponse.'
                : hasSelectedOption
                  ? `${game.target} a selectionne une reponse. Calcul du score...`
                  : `En attente du choix de ${game.target}.`}
            </p>

            {hasSelectedOption && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 ${
                  computedSuccess ? 'border-[#2DD4A0] bg-[#123026]' : 'border-[#FF3B3B] bg-[#2a1414]'
                }`}
              >
                <p className={`text-sm font-bold ${computedSuccess ? 'text-[#7CFFD5]' : 'text-[#FFB3B3]'}`}>
                  {computedSuccess ? 'Bonne reponse!' : 'Mauvaise reponse!'}
                </p>
                <p className="text-xs text-[#cfcfcf] mt-1">
                  {computedSuccess
                    ? `${game.target} marque +1 point.`
                    : `${game.challenger} marque +1 point.`}
                </p>
              </div>
            )}
          </section>
        )}

        <section className="card flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            <svg viewBox="0 0 256 256" className="w-full h-full -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="#2a2a2a" strokeWidth="10" fill="none" />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke={isCritical ? '#FF3B3B' : '#FF6B35'}
                strokeWidth="10"
                fill="none"
                strokeDasharray={CIRCLE_LENGTH}
                strokeDashoffset={CIRCLE_LENGTH - (CIRCLE_LENGTH * progress) / 100}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`text-6xl font-bold ${isCritical ? 'timer-critical' : ''}`}>{Math.ceil(timeLeft)}</p>
              <p className="text-xs uppercase tracking-widest text-[#888888] mt-2">secondes</p>
            </div>
          </div>
        </section>

        <section className="card text-center">
          <p className="text-sm text-[#888888]">
            {myPseudo === game.target
              ? 'C est a toi de repondre maintenant.'
              : `Observe la reponse de ${game.target}.`}
          </p>
        </section>

        {submitError && (
          <section className="card border border-[#ff3b3b]">
            <p className="text-sm text-[#ffb3b3]">{submitError}</p>
          </section>
        )}

        {showManualScoreButtons && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              className="btn btn-success"
              disabled={isSubmitting}
              onClick={() => void handleScore(true)}
            >
              {isSubmitting ? 'Enregistrement...' : 'Reussi +1'}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={isSubmitting}
              onClick={() => void handleScore(false)}
            >
              {isSubmitting ? 'Enregistrement...' : 'Rate'}
            </button>
          </section>
        )}

      </div>
    </div>
  );
}
