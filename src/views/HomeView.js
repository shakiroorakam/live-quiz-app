import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserCheck } from 'lucide-react';

export function HomeView() {
    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="card-body text-center p-5">
                    <h1 className="card-title text-primary font-weight-bold mb-2">Live Quiz</h1>
                    <p className="card-text text-muted mb-4">Choose your role to begin</p>
                    <div className="d-grid gap-3">
                        <Link to="/login" className="btn btn-primary btn-lg d-flex align-items-center justify-content-center">
                            <ShieldCheck className="mr-2" size={24} /> Admin Login
                        </Link>
                        <Link to="/join" className="btn btn-success btn-lg d-flex align-items-center justify-content-center mt-3">
                            <UserCheck className="mr-2" size={24} /> Join Quiz
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
