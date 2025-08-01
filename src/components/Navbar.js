import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Home, BarChart2 } from 'lucide-react';

export const Navbar = () => {
    const { quizId } = useParams();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark fixed-top shadow-sm navbar-dark-custom">
            <div className="container-fluid">
                <Link className="navbar-brand font-weight-bold" to="/">Live Quiz</Link>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ml-auto">
                        <li className="nav-item">
                            <Link className="nav-link d-flex align-items-center" to="/">
                                <Home size={18} className="mr-1" /> Home
                            </Link>
                        </li>
                        {quizId && (
                             <li className="nav-item">
                                <Link className="nav-link d-flex align-items-center" to={`/score/${quizId}`}>
                                    <BarChart2 size={18} className="mr-1" /> Scorecard
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};
