import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import Challenge from './Challenge.tsx';
import { getPlayerFromEmail, normalizeGameData, type GameData, type Player } from '../game.ts';

export default function ChallengePage() {
  const navigate = useNavigate();
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myPseudo, setMyPseudo] = useState<Player | null>(() => getPlayerFromEmail(auth.currentUser?.email));

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'games', 'active_duel'),
      (snapshot) => {
        if (!snapshot.exists()) {
          setLoading(false);
          navigate('/select', { replace: true });
          return;
        }

        const data = normalizeGameData(snapshot.data() as Partial<GameData>);
        setGame(data);
        setLoading(false);

        if (data.status !== 'active') {
          navigate('/select', { replace: true });
        }
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!myPseudo) {
      setMyPseudo(getPlayerFromEmail(auth.currentUser?.email));
    }
  }, [myPseudo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#F0F0F0] flex items-center justify-center">
        Chargement du defi...
      </div>
    );
  }

  if (!game || !myPseudo) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-[#F0F0F0] flex items-center justify-center p-6 text-center">
        Impossible de determiner le joueur courant.
      </div>
    );
  }

  return <Challenge game={game} myPseudo={myPseudo} />;
}
