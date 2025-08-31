import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/config';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { Loader2, LogOut, PlusCircle, Trash2, Edit } from 'lucide-react';
​// Helper function to delete a document and all its subcollections
async function deleteDocumentAndSubcollections(docRef) {
const subcollections = ['participants', 'answers'];
​for (const subcollection of subcollections) {
const subcollectionRef = collection(docRef, subcollection);
const subcollectionSnapshot = await getDocs(subcollectionRef);
const deletePromises = [];
subcollectionSnapshot.forEach((subDoc) => {
deletePromises.push(deleteDoc(subDoc.ref));
});
await Promise.all(deletePromises);
}
await deleteDoc(docRef);
}
​export function AdminLoginView() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [loginError, setLoginError] = useState('');
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [newQuizTitle, setNewQuizTitle] = useState('');
const [userQuizzes, setUserQuizzes] = useState([]);
const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
const [fetchError, setFetchError] = useState('');
​const navigate = useNavigate();
​useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
setUser(currentUser);
setIsLoggedIn(!!currentUser);
setAuthLoading(false);
});
return () => unsubscribe();
}, []);
​useEffect(() => {
if (isLoggedIn && user) {
setIsLoadingQuizzes(true);
setFetchError('');
const q = query(collection(db, "quizzes"), where("masterId", "==", user.uid));
​const unsubscribe = onSnapshot(q, (snapshot) => {
const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
setUserQuizzes(quizzes);
setIsLoadingQuizzes(false);
}, (error) => {
console.error("Firestore query failed: ", error);
// This is the crucial error handling part
setFetchError("Failed to load quizzes. Please ensure the Firestore index is created. See the browser console for more details.");
setIsLoadingQuizzes(false);
});
​return () => unsubscribe();
} else {
setUserQuizzes([]);
}
}, [isLoggedIn, user]);
​const handleLogin = async (e) => {
e.preventDefault();
setLoginError('');
try {
await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
setLoginError('Invalid email or password.');
console.error("Login error:", error);
}
};
​const handleCreateQuiz = async () => {
if (!newQuizTitle.trim() || !user) return;
const quizId = Math.random().toString(36).substring(2, 8).toUpperCase();
try {
await setDoc(doc(db, "quizzes", quizId), {
title: newQuizTitle,
masterId: user.uid,
state: 'lobby',
questions: [],
currentQuestionId: null,
});
setNewQuizTitle('');
navigate(/quiz/${quizId}/master);
} catch (error) {
console.error("Error creating quiz:", error);
alert("Could not create quiz. Please try again.");
}
};
​const handleDeleteQuiz = async (quizId, quizTitle) => {
if (window.confirm(Are you sure you want to permanently delete the quiz "${quizTitle}" and all its data?)) {
try {
const quizRef = doc(db, "quizzes", quizId);
await deleteDocumentAndSubcollections(quizRef);
} catch (error) {
console.error("Error deleting quiz:", error);
alert("Failed to delete quiz.");
}
}
};
​const handleLogout = async () => {
await signOut(auth);
};
​if (authLoading) {
return <div className="text-light"><Loader2 className="animate-spin" /> Authenticating...</div>;
}
​if (isLoggedIn) {
return (
<div className="animated-card text-dark p-4 p-md-5" style={{ minWidth: '50vw' }}>
<div className="d-flex justify-content-between align-items-center mb-4">
<h2 className="mb-0">Quiz Management</h2>
<button className="btn btn-outline-secondary d-flex align-items-center" onClick={handleLogout}>
<LogOut size={16} className="mr-2"/> Logout
</button>
</div>
​<div className="mb-4">
<h4>Create New Quiz</h4>
<div className="input-group">
<input
type="text"
className="form-control"
placeholder="Enter a title for your new quiz"
value={newQuizTitle}
onChange={(e) => setNewQuizTitle(e.target.value)}
/>
<div className="input-group-append">
<button className="btn btn-primary d-flex align-items-center" onClick={handleCreateQuiz}>
<PlusCircle size={16} className="mr-2"/> Create & Go
</button>
</div>
</div>
</div>
​<div>
<h4>Your Quizzes</h4>
{isLoadingQuizzes ? (
<div className="text-center text-muted p-4">
<Loader2 className="animate-spin mr-2" /> Loading quizzes...
</div>
) : fetchError ? (
<div className="alert alert-danger">
<strong>Error:</strong> {fetchError}
</div>
) : userQuizzes.length > 0 ? (
<ul className="list-group">
{userQuizzes.map(quiz => (
<li key={quiz.id} className="list-group-item d-flex justify-content-between align-items-center">
<div>
<h5 className="mb-0">{quiz.title}</h5>
<small className="text-muted">ID: {quiz.id}</small>
</div>
<div>
<button className="btn btn-sm btn-outline-primary mr-2" onClick={() => navigate(/quiz/${quiz.id}/master)}>
<Edit size={16}/>
</button>
<button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}>
<Trash2 size={16}/>
</button>
</div>
</li>
))}
</ul>
) : (
<p className="text-muted">You haven't created any quizzes yet.</p>
)}
</div>
</div>
);
}
​return (
<div className="animated-card text-dark p-4 p-md-5">
<h2 className="text-center mb-4">Admin Login</h2>
<form onSubmit={handleLogin}>
<div className="form-group">
<label>Email</label>
<input
type="email"
className="form-control"
value={email}
onChange={(e) => setEmail(e.target.value)}
placeholder="quizbyshakir@quiz.com"
required
/>
</div>
<div className="form-group">
<label>Password</label>
<input
type="password"
className="form-control"
value={password}
onChange={(e) => setPassword(e.target.value)}
placeholder="shakir@123"
required
/>
</div>
{loginError && <p className="text-danger">{loginError}</p>}
<button type="submit" className="btn btn-primary btn-block animated-button">
Login
</button>
</form>
</div>
);
}
