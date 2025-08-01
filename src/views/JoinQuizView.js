import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Wifi } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export function JoinQuizView() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [authStatus, setAuthStatus] = useState('pending'); // 'pending', 'success', 'failed'
    
    const [userName, setUserName] = useState('');
    const [quizId, setQuizId] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthStatus('success');
            } else {
                // If there's no user, it might be the first load or a failed sign-in
                // We will give it a moment, and if still no user, we'll mark it as failed.
                setTimeout(() => {
                    if (!auth.currentUser) {
                        setAuthStatus('failed');
                    }
                }, 2500); // Wait 2.5 seconds before showing the manual connect button
            }
        });
        return () => unsubscribe();
    }, []);

    const handleManualConnect = () => {
        setAuthStatus('pending'); // Show spinner while connecting
        signInAnonymously(auth).catch(error => {
            console.error("Manual sign-in failed:", error);
            setJoinError("Connection failed. Please check your network and try again.");
            setAuthStatus('failed');
        });
    };

    const handleJoin = async () => {
        setJoinError('');
        if (!user) {
            setJoinError("Authentication not ready. Please try again.");
            return;
        }
        if (!quizId || !userName) {
            setJoinError("Please enter a Quiz ID and your name.");
            return;
        }
        setIsJoining(true);
        try {
            const quizRef = doc(db, "quizzes", quizId.toUpperCase());
            const quizSnap = await getDoc(quizRef);
            if (quizSnap.exists()) {
                await setDoc(doc(db, `quizzes/${quizId.toUpperCase()}/participants`, user.uid), {
                    name: userName,
                    score: 0,
                });
                navigate(`/participant/${quizId.toUpperCase()}`);
            } else {
                setJoinError("Quiz not found! Please check the ID.");
            }
        } catch (error) {
            console.error("Firebase Error during join:", error);
            setJoinError("Permission Denied. Check Firestore rules.");
        } finally {
            setIsJoining(false);
        }
    };

    const renderContent = () => {
        if (authStatus === 'pending') {
            return <div className="text-center"><Loader2 className="animate-spin" size={48} /><p className="mt-3">Connecting...</p></div>;
        }

        if (authStatus === 'failed') {
            return (
                <div className="text-center">
                    <h3 className="text-danger">Connection Failed</h3>
                    <p className="text-muted mb-4">Could not connect to the server automatically. This can happen on some mobile browsers.</p>
                    <button className="btn btn-primary btn-lg" onClick={handleManualConnect}>
                        <Wifi className="mr-2" /> Connect to Server
                    </button>
                </div>
            );
        }

        // authStatus === 'success'
        return (
            <form onSubmit={(e) => { e.preventDefault(); handleJoin(); }}>
                <div className="form-group">
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        className="form-control form-control-lg"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        value={quizId}
                        onChange={(e) => setQuizId(e.target.value.toUpperCase())}
                        placeholder="Enter Quiz ID"
                        className="form-control form-control-lg"
                    />
                </div>
                {joinError && <p className="text-danger text-center mt-3">{joinError}</p>}
                <button
                    type="submit"
                    disabled={isJoining || !user}
                    className="btn btn-success btn-lg btn-block mt-4 d-flex align-items-center justify-content-center"
                >
                    {isJoining && <Loader2 className="animate-spin mr-2" />}
                    Join Quiz
                </button>
            </form>
        );
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="card-body p-5">
                    <button onClick={() => navigate('/')} className="btn btn-outline-secondary" style={{ position: 'absolute', top: '15px', left: '15px' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="card-title text-center text-success font-weight-bold mb-4">Join a Quiz</h2>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
