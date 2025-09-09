import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { onSnapshot, doc, collection, updateDoc, writeBatch, deleteDoc, getDocs, getDoc, increment } from 'firebase/firestore';
import { CheckCircle, XCircle, PlusCircle, Send, Trash2, Loader2, Edit, PlayCircle, StopCircle, Users, HelpCircle, Clock } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { MasterNav } from '../components/MasterNav';

// Language detection helper
const getLangClass = (text) => {
    if (!text) return '';
    if (/[\u0600-\u06FF]/.test(text)) return 'lang-ar';
    if (/[\u0D00-\u0D7F]/.test(text)) return 'lang-ml';
    return '';
};

// --- Helper Components ---

const ParticipantDetailsModal = ({ show, participant, quiz, answers, isLoading, onClose }) => {
    if (!show) return null;

    return ReactDOM.createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Answer History for {participant.name}</h5>
                        <button type="button" className="close" onClick={onClose}>
                            <span>&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        {isLoading ? <div className="text-center"><Loader2 className="animate-spin"/></div> : (
                            answers.length > 0 ? (
                                answers.map((ans, index) => (
                                    <div key={index} className={`p-2 rounded mb-2 ${ans.correct === true ? 'bg-success-light' : ans.correct === false ? 'bg-danger-light' : 'bg-light'}`}>
                                        <p className={`mb-1 multilang-text ${getLangClass(ans.questionText)}`}><strong>Q:</strong> {ans.questionText}</p>
                                        <p className={`mb-0 multilang-text ${getLangClass(ans.answer)}`}><strong>A:</strong> {ans.answer}</p>
                                        <small>Points Awarded: {ans.awardedPoints ?? 'N/A'}</small>
                                    </div>
                                ))
                            ) : <p>No answers submitted by this participant yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

const QuestionEditorModal = ({ show, question, onSave, onClose }) => {
    const [editedQuestion, setEditedQuestion] = useState(question);

    useEffect(() => {
        setEditedQuestion(question);
    }, [question]);

    if (!show || !editedQuestion) return null;

    const handleOptionChange = (index, value) => {
        const newOptions = [...editedQuestion.options];
        newOptions[index] = value;
        setEditedQuestion({ ...editedQuestion, options: newOptions });
    };
    
    const handleSave = () => {
        onSave(editedQuestion);
        onClose();
    };

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Question</h5>
                        <button type="button" className="close" onClick={onClose}><span>&times;</span></button>
                    </div>
                    <div className="modal-body">
                         <div className="form-group">
                            <label>Question Text</label>
                            <textarea className={`form-control multilang-text ${getLangClass(editedQuestion.text)}`} rows="3" value={editedQuestion.text} onChange={e => setEditedQuestion({...editedQuestion, text: e.target.value})}></textarea>
                        </div>
                        <div className="form-group">
                             <label>Question Type</label>
                            <select className="form-control" value={editedQuestion.type} onChange={e => setEditedQuestion({...editedQuestion, type: e.target.value})}>
                                <option value="mcq">Multiple Choice</option>
                                <option value="descriptive">Descriptive</option>
                            </select>
                        </div>
                        {editedQuestion.type === 'mcq' && (
                            <div>
                                <label>Options & Correct Answer</label>
                                {editedQuestion.options.map((opt, i) => (
                                    <div className="input-group mb-2" key={i}>
                                        <div className="input-group-prepend">
                                            <div className="input-group-text"><input type="radio" name="correctAnswer" checked={editedQuestion.correctAnswer === String(i)} onChange={() => setEditedQuestion({...editedQuestion, correctAnswer: String(i)})}/></div>
                                        </div>
                                        <input type="text" className={`form-control multilang-text ${getLangClass(opt)}`} placeholder={`Option ${i+1}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="form-group">
                            <label>Correct Answer Text (to display to public)</label>
                            <input type="text" className={`form-control multilang-text ${getLangClass(editedQuestion.answerText)}`} value={editedQuestion.answerText || ''} onChange={e => setEditedQuestion({...editedQuestion, answerText: e.target.value})} />
                        </div>
                        <div className="row">
                            <div className="col">
                                <label>Points for Correct</label>
                                <input type="number" className="form-control" value={editedQuestion.points} onChange={e => setEditedQuestion({...editedQuestion, points: parseInt(e.target.value, 10) || 0})} />
                            </div>
                            <div className="col">
                                <label>Points for Incorrect (Negative)</label>
                                <input type="number" className="form-control" value={editedQuestion.negativePoints || 0} onChange={e => setEditedQuestion({...editedQuestion, negativePoints: parseInt(e.target.value, 10) || 0})} />
                            </div>
                        </div>
                         <div className="form-group mt-3">
                            <label>Timer (in seconds, optional)</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                placeholder="e.g., 30"
                                value={editedQuestion.timer || ''}
                                onChange={e => setEditedQuestion({...editedQuestion, timer: e.target.value ? parseInt(e.target.value, 10) : ''})}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VerificationListItem = ({ answer, participantName, onVerify, onPenalty, onScoreChange, currentScore }) => (
    <div className="list-group-item">
        <div className="d-flex justify-content-between align-items-center">
            <div>
                <p className="mb-1"><strong>{participantName}</strong></p>
                <p className={`mb-0 text-muted multilang-text ${getLangClass(answer.answer)}`}>{answer.answer}</p>
            </div>
            {!answer.verified && (
                 <div className="d-flex align-items-center">
                    <input 
                        type="number" 
                        className="form-control form-control-sm"
                        style={{width: '70px'}}
                        value={currentScore}
                        onChange={e => onScoreChange(answer.id, e.target.value)}
                    />
                    <button className="btn btn-sm btn-outline-success ml-2" title="Mark as Correct with this score" onClick={() => onVerify(answer.id)}>
                        <CheckCircle size={16} />
                    </button>
                    <button className="btn btn-sm btn-outline-danger ml-2" title="Mark as Incorrect" onClick={() => onPenalty(answer.id)}>
                        <XCircle size={16} />
                    </button>
                </div>
            )}
        </div>
    </div>
);

const QuestionsTab = ({ quiz, handleAddQuestion, newQuestion, setNewQuestion, handleDeleteQuestion, setEditingQuestion }) => {
    const handleOptionChange = (index, value) => {
        const newOptions = [...newQuestion.options];
        newOptions[index] = value;
        setNewQuestion({ ...newQuestion, options: newOptions });
    };

    return (
        <div className="row">
            <div className="col-lg-4 mb-4 mb-lg-0">
                <h4 className="mb-3">Add a New Question</h4>
                <div className="form-group">
                    <textarea 
                        className={`form-control multilang-text ${getLangClass(newQuestion.text)}`}
                        rows="3" 
                        placeholder="Question text"
                        value={newQuestion.text}
                        onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                    ></textarea>
                </div>
                <div className="form-group">
                    <select 
                        className="form-control" 
                        value={newQuestion.type}
                        onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}
                    >
                        <option value="descriptive">Descriptive</option>
                        <option value="mcq">Multiple Choice</option>
                    </select>
                </div>
                {newQuestion.type === 'mcq' && (
                    <div>
                        {newQuestion.options.map((opt, i) => (
                            <div className="input-group mb-2" key={i}>
                                <div className="input-group-prepend">
                                    <div className="input-group-text">
                                        <input type="radio" name="correctAnswer" checked={newQuestion.correctAnswer === String(i)} onChange={() => setNewQuestion({...newQuestion, correctAnswer: String(i)})}/>
                                    </div>
                                </div>
                                <input type="text" className={`form-control multilang-text ${getLangClass(opt)}`} placeholder={`Option ${i+1}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} />
                            </div>
                        ))}
                    </div>
                )}
                <div className="form-group">
                    <label>Correct Answer Text (for public display)</label>
                    <input type="text" className={`form-control multilang-text ${getLangClass(newQuestion.answerText)}`} value={newQuestion.answerText} onChange={e => setNewQuestion({...newQuestion, answerText: e.target.value})} />
                </div>
                 <div className="row">
                    <div className="col">
                        <label>Points for Correct</label>
                        <input type="number" className="form-control" value={newQuestion.points} onChange={e => setNewQuestion({...newQuestion, points: parseInt(e.target.value, 10) || 0})} />
                    </div>
                    <div className="col">
                        <label>Points for Incorrect</label>
                        <input type="number" className="form-control" value={newQuestion.negativePoints} onChange={e => setNewQuestion({...newQuestion, negativePoints: parseInt(e.target.value, 10) || 0})} />
                    </div>
                </div>
                 <div className="form-group mt-3">
                    <label>Timer (in seconds, optional)</label>
                    <input 
                        type="number" 
                        className="form-control" 
                        placeholder="e.g., 30"
                        value={newQuestion.timer || ''}
                        onChange={e => setNewQuestion({...newQuestion, timer: e.target.value ? parseInt(e.target.value, 10) : ''})}
                    />
                </div>
                <button className="btn btn-primary btn-block animated-button mt-3" onClick={handleAddQuestion}><PlusCircle size={16} className="mr-2"/> Add Question</button>
            </div>
            <div className="col-lg-8">
                <h4 className="mb-3">Question Bank ({quiz.questions?.length || 0})</h4>
                <div className="list-group">
                    {quiz.questions?.map(q => (
                        <div key={q.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <span className={`text-truncate mr-3 multilang-text ${getLangClass(q.text)}`}>{q.text}</span>
                                {q.timer && <small className="text-muted d-block"><Clock size={12} className="mr-1"/>{q.timer}s</small>}
                            </div>
                            <div>
                                <button className="btn btn-sm btn-outline-info mr-2" onClick={() => setEditingQuestion(q)}><Edit size={16}/></button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteQuestion(q.id)}><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StartQuizTab = ({ quiz, handleAirQuestion, airedQuestionIds }) => (
    <div>
        <h4 className="mb-3">Air a Question</h4>
        <p className="text-muted">Select a question from the bank to send it to the participants' screens. Aired questions will be disabled.</p>
        <div className="list-group">
            {quiz.questions?.length > 0 ? quiz.questions?.map(q => (
                <div key={q.id} className={`list-group-item d-flex justify-content-between align-items-center ${airedQuestionIds.includes(q.id) ? 'disabled-question' : ''}`}>
                    <div>
                        <span className={`text-truncate mr-3 multilang-text ${getLangClass(q.text)}`}>{q.text}</span>
                        {q.timer && <small className="text-muted d-block"><Clock size={12} className="mr-1"/>{q.timer}s</small>}
                    </div>
                    <button 
                        className="btn btn-sm btn-success" 
                        onClick={() => handleAirQuestion(q.id)}
                        disabled={airedQuestionIds.includes(q.id)}
                    >
                        <Send size={16} className="mr-2"/> Air
                    </button>
                </div>
            )) : <p className="text-muted">No questions in the bank. Add some in the 'Questions' tab.</p>}
        </div>
    </div>
);

const ParticipantsTab = ({ participants, handleSelectParticipant, handleDeleteParticipant }) => (
    <div>
        <h4 className="mb-3">Participants ({participants.length})</h4>
        <div className="list-group">
            {participants.map(p => (
                <div key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <a href="#" className={`text-primary multilang-text ${getLangClass(p.name)}`} onClick={(e) => { e.preventDefault(); handleSelectParticipant(p); }}>
                        {p.name}
                    </a>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteParticipant(p.id)}><Trash2 size={16}/></button>
                </div>
            ))}
        </div>
    </div>
);

const ScoreboardTab = ({ participants, handleSelectParticipant }) => (
    <div>
        <h4 className="mb-3">Scoreboard</h4>
        <div className="list-group">
            {[...participants].sort((a, b) => b.score - a.score).map((p, index) => (
                <div key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <a href="#" className={`text-primary multilang-text ${getLangClass(p.name)}`} onClick={(e) => { e.preventDefault(); handleSelectParticipant(p); }}>
                        {index + 1}. {p.name}
                    </a>
                    <span className="badge badge-primary badge-pill">{p.score} pts</span>
                </div>
            ))}
        </div>
    </div>
);


export function QuizMasterView({ user }) {
    const { quizId } = useParams();
    const navigate = useNavigate();
    
    const [quiz, setQuiz] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [participants, setParticipants] = useState([]);
    const [answers, setAnswers] = useState({});
    const [newQuestion, setNewQuestion] = useState({ text: '', type: 'descriptive', options: ['', '', '', ''], correctAnswer: '0', answerText: '', points: 5, negativePoints: 0, timer: '' });
    const [activeTab, setActiveTab] = useState('questions');
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [participantAnswers, setParticipantAnswers] = useState([]);
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [airedQuestionIds, setAiredQuestionIds] = useState([]);
    const [verificationScores, setVerificationScores] = useState({});

    useEffect(() => {
        if (!user) return;
        
        const quizRef = doc(db, 'quizzes', quizId);
        const unsubscribeQuiz = onSnapshot(quizRef, (docSnap) => {
            if (docSnap.exists()) {
                const quizData = { id: docSnap.id, ...docSnap.data() };
                if (quizData.masterId !== user.uid) {
                    alert("Not authorized."); navigate('/admin'); return;
                }
                setQuiz(quizData);
                if (quizData.airedQuestionIds) {
                    setAiredQuestionIds(quizData.airedQuestionIds);
                }
                setDataLoading(false);
            } else {
                alert("Quiz not found!"); navigate('/admin');
            }
        });

        const participantsRef = collection(db, 'quizzes', quizId, 'participants');
        const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
            setParticipants(snapshot.docs.map(p => ({ id: p.id, ...p.data() })));
        });

        return () => { unsubscribeQuiz(); unsubscribeParticipants(); };
    }, [user, quizId, navigate]);
    
    useEffect(() => {
        if (!quiz || !quiz.currentQuestionId) { setAnswers({}); return; };

        const answersRef = collection(db, 'quizzes', quizId, 'answers', quiz.currentQuestionId, 'submissions');
        const unsubscribeAnswers = onSnapshot(answersRef, (snapshot) => {
            const newAnswers = {};
            const newScores = {};
            const currentQuestion = quiz.questions.find(q => q.id === quiz.currentQuestionId);
            snapshot.forEach(doc => {
                const answerData = {id: doc.id, ...doc.data()};
                newAnswers[doc.id] = answerData;
                if (!answerData.verified && currentQuestion) {
                    newScores[doc.id] = currentQuestion.points;
                }
            });
            setAnswers(newAnswers);
            setVerificationScores(prev => ({...prev, ...newScores}));
        });
        return () => unsubscribeAnswers();
    }, [quiz, quizId]);

    const handleAddQuestion = async () => {
        if (!newQuestion.text.trim()) return;
        const questionId = Math.random().toString(36).substring(2, 12);
        const updatedQuestions = [...(quiz.questions || []), { ...newQuestion, id: questionId }];
        await updateDoc(doc(db, "quizzes", quizId), { questions: updatedQuestions });
        setNewQuestion({ text: '', type: 'descriptive', options: ['', '', '', ''], correctAnswer: '0', answerText: '', points: 5, negativePoints: 0, timer: '' });
    };

    const handleUpdateQuestion = async (updatedQuestion) => {
        const updatedQuestions = quiz.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q);
        await updateDoc(doc(db, "quizzes", quizId), { questions: updatedQuestions });
    };

    const handleDeleteQuestion = async (questionId) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            const updatedQuestions = quiz.questions.filter(q => q.id !== questionId);
            await updateDoc(doc(db, "quizzes", quizId), { questions: updatedQuestions });
        }
    };

    const handleStartQuiz = async () => {
        await updateDoc(doc(db, "quizzes", quizId), { state: 'running' });
        setActiveTab('startQuiz');
    };
    
    const handleEndQuiz = async () => {
        await updateDoc(doc(db, "quizzes", quizId), { state: 'finished' });
    };

    const handleAirQuestion = async (questionId) => {
        const newAiredIds = [...airedQuestionIds, questionId];
        setAiredQuestionIds(newAiredIds);
        const questionToAir = quiz.questions.find(q => q.id === questionId);
        const airTime = (questionToAir.timer && questionToAir.timer > 0) ? new Date() : null;
        await updateDoc(doc(db, "quizzes", quizId), { 
            state: 'question_live', 
            currentQuestionId: questionId,
            airedQuestionIds: newAiredIds,
            airTime: airTime
        });
    };

    const handleRevealAnswer = async () => {
        await updateDoc(doc(db, "quizzes", quizId), { state: 'question_ended' });
    };

    const handleShowScoreboard = async () => {
        await updateDoc(doc(db, "quizzes", quizId), { state: 'scorecard_display' });
    };
    
    const handleNextQuestion = async () => {
        await updateDoc(doc(db, "quizzes", quizId), { state: 'running', currentQuestionId: null });
        setActiveTab('startQuiz');
    };

    const handleVerificationScoreChange = (participantId, score) => {
        setVerificationScores(prev => ({...prev, [participantId]: parseInt(score, 10)}));
    };

    const handleManualVerification = async (participantId) => {
        const points = verificationScores[participantId];
        if (points === undefined || isNaN(points)) return;

        const answerRef = doc(db, 'quizzes', quizId, 'answers', quiz.currentQuestionId, 'submissions', participantId);
        const participantRef = doc(db, 'quizzes', quizId, 'participants', participantId);
        
        const batch = writeBatch(db);
        batch.update(answerRef, { verified: true, correct: points > 0, awardedPoints: points });
        if(points !== 0) batch.update(participantRef, { score: increment(points) });
        await batch.commit();
    };
    
    const handlePenaltyVerification = async (participantId) => {
        if (!quiz || !quiz.currentQuestionId) return;
        const currentQuestion = quiz.questions.find(q => q.id === quiz.currentQuestionId);
        if (!currentQuestion) return;

        const points = -(currentQuestion.negativePoints || 0);

        const answerRef = doc(db, 'quizzes', quizId, 'answers', quiz.currentQuestionId, 'submissions', participantId);
        const participantRef = doc(db, 'quizzes', quizId, 'participants', participantId);

        const batch = writeBatch(db);
        batch.update(answerRef, { verified: true, correct: false, awardedPoints: points });
        if (points !== 0) {
            batch.update(participantRef, { score: increment(points) });
        }
        await batch.commit();
    };

    const handleSelectParticipant = async (participant) => {
        setSelectedParticipant(participant);
        setIsLoadingAnswers(true);
        const userAnswers = [];
        if (quiz?.questions) {
            for (const question of quiz.questions) {
                const answerRef = doc(db, 'quizzes', quizId, 'answers', question.id, 'submissions', participant.id);
                const answerSnap = await getDoc(answerRef);
                if (answerSnap.exists()) {
                    userAnswers.push({
                        questionText: question.text,
                        ...answerSnap.data()
                    });
                }
            }
        }
        setParticipantAnswers(userAnswers);
        setIsLoadingAnswers(false);
    };

    const handleDeleteParticipant = async (participantId) => {
        if (window.confirm("Are you sure you want to remove this participant?")) {
            await deleteDoc(doc(db, 'quizzes', quizId, 'participants', participantId));
        }
    };

    const renderMainContent = () => {
        const currentQuestion = quiz?.questions.find(q => q.id === quiz.currentQuestionId);
        
        if (quiz.state !== 'lobby' && quiz.state !== 'finished' && quiz.state !== 'running' && currentQuestion) {
            const participantResponses = Object.values(answers);
            const allVerified = participantResponses.every(a => a.verified);

            return (
                 <div className="live-question-indicator p-4 rounded">
                    <h3 className={`mb-3 multilang-text ${getLangClass(currentQuestion.text)}`}>Live Question: <span className="text-primary">{currentQuestion.text}</span></h3>
                    <p>{participantResponses.length} of {participants.length} responded.</p>
                    
                    {quiz.state === 'question_live' && <button className="btn btn-warning" onClick={handleRevealAnswer}>Reveal Answer</button>}
                    {quiz.state === 'question_ended' && (
                        <div>
                            <h4 className="mt-4">Verify Answers</h4>
                            <div className="list-group mb-3">
                                {participantResponses.length > 0 ? participantResponses.map(ans => {
                                     const p = participants.find(part => part.id === ans.id);
                                     return p && <VerificationListItem 
                                        key={ans.id} 
                                        answer={ans} 
                                        participantName={p.name}
                                        onVerify={handleManualVerification}
                                        onPenalty={handlePenaltyVerification}
                                        question={currentQuestion}
                                        currentScore={verificationScores[ans.id] ?? currentQuestion.points}
                                        onScoreChange={handleVerificationScoreChange}
                                    />
                                }) : <p className="text-muted">No responses to verify.</p>}
                            </div>
                            <button 
                                className="btn btn-info" 
                                onClick={handleShowScoreboard}
                                disabled={!allVerified && participantResponses.length > 0}
                            >
                                Show Scoreboard
                            </button>
                            {!allVerified && participantResponses.length > 0 && <small className="d-block text-muted mt-2">You must verify all answers before proceeding.</small>}
                        </div>
                    )}
                    {quiz.state === 'scorecard_display' && <button className="btn btn-primary" onClick={handleNextQuestion}>Next Question</button>}
                </div>
            );
        }

        switch (activeTab) {
            case 'questions': return <QuestionsTab quiz={quiz} handleAddQuestion={handleAddQuestion} newQuestion={newQuestion} setNewQuestion={setNewQuestion} handleDeleteQuestion={handleDeleteQuestion} setEditingQuestion={setEditingQuestion} />;
            case 'startQuiz': return <StartQuizTab quiz={quiz} handleAirQuestion={handleAirQuestion} airedQuestionIds={airedQuestionIds} />;
            case 'participants': return <ParticipantsTab participants={participants} handleSelectParticipant={handleSelectParticipant} handleDeleteParticipant={handleDeleteParticipant} />;
            case 'scoreboard': return <ScoreboardTab participants={participants} handleSelectParticipant={handleSelectParticipant} />;
            default: return null;
        }
    };
    
    if (dataLoading || !user) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="text-light d-flex align-items-center"><Loader2 className="animate-spin mr-3" /> Loading Quiz...</div></div>;
    }
    
    return (
        <>
            <div className="animated-card text-dark p-3 p-md-4 mx-auto" style={{width: '90%', maxWidth: '1200px'}}>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                    <div>
                        <h2 className="mb-1 text-primary font-weight-bold">{quiz?.title || 'Quiz'}</h2>
                        {quiz.state === 'lobby' && <button className="btn btn-success btn-sm mr-2" onClick={handleStartQuiz}><PlayCircle size={16} className="mr-2" /> Start Quiz</button>}
                        {quiz.state !== 'lobby' && quiz.state !== 'finished' && <button className="btn btn-danger btn-sm" onClick={handleEndQuiz}><StopCircle size={16} className="mr-2" /> End Quiz</button>}
                    </div>
                    <div>
                        <span className="badge badge-secondary mr-2">Quiz ID: {quizId}</span>
                        <CopyButton text={quizId} />
                    </div>
                </div>
                
                <MasterNav activeTab={activeTab} setActiveTab={setActiveTab} quiz={quiz} />
                <div className="tab-content p-3 border-top">{renderMainContent()}</div>
            </div>

            <QuestionEditorModal show={!!editingQuestion} question={editingQuestion} onClose={() => setEditingQuestion(null)} onSave={handleUpdateQuestion} />
            
            <ParticipantDetailsModal
                show={!!selectedParticipant}
                participant={selectedParticipant}
                quiz={quiz}
                answers={participantAnswers}
                isLoading={isLoadingAnswers}
                onClose={() => setSelectedParticipant(null)}
            />
        </>
    );
}

