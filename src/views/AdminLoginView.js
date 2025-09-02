import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { Loader2, LogOut, PlusCircle, Trash2, Edit } from "lucide-react";

async function deleteDocumentAndSubcollections(docRef) {
  const collectionsToDelete = ["participants", "answers"];
  for (const coll of collectionsToDelete) {
    const subcollectionRef = collection(docRef, coll);
    const snapshot = await getDocs(subcollectionRef);
    for (const subDoc of snapshot.docs) {
      if (coll === "answers") {
        const submissionsRef = collection(subDoc.ref, "submissions");
        const submissionsSnapshot = await getDocs(submissionsRef);
        for (const submissionDoc of submissionsSnapshot.docs) {
          await deleteDoc(submissionDoc.ref);
        }
      }
      await deleteDoc(subDoc.ref);
    }
  }
  await deleteDoc(docRef);
}

export function AdminLoginView({ user }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [userQuizzes, setUserQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.uid) {
      setIsLoading(true);
      setFetchError("");
      const q = query(
        collection(db, "quizzes"),
        where("masterId", "==", user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setUserQuizzes(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setIsLoading(false);
        },
        (error) => {
          console.error("Firestore query error:", error);
          setFetchError(
            "Failed to load quizzes. Please ensure the Firestore index is created."
          );
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setIsLoading(false);
      setUserQuizzes([]);
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoginError("Invalid email or password.");
    }
  };

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim() || !user) return;
    const quizId = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await setDoc(doc(db, "quizzes", quizId), {
        title: newQuizTitle,
        masterId: user.uid,
        state: "lobby",
        questions: [],
        currentQuestionId: null,
      });
      navigate(`/quiz/${quizId}/master`);
    } catch (error) {
      console.error("Error creating quiz:", error);
      alert("Could not create quiz.");
    }
  };

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete the quiz "${quizTitle}"?`
      )
    ) {
      try {
        await deleteDocumentAndSubcollections(doc(db, "quizzes", quizId));
      } catch (error) {
        console.error("Error deleting quiz:", error);
        alert("Failed to delete quiz.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // This forces a reload and ensures the state is fully cleared
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (user) {
    return (
      <div
        className='animated-card text-dark p-4 p-md-5 mx-auto'
        style={{ width: "90%", maxWidth: "800px" }}
      >
        <div className='d-flex justify-content-between align-items-center mb-4'>
          <h2 className='mb-0 text-primary font-weight-bold'>
            Quiz Management
          </h2>
          <button
            className='btn btn-sm btn-outline-secondary d-flex align-items-center'
            onClick={handleLogout}
          >
            <LogOut size={16} className='mr-2' /> Logout
          </button>
        </div>

        <div className='mb-4'>
          <div className='input-group'>
            <input
              type='text'
              className='form-control'
              placeholder='New Quiz Title'
              value={newQuizTitle}
              onChange={(e) => setNewQuizTitle(e.target.value)}
            />
            <div className='input-group-append'>
              <button
                className='btn btn-success d-flex align-items-center'
                onClick={handleCreateQuiz}
              >
                <PlusCircle size={16} className='mr-2' /> Create
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className='mb-3'>Your Existing Quizzes</h4>
          {isLoading ? (
            <div className='text-center text-muted p-4'>
              <Loader2 className='animate-spin mr-2' /> Loading quizzes...
            </div>
          ) : fetchError ? (
            <div className='alert alert-danger'>
              <strong>Error:</strong> {fetchError}
            </div>
          ) : userQuizzes.length > 0 ? (
            <ul className='list-group list-group-flush'>
              {userQuizzes.map((quiz) => (
                <li
                  key={quiz.id}
                  className='list-group-item d-flex justify-content-between align-items-center px-0'
                >
                  <div>
                    <h5 className='mb-0'>{quiz.title}</h5>
                    <small className='text-muted'>
                      {quiz.questions?.length || 0} questions
                    </small>
                  </div>
                  <div>
                    <button
                      className='btn btn-sm btn-outline-primary mr-2'
                      onClick={() => navigate(`/quiz/${quiz.id}/master`)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className='btn btn-sm btn-outline-danger'
                      onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted'>You haven't created any quizzes yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className='animated-card text-dark p-4 p-md-5 mx-auto'
      style={{ width: "90%", maxWidth: "450px" }}
    >
      <h2 className='text-center mb-4 text-primary font-weight-bold'>
        Admin Login
      </h2>
      <form onSubmit={handleLogin}>
        <div className='form-group'>
          <label>Email</label>
          <input
            type='email'
            className='form-control'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Email'
            required
          />
        </div>
        <div className='form-group'>
          <label>Password</label>
          <input
            type='password'
            className='form-control'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Password'
            required
          />
        </div>
        {loginError && <p className='text-danger text-center'>{loginError}</p>}
        <button
          type='submit'
          className='btn btn-primary btn-block animated-button mt-4'
        >
          Login
        </button>
      </form>
    </div>
  );
}
