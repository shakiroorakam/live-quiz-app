import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase/config';

import { HomeView } from './views/HomeView';
import { AdminLoginView } from './views/AdminLoginView';
import { JoinQuizView } from './views/JoinQuizView';
import { QuizMasterView } from './views/QuizMasterView';
import { ParticipantView } from './views/ParticipantView';
import { ScorecardView } from './views/ScorecardView';
import { ScoreboardOnlyView } from './views/ScoreboardOnlyView'; // 1. Import the new view
import { Navbar } from './components/Navbar';
import { Loader2 } from 'lucide-react';
import './App.css';

export default function App() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                // If there is no user, sign them in anonymously.
                // This ensures every visitor gets a stable user ID.
                signInAnonymously(auth).catch((error) => {
                    console.error("Anonymous sign-in failed:", error);
                    setAuthLoading(false); // Stop loading even if it fails
                });
                // The listener will fire again once sign-in is complete.
            }
             setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (authLoading) {
        return (
            <div className="app-background-dark d-flex vh-100 justify-content-center align-items-center text-light">
                <Loader2 className="animate-spin mr-3" />
                <span>Initializing...</span>
            </div>
        );
    }
    
    return (
        <HashRouter>
            <div className="app-background-dark">
                <Navbar user={user} />
                <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 56px)', padding: '20px 0' }}>
                    <Routes>
                        <Route path="/" element={<HomeView />} />
                        <Route path="/admin" element={<AdminLoginView user={user} />} />
                        <Route path="/join" element={<JoinQuizView user={user} />} />
                        <Route path="/quiz/:quizId/master" element={<QuizMasterView user={user} />} />
                        <Route path="/quiz/:quizId" element={<ParticipantView user={user} />} />
                        <Route path="/score/:quizId" element={<ScorecardView />} />
                        {/* 2. Add the new route for the scoreboard-only display */}
                        <Route path="/scoreboard/:quizId" element={<ScoreboardOnlyView />} />
                    </Routes>
                </div>
            </div>
        </HashRouter>
    );
}

