import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import {
  onSnapshot,
  doc,
  collection,
  setDoc,
  writeBatch,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { Loader2, BarChart2 } from "lucide-react";

export function ParticipantView() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [myParticipantData, setMyParticipantData] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [descriptiveAnswer, setDescriptiveAnswer] = useState("");
  const hasSubmittedRef = useRef(false);

  // Effect 1: Handle Anonymous Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch(console.error);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Effect 2: Fetch Quiz and Participants Data
  useEffect(() => {
    if (!quizId) return;
    const quizRef = doc(db, "quizzes", quizId);
    const unsubscribeQuiz = onSnapshot(quizRef, (docSnap) => {
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() });
      } else {
        navigate("/");
      }
    });

    const participantsRef = collection(db, "quizzes", quizId, "participants");
    const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
      setParticipants(snapshot.docs.map((p) => ({ id: p.id, ...p.data() })));
    });

    return () => {
      unsubscribeQuiz();
      unsubscribeParticipants();
    };
  }, [quizId, navigate]);

  // Effect 3: Track my personal participant data (for score updates)
  useEffect(() => {
    if (!user || !quizId) return;
    const myParticipantRef = doc(
      db,
      "quizzes",
      quizId,
      "participants",
      user.uid
    );
    const unsubscribe = onSnapshot(myParticipantRef, (docSnap) => {
      if (docSnap.exists()) {
        setMyParticipantData({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsubscribe();
  }, [user, quizId]);

  // Effect 4: Check if I have already answered the current question
  useEffect(() => {
    if (user && quiz && quiz.currentQuestionId) {
      hasSubmittedRef.current = false;
      setSelectedOption(null);
      setDescriptiveAnswer("");
      const answerRef = doc(
        db,
        "quizzes",
        quizId,
        "answers",
        quiz.currentQuestionId,
        "submissions",
        user.uid
      );
      const unsubscribe = onSnapshot(answerRef, (docSnap) => {
        setMyAnswer(
          docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
        );
        if (docSnap.exists()) {
          hasSubmittedRef.current = true;
        }
      });
      return () => unsubscribe();
    } else {
      // If there's no current question, we shouldn't have a "myAnswer" state from a previous question.
      setMyAnswer(null);
    }
  }, [user, quiz, quizId]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!user || !quiz || !quiz.currentQuestionId || hasSubmittedRef.current)
      return;

    const currentQuestion = quiz.questions.find(
      (q) => q.id === quiz.currentQuestionId
    );
    if (!currentQuestion) return;

    let answerPayload = {
      answer: "",
      verified: false,
      correct: null,
      submittedAt: new Date(),
      questionId: quiz.currentQuestionId, // Fix: Store which question this answer is for
    };
    let isCorrect = null;

    if (currentQuestion.type === "mcq") {
      if (selectedOption === null) return;
      answerPayload.answer = currentQuestion.options[selectedOption];
      isCorrect = String(selectedOption) === currentQuestion.correctAnswer;
    } else {
      if (!descriptiveAnswer.trim()) return;
      answerPayload.answer = descriptiveAnswer;
    }

    hasSubmittedRef.current = true;

    const answerRef = doc(
      db,
      "quizzes",
      quizId,
      "answers",
      quiz.currentQuestionId,
      "submissions",
      user.uid
    );
    const participantRef = doc(db, "quizzes", quizId, "participants", user.uid);

    const batch = writeBatch(db);

    if (isCorrect !== null) {
      answerPayload.verified = true;
      answerPayload.correct = isCorrect;
      const points = isCorrect
        ? currentQuestion.points || 0
        : -(currentQuestion.negativePoints || 0);
      if (points !== 0) {
        batch.update(participantRef, { score: increment(points) });
      }
    }

    batch.set(answerRef, answerPayload);
    await batch.commit();
  }, [user, quiz, selectedOption, descriptiveAnswer, quizId]);

  // Effect 5: Anti-Cheat - Auto-submit on tab change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        quiz?.state === "question_live" &&
        !hasSubmittedRef.current
      ) {
        handleSubmitAnswer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quiz, handleSubmitAnswer]);

  const renderContent = () => {
    if (!quiz || !myParticipantData)
      return <Loader2 className='animate-spin' />;

    const currentQuestion = quiz.questions?.find(
      (q) => q.id === quiz.currentQuestionId
    );

    if (myAnswer) {
      // Fix: Find the question that this answer belongs to, not the current live question.
      const answeredQuestion = quiz.questions?.find(
        (q) => q.id === myAnswer.questionId
      );
      return (
        <div className='text-center'>
          <h4 className='font-weight-bold'>Answer Submitted!</h4>
          <p className='text-muted'>Waiting for the Quiz Master...</p>
          {myAnswer.verified && (
            <div
              className={`mt-3 p-3 rounded ${
                myAnswer.correct ? "bg-success-light" : "bg-danger-light"
              }`}
            >
              <h5 className='mb-0'>
                You were {myAnswer.correct ? "Correct" : "Incorrect"}!
              </h5>
              {myAnswer.correct && answeredQuestion && (
                <p className='mb-0'>
                  You earned {answeredQuestion.points} points.
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    if (quiz.state === "question_live" && currentQuestion) {
      return (
        <div className='anti-copy'>
          <h3 className='mb-4 font-weight-bold text-center'>
            {currentQuestion.text}
          </h3>
          {currentQuestion.type === "mcq" ? (
            <div className='list-group'>
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  className={`list-group-item list-group-item-action ${
                    selectedOption === i ? "active" : ""
                  }`}
                  onClick={() => setSelectedOption(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className='form-control'
              rows='4'
              placeholder='Type your answer here...'
              value={descriptiveAnswer}
              onChange={(e) => setDescriptiveAnswer(e.target.value)}
            />
          )}
          <button
            className='btn btn-primary btn-block animated-button mt-4'
            onClick={handleSubmitAnswer}
          >
            Submit Answer
          </button>
        </div>
      );
    }

    return (
      <div className='text-center'>
        <h4 className='font-weight-bold'>Waiting for the next question...</h4>
      </div>
    );
  };

  if (authLoading || !quiz) {
    return (
      <div className='d-flex justify-content-center align-items-center vh-100'>
        <div className='text-light d-flex align-items-center'>
          <Loader2 className='animate-spin mr-3' /> Loading Quiz...
        </div>
      </div>
    );
  }

  return (
    <div
      className='animated-card text-dark p-4 p-md-5 mx-auto'
      style={{ width: "90%", maxWidth: "800px" }}
    >
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h4 className='font-weight-bold mb-0'>
          {myParticipantData?.name || "Participant"}'s Quiz
        </h4>
        <div className='text-right'>
          <h4 className='font-weight-bold text-primary mb-0'>
            {myParticipantData?.score || 0} pts
          </h4>
          <small className='text-muted'>Your Score</small>
        </div>
      </div>
      <div className='card-body bg-light rounded p-4'>{renderContent()}</div>
      <div className='text-center mt-4'>
        <button
          className='btn btn-outline-secondary btn-sm'
          onClick={() => navigate(`/score/${quizId}`)}
        >
          <BarChart2 size={16} className='mr-2' /> View Live Scoreboard
        </button>
      </div>
    </div>
  );
}
