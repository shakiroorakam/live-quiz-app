import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
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
        for (const subDoc of subColDocs.docs) { await deleteDoc(subDoc.ref); }
    }
    const participants = await getDocs(collection(docRef, 'participants'));
    for (const p of participants.docs) { await deleteDoc(p.ref); }
    await deleteDoc(docRef);
}

export function AdminLoginView() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const [userQuizzes, setUserQuizzes] = useState([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
    const [newQuizTitle, setNewQuizTitle] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && !currentUser.isAnonymous) {
                setUser(currentUser);
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);
            }
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

    const handleLogin = async () => {
        setLoginError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setIsLoggedIn(true);
        } catch (error) {
            console.error("Firebase Login Error:", error);
            setLoginError('Invalid email or password.');
        }
    };

    const handleCreateNewQuiz = async () => {
        if (!newQuizTitle.trim()) {
            alert("Please enter a title for the quiz.");
            return;
        }
        const newQuizId = Math.random().toString(36).substring(2, 8).toUpperCase();
        await setDoc(doc(db, "quizzes", newQuizId), {
            title: newQuizTitle,
            quizMasterId: user.uid,
            quizMasterName: user.email.split('@')[0],
            state: "lobby",
            currentQuestionId: null,
            questions: [],
            createdAt: new Date(),
        });
        navigate(`/master/${newQuizId}`);
    };

    const handleSelectQuiz = (quizId) => { navigate(`/master/${quizId}`); };
    
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
            <div className="d-flex align-items-center justify-content-center min-vh-100 fade-in">
                <div className="card animated-card" style={{ width: '100%', maxWidth: '400px' }}>
                    <div className="card-body p-5">
                        <button onClick={() => navigate('/')} className="btn btn-light" style={{ position: 'absolute', top: '15px', left: '15px' }}>
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="card-title text-center text-primary font-weight-bold mb-4">Admin Login</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                            <div className="form-group">
                                <label className="text-muted">Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="form-control form-control-lg" />
                            </div>
                            <div className="form-group">
                                <label className="text-muted">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="form-control form-control-lg" />
                            </div>
                            {loginError && <p className="text-danger text-center mt-3">{loginError}</p>}
                            <button type="submit" className="btn btn-primary btn-lg btn-block mt-4 animated-button">Login</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 fade-in">
            <div className="card animated-card" style={{ width: '100%', maxWidth: '600px' }}>
                <div className="card-header bg-transparent border-0 pt-4 px-4">
                    <h2 className="h4 mb-0 text-primary">Quiz Management</h2>
                </div>
                <div className="card-body p-4">
                    <div className="input-group mb-3">
                        <input type="text" className="form-control form-control-lg" placeholder="New Quiz Title" value={newQuizTitle} onChange={(e) => setNewQuizTitle(e.target.value)} />
                        <div className="input-group-append">
                            <button onClick={handleCreateNewQuiz} className="btn btn-success d-flex align-items-center">
                                <PlusCircle size={18} className="mr-2" /> Create
                            </button>
                        </div>
                    </div>
                    <h3 className="h5 mt-4 mb-3 text-muted">Your Existing Quizzes</h3>
                    {isLoadingQuizzes ? <div className="text-center p-4"><Loader2 className="animate-spin text-primary" /></div> : (
                        <ul className="list-group list-group-flush">
                            {userQuizzes.length === 0 && <li className="list-group-item text-muted">You haven't created any quizzes yet.</li>}
                            {userQuizzes.map(quiz => (
                                <li key={quiz.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="font-weight-bold text-dark">{quiz.title || quiz.id}</span>
                                        <small className="d-block text-muted">{quiz.questions?.length || 0} questions</small>
                                    </div>
                                    <div>
                                        <button onClick={() => handleSelectQuiz(quiz.id)} className="btn btn-sm btn-outline-primary mr-2"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteQuiz(quiz.id)} className="btn btn-sm btn-outline-danger"><Trash2 size={16} /></button>
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
