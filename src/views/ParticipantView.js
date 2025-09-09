import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import { onSnapshot, doc, collection, setDoc, writeBatch, increment } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Loader2, BarChart2 } from 'lucide-react';

// Language detection helper
const getLangClass = (text) => {
    if (!text) return '';
    if (/[\u0600-\u06FF]/.test(text)) return 'lang-ar'; // Arabic
    if (/[\u0D00-\u0D7F]/.test(text)) return 'lang-ml'; // Malayalam
    return '';
};

export function ParticipantView({ user }) {
    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [myParticipantData, setMyParticipantData] = useState(null);
    const [myAnswer, setMyAnswer] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [descriptiveAnswer, setDescriptiveAnswer] = useState('');
    const hasSubmittedRef = useRef(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Effect 1: Fetch Quiz Data
    useEffect(() => {
        if (!quizId) return;
        const quizRef = doc(db, 'quizzes', quizId);
        const unsubscribeQuiz = onSnapshot(quizRef, (docSnap) => {
            if (docSnap.exists()) {
                setQuiz({ id: docSnap.id, ...docSnap.data() });
            } else {
                alert("Quiz not found!");
                navigate('/');
            }
            setDataLoading(false);
        });
        
        return () => unsubscribeQuiz();
    }, [quizId, navigate]);

    // Effect 2: Track my personal participant data
    useEffect(() => {
        if (!user || !quizId) return;
        const myParticipantRef = doc(db, 'quizzes', quizId, 'participants', user.uid);
        const unsubscribe = onSnapshot(myParticipantRef, (docSnap) => {
            if (docSnap.exists()) {
                setMyParticipantData({ id: docSnap.id, ...docSnap.data() });
            }
        });
        return () => unsubscribe();
    }, [user, quizId]);


    // Effect 3: Check for my answer to the current question
    useEffect(() => {
        if (user && quiz && quiz.currentQuestionId) {
            hasSubmittedRef.current = false;
            setSelectedOption(null);
            setDescriptiveAnswer('');
            const answerRef = doc(db, 'quizzes', quizId, 'answers', quiz.currentQuestionId, 'submissions', user.uid);
            const unsubscribe = onSnapshot(answerRef, (docSnap) => {
                setMyAnswer(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
                if (docSnap.exists()) {
                    hasSubmittedRef.current = true;
                }
            });
            return () => unsubscribe();
        } else {
            setMyAnswer(null);
        }
    }, [user, quiz, quizId]);

    const handleSubmitAnswer = useCallback(async (isPenalty = false) => {
        if (!user || !quiz || !quiz.currentQuestionId || hasSubmittedRef.current) return;
        
        const currentQuestion = quiz.questions.find(q => q.id === quiz.currentQuestionId);
        if (!currentQuestion) return;

        let answerPayload = {
            answer: isPenalty ? 'Switched tabs' : '',
            verified: false,
            correct: null,
            submittedAt: new Date(),
            questionId: quiz.currentQuestionId,
        };
        let isCorrect = null;

        if (!isPenalty) {
             if (currentQuestion.type === 'mcq') {
                if (selectedOption === null) return;
                answerPayload.answer = currentQuestion.options[selectedOption];
                isCorrect = String(selectedOption) === currentQuestion.correctAnswer;
            } else {
                if (!descriptiveAnswer.trim()) return;
                answerPayload.answer = descriptiveAnswer;
            }
        } else {
            isCorrect = false;
        }

        hasSubmittedRef.current = true;
        
        const answerRef = doc(db, 'quizzes', quizId, 'answers', quiz.currentQuestionId, 'submissions', user.uid);
        const participantRef = doc(db, 'quizzes', quizId, 'participants', user.uid);
        
        const batch = writeBatch(db);
        
        if (isCorrect !== null) {
            const points = isCorrect ? (currentQuestion.points || 0) : -(currentQuestion.negativePoints || 0);
            answerPayload.verified = true;
            answerPayload.correct = isCorrect;
            answerPayload.awardedPoints = points;
            if (points !== 0) {
                batch.update(participantRef, { score: increment(points) });
            }
        }
        
        batch.set(answerRef, answerPayload);
        await batch.commit();

    }, [user, quiz, selectedOption, descriptiveAnswer, quizId]);
    
    // Effect 4: Anti-Cheat & Auto-Submit
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && quiz?.state === 'question_live' && !hasSubmittedRef.current) {
                handleSubmitAnswer(true);
            }
        };
        
        if(quiz?.state === 'question_ended' && !hasSubmittedRef.current) {
            handleSubmitAnswer(false);
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [quiz, handleSubmitAnswer]);


    const renderContent = () => {
        if (!quiz || !myParticipantData) return <Loader2 className="animate-spin" />;

        const currentQuestion = quiz.questions?.find(q => q.id === quiz.currentQuestionId);

        if (myAnswer) {
            const answeredQuestion = quiz.questions?.find(q => q.id === myAnswer.questionId);
            
            let submittedAnswerClass = 'bg-light';
            if (myAnswer.verified) {
                submittedAnswerClass = myAnswer.correct ? 'bg-success-light' : 'bg-danger-light';
            }

            return (
                <div className="text-center">
                    <h4 className="font-weight-bold">Answer Submitted!</h4>
                    
                    <div className={`mt-3 p-3 ${submittedAnswerClass} border rounded text-left`}>
                        <p className="mb-1 text-muted"><small>Your Answer:</small></p>
                        <p className={`mb-0 font-weight-bold multilang-text ${getLangClass(myAnswer.answer)}`}>
                            {myAnswer.answer}
                        </p>
                    </div>

                    {!myAnswer.verified && (
                        <p className="text-muted mt-3">Waiting for the Quiz Master...</p>
                    )}

                    {myAnswer.verified && (
                        <div className="mt-3">
                             {answeredQuestion && <p className="mb-0">You earned {myAnswer.awardedPoints ?? (myAnswer.correct ? answeredQuestion.points : 0)} points.</p>}
                        </div>
                    )}
                </div>
            );
        }

        if (quiz.state === 'question_live' && currentQuestion) {
            return (
                <div className="anti-copy">
                    <h3 className={`mb-4 font-weight-bold text-center multilang-text ${getLangClass(currentQuestion.text)}`}>{currentQuestion.text}</h3>
                    {currentQuestion.type === 'mcq' ? (
                        <div className="list-group">
                            {currentQuestion.options.map((opt, i) => (
                                <button key={i} className={`list-group-item list-group-item-action multilang-text ${getLangClass(opt)} ${selectedOption === i ? 'active' : ''}`} onClick={() => setSelectedOption(i)}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <textarea 
                            className={`form-control multilang-text ${getLangClass(descriptiveAnswer)}`}
                            rows="4"
                            placeholder="Type your answer here..."
                            value={descriptiveAnswer}
                            onChange={(e) => setDescriptiveAnswer(e.target.value)}
                        />
                    )}
                    <button className="btn btn-primary btn-block animated-button mt-4" onClick={() => handleSubmitAnswer(false)}>
                        Submit Answer
                    </button>
                </div>
            );
        }

        return <div className="text-center"><h4 className="font-weight-bold">Waiting for the next question...</h4></div>;
    };


    if (dataLoading || !user) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="text-light d-flex align-items-center">
                    <Loader2 className="animate-spin mr-3" /> Loading Quiz...
                </div>
            </div>
        );
    }
    
    return (
        <div className="animated-card text-dark p-4 p-md-5 mx-auto" style={{width: '90%', maxWidth: '800px'}}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={`font-weight-bold mb-0 multilang-text ${getLangClass(myParticipantData?.name)}`}>{myParticipantData?.name || 'Participant'}'s Quiz</h4>
                <div className="text-right">
                    <h4 className="font-weight-bold text-primary mb-0">{myParticipantData?.score || 0} pts</h4>
                    <small className="text-muted">Your Score</small>
                </div>
            </div>
            <div className="card-body bg-light rounded p-4">
                {renderContent()}
            </div>
            <div className="text-center mt-4">
                 <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/score/${quizId}`)}>
                    <BarChart2 size={16} className="mr-2"/> View Live Scoreboard
                </button>
            </div>
        </div>
    );
}

