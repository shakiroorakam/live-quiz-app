import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export function JoinQuizView() {
  const [userName, setUserName] = useState("");
  const [quizIdToJoin, setQuizIdToJoin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleConnect = () => {
    setAuthLoading(true);
    signInAnonymously(auth).catch((err) => {
      setError(
        "Failed to connect to the server. Please check your connection and try again."
      );
      console.error(err);
      setAuthLoading(false);
    });
  };

  const handleJoinQuiz = async () => {
    if (!userName.trim() || !quizIdToJoin.trim() || !user) {
      setError("Please enter your name and a valid Quiz ID.");
      return;
    }
    setLoading(true);
    setError("");

    const quizRef = doc(db, "quizzes", quizIdToJoin);
    try {
      const quizSnap = await getDoc(quizRef);
      if (quizSnap.exists()) {
        const participantRef = doc(
          db,
          "quizzes",
          quizIdToJoin,
          "participants",
          user.uid
        );
        await setDoc(participantRef, {
          name: userName,
          score: 0,
        });
        // This is the corrected line
        navigate(`/quiz/${quizIdToJoin}`);
      } else {
        setError("Quiz not found! Please check the ID and try again.");
      }
    } catch (err) {
      setError("Could not join the quiz. Please try again later.");
      console.error(err);
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className='animated-card text-center' style={{ maxWidth: "500px" }}>
        <div className='text-light d-flex align-items-center justify-content-center'>
          <Loader2 className='animate-spin mr-3' />
          <span>Connecting...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='animated-card text-center' style={{ maxWidth: "500px" }}>
        <h2 className='text-light mb-4'>Connection Required</h2>
        <p className='text-light mb-4'>
          Please connect to the server to join a quiz.
        </p>
        <button
          className='btn btn-success btn-lg animated-button'
          onClick={handleConnect}
        >
          Connect to Server
        </button>
        {error && <p className='text-danger mt-3'>{error}</p>}
      </div>
    );
  }

  return (
    <div className='animated-card text-center' style={{ maxWidth: "500px" }}>
      <h1 className='display-4 font-weight-bold mb-3 text-primary'>
        Join a Quiz
      </h1>
      <div className='form-group text-left'>
        <label className='text-light'>Your Name</label>
        <input
          type='text'
          className='form-control form-control-lg'
          placeholder='Enter your name'
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div className='form-group text-left'>
        <label className='text-light'>Quiz ID</label>
        <input
          type='text'
          className='form-control form-control-lg'
          placeholder='Enter Quiz ID'
          value={quizIdToJoin}
          onChange={(e) => setQuizIdToJoin(e.target.value)}
        />
      </div>
      {error && <p className='text-danger'>{error}</p>}
      <button
        className='btn btn-success btn-lg btn-block animated-button mt-4'
        onClick={handleJoinQuiz}
        disabled={loading}
      >
        {loading ? <Loader2 className='animate-spin' /> : "Join Quiz"}
      </button>
    </div>
  );
}
