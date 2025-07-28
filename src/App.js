import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase/config';

import { HomeView } from './views/HomeView';
import { AdminLoginView } from './views/AdminLoginView';
import { JoinQuizView } from './views/JoinQuizView';
import { QuizMasterView } from './views/QuizMasterView';
import { ParticipantView } from './views/ParticipantView';
import { ScorecardView } from './views/ScorecardView';
import { Spinner } from './components/Spinner';

export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authFailed, setAuthFailed] = useState(false);

    const attemptSignIn = () => {
        setIsLoading(true);
        setAuthFailed(false);
        // This process can be blocked by mobile browsers
        signInAnonymously(auth).catch(error => {
            console.error("CRITICAL: Anonymous sign-in FAILED.", error);
            // If it fails, we show the manual start button
            setAuthFailed(true);
            setIsLoading(false);
        });
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Success!
                setUser(currentUser);
                setAuthFailed(false);
                setIsLoading(false);
            } else {
                // No user found, so we attempt the initial sign-in
                attemptSignIn();
            }
        });
        return () => unsubscribe();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return <Spinner text="Connecting to server..." />;
        }

        // If auth failed, show a manual start button.
        // Tapping this button is a direct user action, which mobile browsers allow.
        if (authFailed) {
            return (
                <div className="card text-center shadow-lg border-0">
                    <div className="card-body p-5">
                        <h2 className="card-title text-danger">Connection Failed</h2>
                        <p className="text-muted">Could not connect to the server automatically. This can happen on some mobile browsers.</p>
                        <button className="btn btn-primary btn-lg" onClick={attemptSignIn}>
                            Click Here to Start
                        </button>
                    </div>
                </div>
            );
        }

        // If auth is successful, show the router.
        // We pass the 'user' object down to the login/join views to enable the buttons.
        return (
            <HashRouter>
                <Routes>
                    <Route path="/" element={<HomeView />} />
                    <Route path="/login" element={<AdminLoginView user={user} />} />
                    <Route path="/join" element={<JoinQuizView user={user} />} />
                    <Route path="/master/:quizId" element={<QuizMasterView />} />
                    <Route path="/participant/:quizId" element={<ParticipantView />} />
                    <Route path="/score/:quizId" element={<ScorecardView />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </HashRouter>
        );
    };

    return (
        <div className="bg-light text-dark min-vh-100 d-flex align-items-center justify-content-center p-3">
            {renderContent()}
        </div>
    );
}

    
