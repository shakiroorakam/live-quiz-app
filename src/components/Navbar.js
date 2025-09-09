import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LogOut, ExternalLink } from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

export function Navbar({ user }) {
    const location = useLocation();
    
    // Check if the current path is a quiz master view and extract the Quiz ID
    const match = location.pathname.match(/^\/quiz\/([A-Z0-9]+)\/master$/);
    const quizId = match ? match[1] : null;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Optional: force a reload to clear all state
            window.location.hash = '/';
            window.location.reload();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark-custom">
            <Link className="navbar-brand font-weight-bold" to="/">
                Live Quiz
            </Link>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav mr-auto">
                    <li className="nav-item">
                        <Link className="nav-link d-flex align-items-center" to="/"><Home size={16} className="mr-2"/> Home</Link>
                    </li>
                    {/* This dropdown will only appear on the Quiz Master page */}
                    {quizId && (
                        <li className="nav-item dropdown">
                            <a className="nav-link dropdown-toggle" href="#" id="quizLinksDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Quiz Links
                            </a>
                            <div className="dropdown-menu" aria-labelledby="quizLinksDropdown">
                                <Link className="dropdown-item d-flex align-items-center" to="/join" target="_blank" rel="noopener noreferrer">
                                    Join Page <ExternalLink size={14} className="ml-auto"/>
                                </Link>
                                <Link className="dropdown-item d-flex align-items-center" to={`/score/${quizId}`} target="_blank" rel="noopener noreferrer">
                                    Public Display <ExternalLink size={14} className="ml-auto"/>
                                </Link>
                                <Link className="dropdown-item d-flex align-items-center" to={`/scoreboard/${quizId}`} target="_blank" rel="noopener noreferrer">
                                    Scoreboard Only <ExternalLink size={14} className="ml-auto"/>
                                </Link>
                            </div>
                        </li>
                    )}
                </ul>
                {user && (
                    <button className="btn btn-outline-light btn-sm d-flex align-items-center" onClick={handleLogout}>
                        <LogOut size={16} className="mr-2"/> Logout
                    </button>
                )}
            </div>
        </nav>
    );
}
