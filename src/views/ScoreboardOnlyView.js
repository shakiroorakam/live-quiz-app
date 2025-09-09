import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { Loader2, Award, Trophy } from 'lucide-react';

// Language detection helper
const getLangClass = (text) => {
    if (!text) return '';
    if (/[\u0600-\u06FF]/.test(text)) return 'lang-ar'; // Arabic
    if (/[\u0D00-\u0D7F]/.test(text)) return 'lang-ml'; // Malayalam
    return '';
};

// Helper component for the Toppers Display
const ToppersDisplay = ({ toppers }) => (
    <div className="toppers-container">
        {toppers.map((p, index) => {
            const rank = index + 1;
            let rankIcon = <Award />;
            if (rank === 1) rankIcon = <Trophy />;

            return (
                <div key={p.id} className={`rank-card rank-${rank}`}>
                    <div className="rank-icon">{rankIcon}</div>
                    <h3 className={`card-title font-weight-bold multilang-text ${getLangClass(p.name)}`}>{p.name}</h3>
                    <p className="display-4">{p.score}</p>
                </div>
            )
        })}
    </div>
);

// Helper component for the full scoreboard view
const ScoreboardDisplay = ({ participants }) => (
    <div>
        <h2 className="text-center mb-4">Full Scoreboard</h2>
        <div className="row justify-content-center">
           {participants.map(p => (
               <div key={p.id} className="col-sm-6 col-md-4 col-lg-3 mb-4">
                   <div className="card text-center h-100 public-score-card">
                       <div className="card-body d-flex flex-column justify-content-center">
                           <h4 className={`card-title multilang-text ${getLangClass(p.name)}`}>{p.name}</h4>
                           <p className="display-4 font-weight-bold text-light">{p.score}</p>
                       </div>
                   </div>
               </div>
           ))}
        </div>
    </div>
);


export function ScoreboardOnlyView() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!quizId) {
            setError("No Quiz ID provided.");
            setLoading(false);
            return;
        }

        const quizRef = doc(db, 'quizzes', quizId);
        const unsubscribeQuiz = onSnapshot(quizRef, (docSnap) => {
            if (docSnap.exists()) {
                setQuiz({ id: docSnap.id, ...docSnap.data() });
            } else {
                setError("Quiz not found.");
            }
            setLoading(false);
        });

        const participantsRef = collection(db, 'quizzes', quizId, 'participants');
        const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
            const participantData = snapshot.docs.map(p => ({ id: p.id, ...p.data() }));
            setParticipants(participantData);
        });

        return () => {
            unsubscribeQuiz();
            unsubscribeParticipants();
        };
    }, [quizId]);

    const renderContent = () => {
        if (!quiz) return <div className="display-4">Waiting for quiz to start...</div>;
        
        // This view ONLY shows the scoreboard, sorted differently based on quiz state.
        if (quiz.state === 'finished') {
            const sortedByScore = [...participants].sort((a, b) => b.score - a.score);
            const toppers = sortedByScore.slice(0, 3);
            const restOfParticipants = sortedByScore.sort((a,b) => a.name.localeCompare(b.name));

            return (
                <div>
                    <h1 className="display-3 text-center mb-5 font-weight-bold">Final Ranks</h1>
                    <ToppersDisplay toppers={toppers} />
                    <hr style={{borderColor: 'rgba(255,255,255,0.3)'}} />
                    <ScoreboardDisplay participants={restOfParticipants} />
                </div>
            );
        } else {
             // For all other states (lobby, running, etc.), just show the alphabetized scoreboard.
            const sortedByName = [...participants].sort((a, b) => a.name.localeCompare(b.name));
            if (participants.length > 0) {
                return <ScoreboardDisplay participants={sortedByName} />;
            }
            return <h1 className={`display-3 text-center multilang-text ${getLangClass(quiz.title)}`}>Welcome to the '{quiz.title}' quiz!</h1>;
        }
    };

    if (loading) {
        return <div className="text-light d-flex align-items-center display-4"><Loader2 className="animate-spin mr-3" /> Loading...</div>;
    }
    if(error) {
        return <div className="alert alert-danger display-4">{error}</div>;
    }

    return (
        <div className="public-display-container text-light text-center p-3 p-md-5">
            {renderContent()}
        </div>
    );
}
