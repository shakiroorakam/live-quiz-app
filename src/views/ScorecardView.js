import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Award } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function ScorecardView() {
    const { quizId } = useParams();
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!quizId) return;
        const participantsCollectionPath = `quizzes/${quizId}/participants`;
        const unsubscribe = onSnapshot(collection(db, participantsCollectionPath), (snap) => {
            const parts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by score descending
            parts.sort((a, b) => b.score - a.score);
            setParticipants(parts);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [quizId]);

    return (
        <>
            <Navbar />
            <div className="container text-center" style={{ paddingTop: '80px' }}>
                <h1 className="display-4 text-primary">Scoreboard</h1>
                <h2 className="text-muted mb-5">Quiz ID: {quizId}</h2>
                {isLoading ? <p>Loading scores...</p> : (
                    <div className="row justify-content-center">
                        {participants.map((p, index) => (
                            <div key={p.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                                <div className="card h-100 shadow-sm border-0">
                                    <div className={`card-header text-white ${index === 0 ? 'bg-success' : 'bg-primary'}`}>
                                        {index === 0 && <Award className="mb-2" size={40} />}
                                        <h3 className="h1 font-weight-bold">{p.score}</h3>
                                        <div>Points</div>
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title">{p.name}</h5>
                                        <p className="card-text text-muted">Rank: {index + 1}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
