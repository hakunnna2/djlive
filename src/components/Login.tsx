import React, { useState } from 'react';
import type { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LogIn, Music } from 'lucide-react';
import { auth } from '../firebase';
import { ALLOWED_EMAILS } from '../game.ts';

function formatAuthError(error: unknown): string {
  const code = (error as FirebaseError | undefined)?.code;

  switch (code) {
    case 'auth/invalid-credential':
      return 'Mot de passe incorrect.';
    case 'auth/user-not-found':
      return 'Compte non trouve.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Reessayez plus tard.';
    case 'auth/network-request-failed':
      return 'Erreur reseau. Verifiez votre connexion.';
    default:
      return (error as FirebaseError | undefined)?.message || 'Une erreur est survenue.';
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'email est autorisé côté client AVANT de contacter Firebase
    if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
      setError('Cette application est privée. Accès réservé aux comptes autorisés.');
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#151619] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#F27D26] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(242,125,38,0.4)]">
            <Music className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">DJ-Live Challenge</h1>
          <p className="text-gray-400 text-sm mt-2">Le duel ultime entre Panda et Ours</p>
          <p className="text-xs text-[#F27D26] mt-3 uppercase tracking-widest font-bold">
            Application privée
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F27D26] transition-colors"
              placeholder="dodo@dj.com ou jojo@dj.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F27D26] transition-colors"
              placeholder="••••••••"
              minLength={6}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F27D26] hover:bg-[#e06d1d] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <LogIn size={20} />
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Version privée pour DoDo et JoJo uniquement.
        </p>
      </div>
    </div>
  );
}
