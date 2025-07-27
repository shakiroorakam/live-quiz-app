import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    doc, 
    setDoc, 
    deleteDoc, 
    getDocs
} from 'firebase/firestore';

async function deleteDocumentAndSubcollections(docRef) {
    const collections = await getDocs(collection(docRef, 'answers'));
    for (const col of collections.docs) {
        const subColDocs = await getDocs(collection(docRef, 'answers', col.id, 'submissions'));
        for (const subDoc of subColDocs.docs) {
            await deleteDoc(subDoc.ref);
        }
    }
    const participants = await getDocs(collection(docRef, 'participants'));
    for (const p of participants.docs) {
        await deleteDoc(p.ref);
    }
    await deleteDoc(docRef);
}

export function AdminLoginView() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const [userQuizzes, setUserQuizzes] = useState([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isLoggedIn || !user) return;
        const q = query(collection(db, "quizzes"), where("quizMasterId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const quizzes = [];
            querySnapshot.forEach((doc) => {
                quizzes.push({ id: doc.id, ...doc.data() });
            });
            setUserQuizzes(quizzes);
            setIsLoadingQuizzes(false);
        });
        return () => unsubscribe();
    }, [isLoggedIn, user]);

    const handleLogin = () => {
        setLoginError('');
        if (username === 'quizbyshakir' && password === 'shakir@123') {
            if (!user) {
                setLoginError("Authentication not ready. Please try again.");
                return;
            }
            setIsLoggedIn(true);
        } else {
            setLoginError('Invalid username or password.');
        }
    };

    const handleCreateNewQuiz = async () => {
        const newQuizId = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, "quizzes", newQuizId), {
            quizMasterId: user.uid,
            quizMasterName: 'Shakir',
            state: "lobby",
            currentQuestionId: null,
            questions: [],
            createdAt: new Date(),
        });
        navigate(`/master/${newQuizId}`);
    };

    const handleSelectQuiz = (quizId) => {
        navigate(`/master/${quizId}`);
    };

    const handleDeleteQuiz = async (quizIdToDelete) => {
        if (window.confirm(`Are you sure you want to delete quiz ${quizIdToDelete}? This cannot be undone.`)) {
            try {
                const quizDocRef = doc(db, 'quizzes', quizIdToDelete);
                await deleteDocumentAndSubcollections(quizDocRef);
            } catch (error) {
                console.error("Error deleting quiz: ", error);
                alert("Failed to delete quiz.");
            }
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '400px' }}>
                    <div className="card-body p-5">
                        <button onClick={() => navigate('/')} className="btn btn-outline-secondary" style={{ position: 'absolute', top: '15px', left: '15px' }}>
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="card-title text-center text-primary font-weight-bold mb-4">Admin Login</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                            <div className="form-group">
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="form-control form-control-lg" />
                            </div>
                            <div className="form-group">
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="form-control form-control-lg" />
                            </div>
                            {loginError && <p className="text-danger text-center mt-3">{loginError}</p>}
                            <button type="submit" disabled={!user} className="btn btn-primary btn-lg btn-block mt-4">Login</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '600px' }}>
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <h2 className="h4 mb-0 text-primary">Quiz Management</h2>
                    <button onClick={handleCreateNewQuiz} className="btn btn-success d-flex align-items-center">
                        <PlusCircle size={18} className="mr-2" /> Create New Quiz
                    </button>
                </div>
                <div className="card-body">
                    <h3 className="h5 mb-3">Your Existing Quizzes</h3>
                    {isLoadingQuizzes ? <Loader2 className="animate-spin" /> : (
                        <ul className="list-group">
                            {userQuizzes.length === 0 && <li className="list-group-item text-muted">You haven't created any quizzes yet.</li>}
                            {userQuizzes.map(quiz => (
                                <li key={quiz.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="font-weight-bold">{quiz.id}</span>
                                        <small className="d-block text-muted">
                                            {quiz.questions?.length || 0} questions
                                        </small>
                                    </div>
                                    <div>
                                        <button onClick={() => handleSelectQuiz(quiz.id)} className="btn btn-sm btn-outline-primary mr-2">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteQuiz(quiz.id)} className="btn btn-sm btn-outline-danger">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
