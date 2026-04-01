import React, { useMemo, useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  isFlagQuestion,
  isMathQuestion,
  isMultipleChoiceQuestion,
  questions,
  type Question,
} from '../questions.ts';
import { CATEGORIES, type GameData, type Player, type QuestionCategory } from '../game.ts';

interface QuestionSelectorProps {
  myPseudo: Player;
  game: GameData;
}

function pickRandomQuestion(category: QuestionCategory): Question | null {
  const candidates = questions.filter((question) => question.category === category);
  if (candidates.length === 0) return null;

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

export default function QuestionSelector({ myPseudo, game }: QuestionSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const target = useMemo<Player>(() => (myPseudo === 'DoDo' ? 'JoJo' : 'DoDo'), [myPseudo]);

  const handleCategoryClick = (category: QuestionCategory) => {
    setErrorMessage('');
    setSelectedCategory(category);
    setSelectedQuestion(pickRandomQuestion(category));
  };

  const handleLaunch = async () => {
    if (!selectedCategory || !selectedQuestion || isLaunching) return;

    setErrorMessage('');
    setIsLaunching(true);

    try {
      const questionOptions = isMultipleChoiceQuestion(selectedQuestion) ? selectedQuestion.options : [];
      const correctOptionIndex = isMultipleChoiceQuestion(selectedQuestion) ? selectedQuestion.correctOptionIndex : -1;
      const flagUrl = isFlagQuestion(selectedQuestion) ? selectedQuestion.flagUrl : '';
      const mathExpression = isMathQuestion(selectedQuestion) ? selectedQuestion.mathExpression : '';

      await updateDoc(doc(db, 'games', 'active_duel'), {
        challenger: myPseudo,
        target,
        category: selectedCategory,
        question_text: selectedQuestion.text,
        flag_url: flagUrl,
        math_expression: mathExpression,
        question_options: questionOptions,
        correct_option_index: correctOptionIndex,
        selected_option_index: -1,
        timer_limit: selectedQuestion.timer,
        start_time: serverTimestamp(),
        status: 'active',
        score_pending: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setErrorMessage(`Impossible de lancer le defi: ${message}`);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <section className="card">
      <h3 className="text-xl font-bold mb-1">Choisis une categorie</h3>
      <p className="text-sm text-[#888888] mb-5">Tu vas poser une question a {target}. A toi de choisir le theme!</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {Object.values(CATEGORIES).map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryClick(cat.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedCategory === cat.id
                ? 'border-[#FF6B35] bg-[#1a1a1a]'
                : 'border-[#2c2c2c] hover:border-[#FF6B35] hover:bg-[#0f0f0f]'
            }`}
          >
            <p className="text-3xl mb-2">{cat.emoji}</p>
            <p className="text-base font-bold text-[#F0F0F0]">{cat.name}</p>
            <p className="text-xs text-[#888888] mt-1">{cat.description}</p>
          </button>
        ))}
      </div>

      {selectedQuestion && (
        <div className="card mb-4 bg-[#111111] border border-[#2c2c2c]">
          <p className="text-xs text-[#888888] uppercase tracking-wider mb-2">Question tiree</p>
          {isFlagQuestion(selectedQuestion) && (
            <img
              src={selectedQuestion.flagUrl}
              alt="Drapeau"
              className="w-28 h-auto rounded-md border border-[#2c2c2c] mb-3"
            />
          )}
          <p className="text-base text-[#F0F0F0] leading-relaxed">{selectedQuestion.text}</p>
          {isMathQuestion(selectedQuestion) && selectedQuestion.mathExpression && (
            <p className="text-sm text-[#bfbfbf] mt-2">{selectedQuestion.mathExpression}</p>
          )}
          {isMultipleChoiceQuestion(selectedQuestion) && (
            <ul className="mt-3 space-y-2">
              {selectedQuestion.options.map((option, index) => (
                <li key={option} className="text-sm text-[#d6d6d6]">
                  {String.fromCharCode(65 + index)}. {option}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-[#2DD4A0] mt-3">⏱️ Duree: {selectedQuestion.timer} secondes</p>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary w-full"
        disabled={!selectedQuestion || isLaunching || game.status === 'active'}
        onClick={() => void handleLaunch()}
      >
        {isLaunching ? 'Lancement en cours...' : 'Lancer la bombe ✨'}
      </button>

      {errorMessage && <p className="text-sm text-[#FF3B3B] mt-3">{errorMessage}</p>}
    </section>
  );
}
