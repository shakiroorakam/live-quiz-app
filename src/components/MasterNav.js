import React from 'react';
import { Send, Users, HelpCircle } from 'lucide-react';

export const MasterNav = ({ activeTab, setActiveTab, quizState }) => {
    // Disable tabs when a question is live or ended to prevent navigation away
    const isDisabled = quizState === 'question_live' || quizState === 'question_ended';

    return (
        <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
                <button 
                    className={`nav-link ${activeTab === 'start' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('start')} 
                    disabled={isDisabled}
                >
                    <Send size={16} className="mr-1"/> Start Quiz
                </button>
            </li>
            <li className="nav-item">
                <button 
                    className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('questions')} 
                    disabled={isDisabled}
                >
                    <HelpCircle size={16} className="mr-1"/> Questions
                </button>
            </li>
            <li className="nav-item">
                <button 
                    className={`nav-link ${activeTab === 'participants' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('participants')} 
                    disabled={isDisabled}
                >
                    <Users size={16} className="mr-1"/> Participants
                </button>
            </li>
        </ul>
    );
};
