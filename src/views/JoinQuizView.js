import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export function JoinQuizView({ user }) {
  // Receives user as a prop
  const [userName, setUserName] = useState("");
  const [quizIdToJoin, setQuizIdToJoin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinQuiz = async () => {
    if (!userName.trim() || !quizIdToJoin.trim()) {
      setError("Please enter your name and a valid Quiz ID.");
      return;
    }

    // This is a crucial safety check
    if (!user || !user.uid) {
      setError(
        "Could not connect to the server. Please refresh and try again."
      );
      return;
    }

    setLoading(true);
    setError("");

    const quizRef = doc(db, "quizzes", quizIdToJoin.toUpperCase());
    try {
      const quizSnap = await getDoc(quizRef);
      if (quizSnap.exists()) {
        const participantRef = doc(
          db,
          "quizzes",
          quizIdToJoin.toUpperCase(),
          "participants",
          user.uid
        );
        await setDoc(participantRef, {
          name: userName,
          score: 0,
        });
        navigate(`/quiz/${quizIdToJoin.toUpperCase()}`);
      } else {
        setError("Quiz not found! Please check the ID and try again.");
      }
    } catch (err) {
      setError("Could not join the quiz. Please try again later.");
      console.error(err);
    }
    setLoading(false);
  };

  // If the user object hasn't arrived from App.js yet, show a loading state.
  if (!user) {
    return (
      <div className='animated-card text-center' style={{ maxWidth: "500px" }}>
        <div className='text-light d-flex align-items-center justify-content-center'>
          <Loader2 className='animate-spin mr-3' />
          <span>Connecting to server...</span>
        </div>
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
          // Automatically convert to uppercase for consistency
          style={{ textTransform: "uppercase" }}
        />
      </div>
      {error && <p className='text-danger mt-3'>{error}</p>}
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
