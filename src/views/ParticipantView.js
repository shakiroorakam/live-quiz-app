import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { onSnapshot, doc, collection, setDoc, writeBatch, increment } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { BarChart2 } from 'lucide-react';
import { Spinner } from '../components/Spinner';

export function ParticipantView() {
    const { quizId } = useParams();
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [quiz, setQuiz] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [myParticipantData, setMyParticipantData] = useState(null);
    const [myAnswer, setMyAnswer] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [descriptiveAnswer, setDescriptiveAnswer] = useState('');
    
    const autoSubmitRef = useRef(false);
    const prevQuestionIdRef = useRef(null);
    const penaltyAppliedRef = useRef(false); // Ref for anti-browsing

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!quizId || !user) return;
        const unsubQuiz = onSnapshot(doc(db, "quizzes", quizId), (doc) => { setQuiz(doc.data()); });
        const unsubParticipants = onSnapshot(collection(db, `quizzes/${quizId}/participants`), (snap) => {
            const parts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            parts.sort((a, b) => b.score - a.score);
            setParticipants(parts);
        });
        const unsubMyData = onSnapshot(doc(db, `quizzes/${quizId}/participants`, user.uid), (doc) => {
            if (doc.exists()) { setMyParticipantData({ id: doc.id, ...doc.data() }); }
        });
        return () => { unsubQuiz(); unsubParticipants(); unsubMyData(); };
    }, [quizId, user]);

    useEffect(() => {
        if (quiz?.currentQuestionId && quiz.currentQuestionId !== prevQuestionIdRef.current) {
            setMyAnswer(null);
            setSelectedOption(null);
            setDescriptiveAnswer('');
            autoSubmitRef.current = false;
            penaltyAppliedRef.current = false; // Reset penalty tracker for new question
            prevQuestionIdRef.current = quiz.currentQuestionId;
        }
    }, [quiz?.currentQuestionId]);

    useEffect(() => {
        if (quiz?.currentQuestionId && user) {
            const answerDocPath = `quizzes/${quizId}/answers/${quiz.currentQuestionId}/submissions/${user.uid}`;
            const unsubMyAnswer = onSnapshot(doc(db, answerDocPath), (doc) => {
                setMyAnswer(doc.exists() ? doc.data() : null);
            });
            return () => unsubMyAnswer();
        }
    }, [quiz?.currentQuestionId, user, quizId]);

    // --- NEW: Anti-Browsing/Cheating Effect ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Check if a question is live, user hasn't answered, and penalty hasn't been applied
                if (quiz?.state === 'question_live' && !myAnswer && !penaltyAppliedRef.current) {
                    console.log("User navigated away. Applying penalty.");
                    penaltyAppliedRef.current = true; // Mark penalty as applied
                    handlePenaltySubmit();
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [quiz, myAnswer]); // Rerun when quiz state or answer status changes

    const handlePenaltySubmit = async () => {
        if (!user || !myParticipantData) return;
        const currentQuestion = quiz.questions.find(q => q.id === quiz.currentQuestionId);
        if (!currentQuestion) return;

        const answerDocPath = `quizzes/${quizId}/answers/${currentQuestion.id}/submissions/${user.uid}`;
        await setDoc(doc(db, answerDocPath), {
            answer: "Navigated away from quiz",
            participantName: myParticipantData.name,
            isCorrect: false, // Automatically incorrect
        });
    };

    const handleSubmitAnswer = async () => { /* ... same as before ... */ };
    const currentQuestion = quiz?.questions.find(q => q.id === quiz.currentQuestionId);

    const renderContent = () => {
        // ... lobby and other states remain the same ...

        if (quiz?.state === 'question_live' && currentQuestion) {
            if (myAnswer) { /* ... same as before ... */ }
            return (
                <div>
                    <p className="text-right text-primary font-weight-bold">{currentQuestion.points} points</p>
                    {/* --- THIS IS THE FIX: Added style to prevent copying --- */}
                    <h2 className="h1 text-center mb-4" style={{ userSelect: 'none' }}>{currentQuestion.text}</h2>
                    
                    {currentQuestion.type === 'mcq' ? (
                        <div className="row">
                            {currentQuestion.options.map((opt, i) => (
                                <div className="col-md-6 mb-3" key={i}>
                                    <button 
                                        onClick={() => setSelectedOption(i)}
                                        className={`btn btn-lg btn-block text-left ${selectedOption === i ? 'btn-primary' : 'btn-outline-primary'}`}
                                        style={{ userSelect: 'none' }} // Prevent copying option text
                                    >
                                        {opt}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : ( /* ... descriptive answer textarea ... */ )}

                    <div className="text-right mt-4">
                        <button onClick={handleSubmitAnswer} className="btn btn-success btn-lg">Submit Answer</button>
                    </div>
                </div>
            );
        }
        // ... other render states remain the same ...
    };

    if (authLoading || !quiz) { /* ... same as before ... */ }

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            {/* ... header and scoreboard remain the same ... */}
        </div>
    );
}

        
