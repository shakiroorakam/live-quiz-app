import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export function JoinQuizView({ user }) {
    const [userName, setUserName] = useState('');
    const [quizIdToJoin, setQuizIdToJoin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const navigate = useNavigate();
    
    // This component now handles its own anonymous sign-in
    useEffect(() => {
        if (!user) {
            signInAnonymously(auth).catch((err) => {
                console.error("JoinQuiz anonymous sign-in failed:", err);
                setError("Could not connect to the server. Please check your internet connection.");
            }).finally(() => {
                setIsConnecting(false);
            });
        } else {
            setIsConnecting(false);
        }
    }, [user]);

    const handleJoinQuiz = async () => {
        if (!userName.trim() || !quizIdToJoin.trim()) {
            setError("Please enter your name and a valid Quiz ID.");
            return;
        }
        if (!auth.currentUser) {
            setError("Not connected to the server. Please refresh the page.");
            return;
        }

        setLoading(true);
        setError('');
        const finalQuizId = quizIdToJoin.toUpperCase();

        try {
            const quizRef = doc(db, 'quizzes', finalQuizId);
            const quizSnap = await getDoc(quizRef);

            if (quizSnap.exists()) {
                const participantRef = doc(db, 'quizzes', finalQuizId, 'participants', auth.currentUser.uid);
                await setDoc(participantRef, {
                    name: userName,
                    score: 0,
                });
                navigate(`/quiz/${finalQuizId}`);
            } else {
                setError("Quiz not found! Please check the ID and try again.");
            }
        } catch (err) {
            setError("Could not join the quiz. Please try again later.");
            console.error(err);
        }
        setLoading(false);
    };

    if (isConnecting) {
        return (
             <div className="animated-card text-center" style={{maxWidth: '500px'}}>
                <div className="d-flex align-items-center justify-content-center text-dark">
                    <Loader2 className="animate-spin mr-3" />
                    <span>Connecting...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="animated-card text-dark text-center" style={{maxWidth: '500px'}}>
            <h1 className="font-weight-bold mb-3 text-primary">Join a Quiz</h1>
            <div className="form-group text-left">
                <label>Your Name</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                />
            </div>
            <div className="form-group text-left">
                <label>Quiz ID</label>
                <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter Quiz ID"
                    value={quizIdToJoin}
                    onChange={(e) => setQuizIdToJoin(e.target.value)}
                    style={{textTransform: 'uppercase'}}
                />
            </div>
            {error && <p className="text-danger mt-3">{error}</p>}
            <button
                className="btn btn-success btn-lg btn-block animated-button mt-4"
                onClick={handleJoinQuiz}
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin" /> : 'Join Quiz'}
            </button>
        </div>
    );
}
