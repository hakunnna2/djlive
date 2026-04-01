/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Navigate, Route, Routes } from 'react-router-dom';
import { auth } from './firebase';
import Login from './components/Login';
import Dashboard from './components/Dashboard.tsx';
import ChallengePage from './components/ChallengePage.tsx';
import './App.css';

const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F27D26]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {user ? (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/select" element={<Dashboard />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Login />
      )}
      {import.meta.env.DEV && (
        <div className="fixed bottom-3 right-3 z-50 rounded-md border border-[#2a2a2a] bg-black/80 px-3 py-2 text-[10px] uppercase tracking-wider text-gray-300">
          Firebase: {firebaseProjectId || 'unknown-project'}
        </div>
      )}
    </div>
  );
}
