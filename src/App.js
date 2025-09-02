import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";

import { HomeView } from "./views/HomeView";
import { AdminLoginView } from "./views/AdminLoginView";
import { JoinQuizView } from "./views/JoinQuizView";
import { QuizMasterView } from "./views/QuizMasterView";
import { ParticipantView } from "./views/ParticipantView";
import { ScorecardView } from "./views/ScorecardView";
import { Navbar } from "./components/Navbar";
import { Loader2 } from "lucide-react";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className='app-background-dark d-flex vh-100 justify-content-center align-items-center text-light'>
        <Loader2 className='animate-spin mr-3' />
        <span>Initializing...</span>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className='app-background-dark'>
        <Navbar user={user} />
        <div
          className='container d-flex justify-content-center align-items-center'
          style={{ minHeight: "calc(100vh - 56px)", padding: "20px 0" }}
        >
          <Routes>
            <Route path='/' element={<HomeView />} />
            <Route path='/admin' element={<AdminLoginView user={user} />} />
            <Route path='/join' element={<JoinQuizView />} />
            <Route
              path='/quiz/:quizId/master'
              element={<QuizMasterView user={user} />}
            />
            <Route path='/quiz/:quizId' element={<ParticipantView />} />
            <Route path='/score/:quizId' element={<ScorecardView />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
