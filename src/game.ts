import type { FieldValue, Timestamp } from 'firebase/firestore';

export type Player = 'DoDo' | 'JoJo';

export type QuestionCategory =
  | 'Fast & Furious'
  | 'Dilemme'
  | 'Energy Intel'
  | 'Espion Géo'
  | 'Perso'
  | 'Drapeaux'
  | 'Maths';

export interface CategoryInfo {
  id: QuestionCategory;
  emoji: string;
  name: string;
  description: string;
  color: string;
}

export const CATEGORIES: Record<QuestionCategory, CategoryInfo> = {
  'Fast & Furious': {
    id: 'Fast & Furious',
    emoji: '⚡',
    name: 'Fast & Furious',
    description: 'Liste des choses rapidement. Défi contre la montre!',
    color: '#FF6B35',
  },
  'Dilemme': {
    id: 'Dilemme',
    emoji: '🤔',
    name: 'Dilemme',
    description: 'Choisis entre 2 scénarios impossibles. Justifie ta réponse!',
    color: '#FF9F1C',
  },
  'Energy Intel': {
    id: 'Energy Intel',
    emoji: '🧠',
    name: 'Energy Intel',
    description: 'Questions de culture générale. Teste tes connaissances!',
    color: '#2DD4A0',
  },
  'Espion Géo': {
    id: 'Espion Géo',
    emoji: '🗺️',
    name: 'Espion Géo',
    description: 'Géographie et localisation. Cherche sur une carte mentale!',
    color: '#0EA5E9',
  },
  'Perso': {
    id: 'Perso',
    emoji: '😏',
    name: 'Perso',
    description: 'Questions personnelles. Révèle-toi! Pas de bonnes/mauvaises réponses.',
    color: '#EC4899',
  },
  'Drapeaux': {
    id: 'Drapeaux',
    emoji: '🏁',
    name: 'Drapeaux',
    description: 'Reconnais le pays a partir du drapeau.',
    color: '#22C55E',
  },
  'Maths': {
    id: 'Maths',
    emoji: '🧮',
    name: 'Maths',
    description: 'Calcul mental, logique et problemes rapides.',
    color: '#A855F7',
  },
};

export interface GameData {
  challenger: Player;
  target: Player;
  category: string;
  question_text: string;
  flag_url: string;
  math_expression: string;
  question_options: string[];
  correct_option_index: number;
  selected_option_index: number;
  timer_limit: number;
  start_time: Timestamp | null;
  status: 'waiting' | 'active' | 'finished';
  score_pending: boolean;
  turn: Player;
  scores: { DoDo: number; JoJo: number };
  session_mode: 'menu' | 'playing';
  needs_coin_toss: boolean;
  questions_answered: number;
  target_questions: number;
  toss_clicks: { DoDo: boolean; JoJo: boolean };
  toss_choices: { DoDo: 'Pile' | 'Face' | ''; JoJo: 'Pile' | 'Face' | '' };
  toss_side: 'Pile' | 'Face' | '';
  toss_starter: Player | '';
}

export const ACCOUNT_TO_PLAYER: Record<string, Player> = {
  'dodo@dj.com': 'DoDo',
  'jojo@dj.com': 'JoJo',
};

export const PLAYER_ANIMAL: Record<Player, 'Ours' | 'Panda'> = {
  DoDo: 'Ours',
  JoJo: 'Panda',
};

export const PLAYER_EMOJI: Record<Player, string> = {
  DoDo: '🐻',
  JoJo: '🐼',
};

export const DEFAULT_GAME: GameData = {
  challenger: 'DoDo',
  target: 'JoJo',
  category: '',
  question_text: '',
  flag_url: '',
  math_expression: '',
  question_options: [],
  correct_option_index: -1,
  selected_option_index: -1,
  timer_limit: 10,
  start_time: null,
  status: 'waiting',
  score_pending: false,
  turn: 'DoDo',
  scores: { DoDo: 0, JoJo: 0 },
  session_mode: 'menu',
  needs_coin_toss: false,
  questions_answered: 0,
  target_questions: 46,
  toss_clicks: { DoDo: false, JoJo: false },
  toss_choices: { DoDo: '', JoJo: '' },
  toss_side: '',
  toss_starter: '',
};

export function normalizeGameData(data: Partial<GameData>): GameData {
  return {
    ...DEFAULT_GAME,
    ...data,
    question_options: Array.isArray(data.question_options) ? data.question_options : DEFAULT_GAME.question_options,
    correct_option_index:
      typeof data.correct_option_index === 'number' ? data.correct_option_index : DEFAULT_GAME.correct_option_index,
    selected_option_index:
      typeof data.selected_option_index === 'number'
        ? data.selected_option_index
        : DEFAULT_GAME.selected_option_index,
    scores: {
      ...DEFAULT_GAME.scores,
      ...data.scores,
    },
  };
}

export function getPlayerFromEmail(email: string | null | undefined): Player | null {
  if (!email) return null;
  return ACCOUNT_TO_PLAYER[email.toLowerCase()] ?? null;
}

export interface GameHistory {
  id?: string;
  winner: Player;
  loser: Player;
  category: string;
  question_text: string;
  success: boolean;
  timestamp: Timestamp;
  scores_snapshot: { DoDo: number; JoJo: number };
}

export interface GameHistoryCreate {
  winner: Player;
  loser: Player;
  category: string;
  question_text: string;
  success: boolean;
  timestamp: FieldValue;
  scores_snapshot: { DoDo: number; JoJo: number };
}

export const ALLOWED_EMAILS = ['dodo@dj.com', 'jojo@dj.com'];

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
