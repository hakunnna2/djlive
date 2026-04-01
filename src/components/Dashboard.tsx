import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { LogOut, Trophy, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import QuestionSelector from './QuestionSelector.tsx';
import {
  DEFAULT_GAME,
  PLAYER_ANIMAL,
  PLAYER_EMOJI,
  getPlayerFromEmail,
  normalizeGameData,
  type GameData,
  type GameHistory,
  type Player,
} from '../game.ts';

interface DashboardStats {
  wins: { DoDo: number; JoJo: number };
  favorite: { DoDo: string; JoJo: string };
}

function computeStats(history: GameHistory[]): DashboardStats {
  const wins = { DoDo: 0, JoJo: 0 };
  const dodoCategories: Record<string, number> = {};
  const jojoCategories: Record<string, number> = {};

  for (const entry of history) {
    if (entry.winner === 'DoDo') {
      wins.DoDo += 1;
      dodoCategories[entry.category] = (dodoCategories[entry.category] ?? 0) + 1;
    }
    if (entry.winner === 'JoJo') {
      wins.JoJo += 1;
      jojoCategories[entry.category] = (jojoCategories[entry.category] ?? 0) + 1;
    }
  }

  const favoriteOf = (bucket: Record<string, number>): string => {
    const entries = Object.entries(bucket);
    if (entries.length === 0) return 'Aucune';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  return {
    wins,
    favorite: {
      DoDo: favoriteOf(dodoCategories),
      JoJo: favoriteOf(jojoCategories),
    },
  };
}

export default function Dashboard() {
  const entryChoiceKey = `dj_entry_choice_${auth.currentUser?.uid ?? 'unknown'}`;
  const navigate = useNavigate();
  const location = useLocation();

  const [game, setGame] = useState<GameData | null>(null);
  const [myPseudo, setMyPseudo] = useState<Player | null>(() => getPlayerFromEmail(auth.currentUser?.email));
  const [loading, setLoading] = useState(true);

  const [history, setHistory] = useState<GameHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);

  const [isTossing, setIsTossing] = useState(false);
  const [actionError, setActionError] = useState('');

  const [hasChosenEntryMode, setHasChosenEntryMode] = useState<boolean>(() => {
    return sessionStorage.getItem(`dj_entry_choice_${auth.currentUser?.uid ?? 'unknown'}`) === '1';
  });

  const stats = useMemo(() => computeStats(history), [history]);

  useEffect(() => {
    const initGame = async () => {
      const docRef = doc(db, 'games', 'active_duel');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, DEFAULT_GAME);
      }
    };

    void initGame();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'games', 'active_duel'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = normalizeGameData(snapshot.data() as Partial<GameData>);
          setGame(data);

          if (hasChosenEntryMode && data.status === 'active') {
            navigate('/challenge', { replace: true });
          } else if (hasChosenEntryMode && location.pathname === '/challenge' && data.status === 'waiting') {
            navigate('/', { replace: true });
          }
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [hasChosenEntryMode, location.pathname, navigate]);

  useEffect(() => {
    const historyQuery = query(collection(db, 'game_history'), orderBy('timestamp', 'desc'), limit(10));

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const next: GameHistory[] = snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<GameHistory, 'id'>;
          const loser = data.loser ?? (data.winner === 'DoDo' ? 'JoJo' : 'DoDo');
          return {
            id: entry.id,
            ...data,
            loser,
          };
        });

        setHistory(next);
        setHistoryError('');
      },
      (error) => {
        setHistoryError(`Historique indisponible: ${error.message}`);
      },
    );

    return () => unsubscribe();
  }, [historyRefreshTick]);

  useEffect(() => {
    if (!myPseudo) {
      setMyPseudo(getPlayerFromEmail(auth.currentUser?.email));
    }
  }, [myPseudo]);

  const handleLogout = async () => {
    sessionStorage.removeItem(entryChoiceKey);
    await auth.signOut();
  };

  const handleStartNewGame = async () => {
    setActionError('');
    try {
      await updateDoc(doc(db, 'games', 'active_duel'), {
        session_mode: 'playing',
        needs_coin_toss: true,
        questions_answered: 0,
        target_questions: 46,
        scores: { DoDo: 0, JoJo: 0 },
        status: 'waiting',
        score_pending: false,
        category: '',
        question_text: '',
        flag_url: '',
        math_expression: '',
        question_options: [],
        correct_option_index: -1,
        selected_option_index: -1,
        timer_limit: 10,
        start_time: null,
        toss_clicks: { DoDo: false, JoJo: false },
        toss_choices: { DoDo: '', JoJo: '' },
        toss_side: '',
        toss_starter: '',
      });
      sessionStorage.setItem(entryChoiceKey, '1');
      setHasChosenEntryMode(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setActionError(`Impossible de demarrer une partie: ${message}`);
    }
  };

  const handleLoadGame = async () => {
    setActionError('');
    try {
      await updateDoc(doc(db, 'games', 'active_duel'), {
        session_mode: 'playing',
        needs_coin_toss: false,
        flag_url: '',
        math_expression: '',
        question_options: [],
        correct_option_index: -1,
        selected_option_index: -1,
        toss_clicks: { DoDo: false, JoJo: false },
        toss_choices: { DoDo: '', JoJo: '' },
        toss_side: '',
        toss_starter: '',
      });
      sessionStorage.setItem(entryChoiceKey, '1');
      setHasChosenEntryMode(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setActionError(`Impossible de charger la partie: ${message}`);
    }
  };

  const handleTossReady = async () => {
    if (!game || isTossing || !myPseudo) return;

    setActionError('');
    setIsTossing(true);

    try {
      await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'games', 'active_duel');
        const gameSnap = await transaction.get(gameRef);
        if (!gameSnap.exists()) return;

        const current = normalizeGameData(gameSnap.data() as Partial<GameData>);
        if (!current.needs_coin_toss || current.session_mode !== 'playing') return;
        if (current.toss_clicks[myPseudo]) return;

        const nextClicks = { ...current.toss_clicks, [myPseudo]: true };
        const bothClicked = nextClicks.DoDo && nextClicks.JoJo;

        if (!bothClicked) {
          transaction.update(gameRef, {
            toss_clicks: nextClicks,
          });
          return;
        }

        const starter: Player = Math.random() < 0.5 ? 'DoDo' : 'JoJo';

        transaction.update(gameRef, {
          toss_clicks: nextClicks,
          toss_starter: starter,
          turn: starter,
          needs_coin_toss: false,
          toss_side: '',
          toss_choices: { DoDo: '', JoJo: '' },
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setActionError(`Impossible de valider le pret: ${message}`);
    } finally {
      setIsTossing(false);
    }
  };

  if (loading || !game) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#F0F0F0] flex items-center justify-center">
        Chargement de la partie...
      </div>
    );
  }

  if (!myPseudo) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#F0F0F0] flex items-center justify-center p-5 text-center">
        Ce compte n est pas reconnu.
      </div>
    );
  }

  const isMyTurn = game.turn === myPseudo;
  const otherPlayer: Player = myPseudo === 'DoDo' ? 'JoJo' : 'DoDo';
  const shouldShowStartMenu = !hasChosenEntryMode;
  const shouldShowCoinToss = game.session_mode === 'playing' && game.needs_coin_toss && game.status === 'waiting';
  const isGameCompleted = game.questions_answered >= game.target_questions;

  const finalWinner =
    game.scores.DoDo === game.scores.JoJo
      ? 'Egalite'
      : game.scores.DoDo > game.scores.JoJo
        ? 'DoDo'
        : 'JoJo';

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#F0F0F0]">
      <header className="score-bar">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FF6B35] text-white flex items-center justify-center">
            <Zap size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold">DJ-Live Challenge</h1>
            <p className="text-xs text-[#888888]">
              {PLAYER_ANIMAL.DoDo} ({PLAYER_EMOJI.DoDo}) vs {PLAYER_ANIMAL.JoJo} ({PLAYER_EMOJI.JoJo})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#2a2a2a] bg-[#111111]">
            <Trophy size={14} className="text-yellow-500" />
            <span className="text-sm font-mono">
              {game.scores.DoDo} - {game.scores.JoJo}
            </span>
          </div>
          <button type="button" onClick={() => void handleLogout()} className="text-[#888888] hover:text-white">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="main-offset max-w-3xl mx-auto px-4 py-6 space-y-5 pb-32">
        {actionError && (
          <section className="card border border-[#ff3b3b]">
            <p className="text-sm text-[#ffb3b3]">{actionError}</p>
          </section>
        )}

        {shouldShowStartMenu && (
          <section className="card text-center space-y-4">
            <p className="text-xs text-[#888888] uppercase tracking-widest">Mode de jeu</p>
            <h2 className="text-xl font-bold">Choisis une option</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => void handleStartNewGame()} className="btn btn-primary">
                Start a game
              </button>
              <button type="button" onClick={() => void handleLoadGame()} className="btn btn-success">
                Load game
              </button>
            </div>
            <p className="text-xs text-[#888888]">
              Une partie complete = {game.target_questions} questions ({game.target_questions / 2} par joueur)
            </p>
          </section>
        )}

        {shouldShowStartMenu && (
          <section className="card bg-[#111111] border border-[#2c2c2c]">
            <p className="text-xs text-[#888888] uppercase tracking-widest mb-3">📖 Comment jouer?</p>
            <div className="space-y-3 text-left">
              <div className="flex gap-3">
                <span className="text-lg">1️⃣</span>
                <div>
                  <p className="text-sm font-bold">Lancez une partie</p>
                  <p className="text-xs text-[#888888]">Cliquez sur "Start a game" ou "Load game"</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">2️⃣</span>
                <div>
                  <p className="text-sm font-bold">Validation (Coin toss)</p>
                  <p className="text-xs text-[#888888]">Les 2 joueurs cliquent "Je suis pret", un joueur commence</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">3️⃣</span>
                <div>
                  <p className="text-sm font-bold">Le tour du premier joueur</p>
                  <p className="text-xs text-[#888888]">Choisir une categorie → une question aleatoire est tiree</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">4️⃣</span>
                <div>
                  <p className="text-sm font-bold">L autre joueur repond</p>
                  <p className="text-xs text-[#888888]">Timer lance, le challenger valide: "Reussi +1" ou "Rate"</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-lg">5️⃣</span>
                <div>
                  <p className="text-sm font-bold">Alternez les rôles</p>
                  <p className="text-xs text-[#888888]">Le tour passe au 2e joueur. Repetez jusqu a 46 questions!</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {shouldShowCoinToss && (
          <section className="card text-center">
            <p className="text-xs text-[#888888] uppercase tracking-widest mb-2">Avant de jouer</p>
            <h2 className="text-xl font-bold mb-2">Validation des deux joueurs</h2>
            <p className="text-sm text-[#888888] mb-4">Les deux joueurs cliquent Pret, puis vous choisissez qui commence.</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card bg-[#111111] border border-[#2c2c2c]">
                <p className="text-sm font-bold">DoDo</p>
                <p className="text-xs mt-1 text-[#888888]">{game.toss_clicks.DoDo ? 'Pret' : 'En attente'}</p>
              </div>
              <div className="card bg-[#111111] border border-[#2c2c2c]">
                <p className="text-sm font-bold">JoJo</p>
                <p className="text-xs mt-1 text-[#888888]">{game.toss_clicks.JoJo ? 'Pret' : 'En attente'}</p>
              </div>
            </div>

            {isTossing && (
              <div className="flex flex-col items-center gap-2 mb-3">
                <div className="w-16 h-16 rounded-full bg-[#FF6B35] text-white text-3xl flex items-center justify-center animate-spin">
                  🪙
                </div>
                <p className="text-sm text-[#888888]">La piece tourne...</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleTossReady()}
              className="btn btn-primary"
              disabled={isTossing || game.toss_clicks[myPseudo]}
            >
              {game.toss_clicks[myPseudo] ? 'Tu es pret' : 'Je suis pret'}
            </button>

            {game.toss_starter && (
              <div className="space-y-2 mt-4">
                <p className="text-lg font-bold">
                  {game.toss_starter} ({PLAYER_ANIMAL[game.toss_starter]}) commence.
                </p>
              </div>
            )}
          </section>
        )}

        {history.length > 0 && (
          <section className="card">
            <p className="text-xs text-[#888888] uppercase tracking-widest mb-3">Stats globales</p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.wins.DoDo}</p>
                <p className="text-xs text-[#888888]">Victoires DoDo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.wins.JoJo}</p>
                <p className="text-xs text-[#888888]">Victoires JoJo</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <p className="text-xs text-[#888888] text-center">Categorie favorite DoDo: {stats.favorite.DoDo}</p>
              <p className="text-xs text-[#888888] text-center">Categorie favorite JoJo: {stats.favorite.JoJo}</p>
            </div>
          </section>
        )}

        {!shouldShowStartMenu && (
          <section className="card">
            <p className="text-xs text-[#888888] uppercase tracking-widest mb-2">Tour en cours</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold">
                  {game.turn === myPseudo
                    ? `A toi de jouer (${myPseudo})`
                    : `En attente de ${game.turn} (${PLAYER_ANIMAL[game.turn]})`}
                </p>
                <p className="text-sm text-[#888888] mt-1">
                  Ton role: {myPseudo} ({PLAYER_ANIMAL[myPseudo]})
                </p>
                <p className="text-sm text-[#888888] mt-1">
                  Progression: {game.questions_answered}/{game.target_questions} questions
                </p>
              </div>
              <div className="text-3xl">{PLAYER_EMOJI[game.turn]}</div>
            </div>
          </section>
        )}

        {!shouldShowStartMenu && isGameCompleted && (
          <section className="card text-center">
            <p className="text-xl font-bold">Partie terminee</p>
            <p className="text-sm text-[#888888] mt-2">Score final: {game.scores.DoDo} - {game.scores.JoJo}</p>
            <p className="text-sm text-[#888888] mt-1">Gagnant: {finalWinner}</p>
            <button type="button" className="btn btn-primary mt-4" onClick={() => void handleStartNewGame()}>
              Rejouer une partie
            </button>
          </section>
        )}

        {!shouldShowStartMenu && !isGameCompleted && !shouldShowCoinToss && isMyTurn ? (
          <QuestionSelector myPseudo={myPseudo} game={game} />
        ) : !shouldShowStartMenu && !isGameCompleted && !shouldShowCoinToss ? (
          <section className="card text-center">
            <p className="text-sm text-[#888888]">En attente de {otherPlayer}...</p>
            <p className="text-base mt-2">La manche commencera des qu il lance la bombe.</p>
          </section>
        ) : null}

        {historyError && (
          <section className="card border border-[#ff3b3b]">
            <p className="text-sm text-[#ffb3b3]">{historyError}</p>
            <button type="button" className="btn btn-danger mt-3" onClick={() => setHistoryRefreshTick((x) => x + 1)}>
              Reessayer l historique
            </button>
          </section>
        )}

        {history.length > 0 && (
          <section className="card">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full text-left flex items-center justify-between"
            >
              <p className="text-xs text-[#888888] uppercase tracking-widest">Historique des parties</p>
              <span className="text-sm">{showHistory ? '▼' : '▶'}</span>
            </button>

            {showHistory && (
              <div className="mt-4 space-y-2 border-t border-[#2a2a2a] pt-4">
                {history.map((item, idx) => (
                  <div key={item.id || idx} className="text-xs text-[#888888] pb-2 border-b border-[#1a1a1a]">
                    <p className="font-bold text-[#F0F0F0]">
                      {item.winner === 'DoDo' ? '🐻' : '🐼'} {item.winner} bat {item.loser} - {item.category}
                    </p>
                    <p className="text-[10px] mt-1">{item.success ? '✅ Reussi' : '❌ Rate'}</p>
                    <p className="text-[10px] text-[#666666]">{item.question_text.substring(0, 70)}...</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
