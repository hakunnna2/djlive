import type { QuestionCategory } from './game';

export interface Question {
  id: number;
  category: QuestionCategory;
  text: string;
  timer: number;
  options?: string[];
  correctOptionIndex?: number;
}

export function isMultipleChoiceQuestion(question: Question): boolean {
  return (
    question.category === 'Energy Intel'
    && Array.isArray(question.options)
    && question.options.length >= 2
    && typeof question.correctOptionIndex === 'number'
    && question.correctOptionIndex >= 0
    && question.correctOptionIndex < question.options.length
  );
}

export const questions: Question[] = [
  { id: 1, category: 'Fast & Furious', text: 'Cite 5 apps que tu utilises trop sur ton tel.', timer: 8 },
  { id: 2, category: 'Fast & Furious', text: 'Donne 4 plats que tu commandes souvent en livraison.', timer: 9 },
  { id: 3, category: 'Fast & Furious', text: 'Nomme 5 marques de baskets en moins de 8 secondes.', timer: 8 },
  { id: 4, category: 'Fast & Furious', text: 'Cite 4 emoji que tu envoies tout le temps.', timer: 7 },
  { id: 5, category: 'Dilemme', text: 'Vivre 1 an dans l espace ou 1 an sous l eau ?', timer: 30 },
  { id: 6, category: 'Dilemme', text: 'Ne plus jamais voyager ou ne plus jamais sortir le soir ?', timer: 25 },
  { id: 7, category: 'Dilemme', text: 'Avoir toujours 10 minutes d avance ou 10 minutes de retard ?', timer: 20 },
  { id: 8, category: 'Dilemme', text: 'Partager ton historique internet ou tes notes vocales ?', timer: 20 },
  {
    id: 9,
    category: 'Energy Intel',
    text: 'Laquelle est une energie renouvelable ?',
    timer: 12,
    options: ['Charbon', 'Petrole', 'Hydraulique', 'Gaz naturel'],
    correctOptionIndex: 2,
  },
  {
    id: 10,
    category: 'Energy Intel',
    text: 'Combien de continents existent sur Terre ?',
    timer: 10,
    options: ['5', '6', '7', '8'],
    correctOptionIndex: 2,
  },
  {
    id: 11,
    category: 'Energy Intel',
    text: 'Quel gaz les humains respirent-ils principalement ?',
    timer: 9,
    options: ['Azote', 'Oxygene', 'Dioxyde de carbone', 'Hydrogene'],
    correctOptionIndex: 1,
  },
  {
    id: 12,
    category: 'Energy Intel',
    text: 'Quelle planete est la plus proche du Soleil ?',
    timer: 12,
    options: ['Venus', 'Mercure', 'Mars', 'Jupiter'],
    correctOptionIndex: 1,
  },
  { id: 13, category: 'Espion Géo', text: 'Dans quel pays se trouve Reykjavik ?', timer: 10 },
  { id: 14, category: 'Espion Géo', text: 'Quelle ville est surnommee la ville eternelle ?', timer: 10 },
  { id: 15, category: 'Espion Géo', text: 'Quel ocean se trouve a l est de Madagascar ?', timer: 12 },
  { id: 16, category: 'Espion Géo', text: 'Cite 3 pays d Afrique de l Ouest en 10 secondes.', timer: 10 },
  { id: 17, category: 'Perso', text: 'Ton talent inutile mais legendaire ?', timer: 18 },
  { id: 18, category: 'Perso', text: 'Le pire message envoye a la mauvaise personne ?', timer: 22 },
  { id: 19, category: 'Perso', text: 'Si on part en road trip demain, tu prends quoi en premier ?', timer: 20 },
  { id: 20, category: 'Perso', text: 'Ton excuse classique quand tu reponds en retard ?', timer: 16 },
  { id: 21, category: 'Fast & Furious', text: 'Cite 4 rappeurs francophones en moins de 7 secondes.', timer: 7 },
  { id: 22, category: 'Dilemme', text: 'Avoir un bouton pause sur la vie ou retour en arriere 30 secondes ?', timer: 24 },
];
