import React from 'react';
// --- FIX: Import HashRouter instead of BrowserRouter ---
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { HomeView } from './views/HomeView';
import { AdminLoginView } from './views/AdminLoginView';
import { JoinQuizView } from './views/JoinQuizView';
import { QuizMasterView } from './views/QuizMasterView';
import { ParticipantView } from './views/ParticipantView';
import { ScorecardView } from './views/ScorecardView';

export default function App() {
    return (
        <div className="bg-light text-dark min-vh-100">
            {/* --- FIX: Use HashRouter for GitHub Pages compatibility --- */}
            <HashRouter>
                <Routes>
                    <Route path="/" element={<HomeView />} />
                    <Route path="/login" element={<AdminLoginView />} />
                    <Route path="/join" element={<JoinQuizView />} />
                    <Route path="/master/:quizId" element={<QuizMasterView />} />
                    <Route path="/participant/:quizId" element={<ParticipantView />} />
                    <Route path="/score/:quizId" element={<ScorecardView />} />
                    
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </HashRouter>
        </div>
    );
}
