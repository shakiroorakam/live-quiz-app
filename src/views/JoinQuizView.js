import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// --- FIX: Component now accepts 'user' as a prop ---
export function JoinQuizView({ user }) {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [quizId, setQuizId] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

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

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="card-body p-5">
                    <button onClick={() => navigate('/')} className="btn btn-outline-secondary" style={{ position: 'absolute', top: '15px', left: '15px' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="card-title text-center text-success font-weight-bold mb-4">Join a Quiz</h2>
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
                </div>
            </div>
        </div>
    );
}

        
