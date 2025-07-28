import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
// --- THIS IS THE FIX: Import 'increment' from firestore ---
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
    const [myAnswer, setMyAnswer] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [descriptiveAnswer, setDescriptiveAnswer] = useState('');
    
    const autoSubmitRef = useRef(false);
    const prevQuestionIdRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!quizId) return;
        const unsubQuiz = onSnapshot(doc(db, "quizzes", quizId), (doc) => {
            setQuiz(doc.data());
        });
        const unsubParticipants = onSnapshot(collection(db, `quizzes/${quizId}/participants`), (snap) => {
            const parts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            parts.sort((a, b) => b.score - a.score);
            setParticipants(parts);
        });
        return () => { 
            unsubQuiz(); 
            unsubParticipants(); 
        };
    }, [quizId]);

    useEffect(() => {
        if (quiz?.currentQuestionId && quiz.currentQuestionId !== prevQuestionIdRef.current) {
            setMyAnswer(null);
            setSelectedOption(null);
            setDescriptiveAnswer('');
            autoSubmitRef.current = false;
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

    const handleSubmitAnswer = async () => {
        if (!user) return;
        const me = participants.find(p => p.id === user.uid);
        const currentQuestion = quiz.questions.find(q => q.id === quiz.currentQuestionId);
        if (!me || !currentQuestion) return;

        let answerToSubmit = '';
        if (currentQuestion.type === 'mcq') {
            if (selectedOption === null) return;
            answerToSubmit = currentQuestion.options[selectedOption];
        } else {
            if (descriptiveAnswer.trim() === '') return;
            answerToSubmit = descriptiveAnswer;
        }
        
        const isCorrect = currentQuestion.type === 'mcq' ? (answerToSubmit === currentQuestion.correctAnswer) : null;
        
        const batch = writeBatch(db);

        const answerDocPath = `quizzes/${quizId}/answers/${currentQuestion.id}/submissions/${user.uid}`;
        const answerRef = doc(db, answerDocPath);
        batch.set(answerRef, {
            answer: answerToSubmit,
            participantName: me.name,
            isCorrect: isCorrect,
        });

        // --- THIS IS THE FIX ---
        // If the question is an MCQ and the answer is correct, update the score
        // using the robust 'increment' method.
        if (currentQuestion.type === 'mcq' && isCorrect) {
            const participantRef = doc(db, `quizzes/${quizId}/participants`, user.uid);
            batch.update(participantRef, { score: increment(currentQuestion.points || 0) });
        }
        
        await batch.commit();
    };

    const currentQuestion = quiz?.questions.find(q => q.id === quiz.currentQuestionId);

    const renderContent = () => {
        if (quiz?.state === 'lobby') {
            return (
                <div className="text-center">
                    <h2 className="display-4">Welcome to the Quiz!</h2>
                    <p className="lead text-muted">The Quiz Master is preparing the questions. Please wait...</p>
                    <Spinner />
                </div>
            );
        }

        if (quiz?.state === 'question_live' && currentQuestion) {
            if (myAnswer) {
                return (
                    <div className="text-center">
                        <h2 className="display-4">Answer Submitted!</h2>
                        <p className="lead text-muted">Waiting for the Quiz Master to end the question.</p>
                        <div className="mt-4"><Spinner text="Waiting..." /></div>
                    </div>
                );
            }
            return (
                <div>
                    <p className="text-right text-primary font-weight-bold">{currentQuestion.points} points</p>
                    <h2 className="h1 text-center mb-4">{currentQuestion.text}</h2>
                    
                    {currentQuestion.type === 'mcq' ? (
                        <div className="row">
                            {currentQuestion.options.map((opt, i) => (
                                <div className="col-md-6 mb-3" key={i}>
                                    <button 
                                        onClick={() => setSelectedOption(i)}
                                        className={`btn btn-lg btn-block text-left ${selectedOption === i ? 'btn-primary' : 'btn-outline-primary'}`}
                                    >
                                        {opt}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="form-group">
                            <textarea 
                                className="form-control" 
                                rows="5" 
                                placeholder="Type your answer here..."
                                value={descriptiveAnswer}
                                onChange={(e) => setDescriptiveAnswer(e.target.value)}
                            ></textarea>
                        </div>
                    )}

                    <div className="text-right mt-4">
                        <button onClick={handleSubmitAnswer} className="btn btn-success btn-lg">
                            Submit Answer
                        </button>
                    </div>
                </div>
            );
        }

        if (quiz?.state === 'question_ended' && currentQuestion) {
            if (!myAnswer && !autoSubmitRef.current) {
                const hasMcqAnswer = currentQuestion.type === 'mcq' && selectedOption !== null;
                const hasDescAnswer = currentQuestion.type === 'descriptive' && descriptiveAnswer.trim() !== '';

                if (hasMcqAnswer || hasDescAnswer) {
                    autoSubmitRef.current = true;
                    handleSubmitAnswer();
                    return (
                        <div className="text-center">
                            <h2 className="display-4">Time's Up!</h2>
                            <p className="lead text-muted">Submitting your answer automatically...</p>
                            <div className="mt-4"><Spinner /></div>
                        </div>
                    );
                }
            }

            let resultMessage = "Waiting for verification...";
            let alertClass = "alert-info";
            if (myAnswer?.isCorrect === true) {
                resultMessage = `Correct! +${currentQuestion.points} points`;
                alertClass = "alert-success";
            } else if (myAnswer?.isCorrect === false) {
                resultMessage = `Incorrect!`;
                if(currentQuestion.type === 'mcq') {
                    resultMessage += ` The correct answer was: ${currentQuestion.correctAnswer}`;
                }
                alertClass = "alert-danger";
            } else if (!myAnswer) {
                resultMessage = "You didn't answer this question.";
                alertClass = "alert-warning";
            }

            return (
                <div className={`alert ${alertClass} text-center`}>
                    <h2 className="h1">{resultMessage}</h2>
                    <p className="lead">Waiting for the next question from the Quiz Master.</p>
                     <div className="mt-4"><Spinner text="Waiting..." /></div>
                </div>
            );
        }

        return (
            <div className="text-center">
                <h2 className="display-4">Quiz Lobby</h2>
                <p className="lead text-muted">Waiting for the Quiz Master...</p>
                 <div className="mt-4"><Spinner /></div>
            </div>
        );
    };

    if (authLoading || !quiz) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <Spinner text="Loading Quiz..." />
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div className="d-flex justify-content-between align-items-center my-4">
                <h1 className="h3">{quiz?.quizMasterName}'s Quiz</h1>
                <div className="text-right">
                    <p className="h4 font-weight-bold text-primary mb-0">{participants.find(p=>p.id === user?.uid)?.score || 0} pts</p>
                    <p className="text-muted mb-0">Your Score</p>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-4 p-md-5" style={{ minHeight: '30rem' }}>
                    {renderContent()}
                </div>
            </div>
            
            <div className="card shadow-sm border-0 mt-4">
                <div className="card-header bg-white h5"><BarChart2 className="mr-2 text-primary"/>Scoreboard</div>
                <ul className="list-group list-group-flush">
                    {participants.map((p, index) => (
                        <li key={p.id} className={`list-group-item d-flex justify-content-between align-items-center ${p.id === user?.id ? 'bg-primary text-white' : ''}`}>
                            <div>
                                <span className="font-weight-bold mr-3">{index + 1}.</span>
                                <span>{p.name}</span>
                            </div>
                            <span className={`badge ${p.id === user?.id ? 'badge-light' : 'badge-primary'} badge-pill p-2`}>{p.score} pts</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
