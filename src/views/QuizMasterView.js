import React, 'useState', 'useEffect' from 'react';
import { useParams } from 'react-router-dom';
import { onSnapshot, doc, collection, updateDoc, writeBatch, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BarChart2, CheckCircle, XCircle, PlusCircle, Send, Users, HelpCircle, Trash2, Loader2 } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { Navbar } from '../components/Navbar';
import { MasterNav } from '../components/MasterNav';

// --- Reusable Components within QuizMasterView ---

const QuestionsTab = ({ questions = [], handleAddQuestion, newQuestion, setNewQuestion }) => {
    const initialQuestionState = { type: 'mcq', text: '', options: ['', '', '', ''], correctAnswer: '', points: 10 };
    return (
        <>
            <div className="card shadow-sm mb-4 border-0">
                <div className="card-header bg-white h5"><PlusCircle className="mr-2 text-primary"/>Add a New Question</div>
                <div className="card-body">
                    <div className="form-group">
                        <label>Question Type</label>
                        <select className="form-control" value={newQuestion.type} onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}>
                            <option value="mcq">Multiple Choice</option>
                            <option value="descriptive">Descriptive</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Question Text</label>
                        <input type="text" placeholder="What is...?" value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} className="form-control" />
                    </div>
                    {newQuestion.type === 'mcq' && (
                        <>
                            <label>Options</label>
                            {newQuestion.options.map((opt, i) => (
                                <div className="form-group" key={i}><input type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const newOpts = [...newQuestion.options]; newOpts[i] = e.target.value; setNewQuestion({...newQuestion, options: newOpts}); }} className="form-control" /></div>
                            ))}
                            <div className="form-group">
                                <label>Correct Answer</label>
                                <select className="form-control" value={newQuestion.correctAnswer} onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}>
                                    <option value="">Select Correct Answer</option>
                                    {newQuestion.options.filter(opt => opt).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                    <div className="form-group">
                        <label>Points</label>
                        <input type="number" value={newQuestion.points} onChange={e => setNewQuestion({...newQuestion, points: parseInt(e.target.value) || 10})} className="form-control" />
                    </div>
                    <button onClick={() => { handleAddQuestion(); setNewQuestion(initialQuestionState); }} className="btn btn-success">Add Question to Bank</button>
                </div>
            </div>
            <div className="card shadow-sm mb-4 border-0">
                <div className="card-header bg-white h5">Question Bank ({questions.length})</div>
                <ul className="list-group list-group-flush">{questions.map(q => (<li key={q.id} className="list-group-item"><p className="mb-0">{q.text}</p><small className="text-muted text-uppercase">{q.type} - {q.points} pts</small></li>))}</ul>
            </div>
        </>
    );
};

const StartQuizTab = ({ questions = [], airedQuestionIds = [], handleAirQuestion }) => (
    <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white h5">Select a Question to Air</div>
        <ul className="list-group list-group-flush">
            {questions.length === 0 && <li className="list-group-item text-muted">Add questions in the 'Questions' tab first.</li>}
            {questions.map(q => (
                <li key={q.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div><p className="mb-0">{q.text}</p><small className="text-muted text-uppercase">{q.type}</small></div>
                    {airedQuestionIds.includes(q.id) ? (<span className="badge badge-light">Aired</span>) : (<button onClick={() => handleAirQuestion(q.id)} className="btn btn-sm btn-primary d-flex align-items-center"><Send className="mr-1" size={14}/>Air</button>)}
                </li>
            ))}
        </ul>
    </div>
);

const ParticipantsTab = ({ participants, handleDeleteParticipant, handleSelectParticipant }) => (
    <div className="card shadow-sm border-0">
        <div className="card-header bg-white h5">Participants ({participants.length})</div>
        <ul className="list-group list-group-flush">
            {participants.length === 0 && <li className="list-group-item text-muted">No participants have joined yet.</li>}
            {participants.map(p => (
                <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <button className="btn btn-link p-0" onClick={() => handleSelectParticipant(p)}>{p.name}</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteParticipant(p.id, p.name)}><Trash2 size={16} /></button>
                </li>
            ))}
        </ul>
    </div>
);

// --- NEW: Modal to show a participant's detailed answers ---
const ParticipantDetailModal = ({ participant, answers, isLoading, onClose }) => {
    if (!participant) return null;

    return (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{participant.name}'s Answers</h5>
                        <button type="button" className="close" onClick={onClose}>
                            <span>&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        {isLoading ? <div className="text-center"><Loader2 className="animate-spin" /></div> : (
                            <ul className="list-group">
                                {answers.length === 0 && <li className="list-group-item">This participant hasn't answered any questions yet.</li>}
                                {answers.map((ans, index) => (
                                    <li key={index} className="list-group-item">
                                        <p className="font-weight-bold mb-1">{ans.questionText}</p>
                                        <p className="mb-2" style={{whiteSpace: 'pre-wrap'}}>Answer: <span className="text-muted">{ans.submittedAnswer}</span></p>
                                        <div>
                                            {ans.isCorrect === true && <span className="badge badge-success">Correct (+{ans.points} pts)</span>}
                                            {ans.isCorrect === false && <span className="badge badge-danger">Incorrect</span>}
                                            {ans.isCorrect === null && ans.submittedAnswer !== "No answer" && <span className="badge badge-warning">Pending Verification</span>}
                                            {ans.submittedAnswer === "No answer" && <span className="badge badge-secondary">Not Answered</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main QuizMasterView Component ---

export function QuizMasterView() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ type: 'mcq', text: '', options: ['', '', '', ''], correctAnswer: '', points: 10 });
    const [activeTab, setActiveTab] = useState('start');
    const [airedQuestionIds, setAiredQuestionIds] = useState([]);
    
    // State for the new participant detail modal
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [participantAnswers, setParticipantAnswers] = useState([]);
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);

    useEffect(() => {
        const unsubQuiz = onSnapshot(doc(db, "quizzes", quizId), (doc) => {
            const data = doc.data();
            setQuiz(data);
            if (data && data.questions) {
                const currentAired = data.questions.filter(q => q.id === data.currentQuestionId).map(q => q.id);
                setAiredQuestionIds(prev => [...new Set([...prev, ...currentAired])]);
            }
        });
        const unsubParticipants = onSnapshot(collection(db, `quizzes/${quizId}/participants`), (snap) => {
            const parts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            parts.sort((a, b) => b.score - a.score);
            setParticipants(parts);
        });
        return () => { unsubQuiz(); unsubParticipants(); };
    }, [quizId]);

    useEffect(() => {
        if ((quiz?.state === 'question_live' || quiz?.state === 'question_ended') && quiz?.currentQuestionId) {
            const answersCollectionPath = `quizzes/${quizId}/answers/${quiz.currentQuestionId}/submissions`;
            const unsubAnswers = onSnapshot(collection(db, answersCollectionPath), (snap) => {
                setAnswers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubAnswers();
        } else {
            setAnswers([]);
        }
    }, [quiz?.state, quiz?.currentQuestionId, quizId]);

    // --- NEW: Effect to fetch all answers for a selected participant ---
    useEffect(() => {
        if (!selectedParticipant || !quiz?.questions) {
            setParticipantAnswers([]);
            return;
        }

        const fetchAnswers = async () => {
            setIsLoadingAnswers(true);
            const questionsAnswered = quiz.questions; // Check all questions
            
            const answerPromises = questionsAnswered.map(async (question) => {
                const answerDocRef = doc(db, `quizzes/${quizId}/answers/${question.id}/submissions`, selectedParticipant.id);
                const answerSnap = await getDoc(answerDocRef);
                
                return {
                    questionText: question.text,
                    points: question.points,
                    submittedAnswer: answerSnap.exists() ? answerSnap.data().answer : "No answer",
                    isCorrect: answerSnap.exists() ? answerSnap.data().isCorrect : null,
                };
            });

            const resolvedAnswers = await Promise.all(answerPromises);
            setParticipantAnswers(resolvedAnswers);
            setIsLoadingAnswers(false);
        };

        fetchAnswers();
    }, [selectedParticipant, quiz?.questions, quizId]);

    const handleAddQuestion = async () => { /* ... same as before ... */ };
    const handleAirQuestion = async (questionId) => { /* ... same as before ... */ };
    const handleEndQuestion = async () => { /* ... same as before ... */ };
    const handleFinishVerification = async () => { /* ... same as before ... */ };
    const handleVerification = async (participantId, isCorrect) => { /* ... same as before ... */ };
    const handleDeleteParticipant = async (participantId, participantName) => { /* ... same as before ... */ };
    
    const handleSelectParticipant = (participant) => {
        setSelectedParticipant(participant);
    };

    const currentQuestion = quiz?.questions.find(q => q.id === quiz.currentQuestionId);
    const renderMainContent = () => { /* ... same as before, but pass handleSelectParticipant to ParticipantsTab ... */ };

    return (
        <>
            <Navbar />
            <ParticipantDetailModal 
                participant={selectedParticipant} 
                answers={participantAnswers}
                isLoading={isLoadingAnswers}
                onClose={() => setSelectedParticipant(null)} 
            />
            <div className="container-fluid" style={{ paddingTop: '80px' }}>
                <div className="row">
                    <div className="col-lg-8">
                        {/* ... Header card ... */}
                        <MasterNav activeTab={activeTab} setActiveTab={setActiveTab} quizState={quiz?.state} />
                        {renderMainContent()}
                    </div>
                    <div className="col-lg-4">
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-white h5"><BarChart2 className="mr-2 text-primary"/>Scoreboard</div>
                            <ul className="list-group list-group-flush">
                                {participants.map((p, index) => (
                                    <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        {/* --- FIX: Made scoreboard names clickable --- */}
                                        <button className="btn btn-link p-0 text-left" onClick={() => handleSelectParticipant(p)}>
                                            <span className="font-weight-bold mr-3">{index + 1}.</span>
                                            <span>{p.name}</span>
                                        </button>
                                        <span className="badge badge-primary badge-pill p-2">{p.score} pts</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

        
