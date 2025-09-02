import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, UserCheck } from "lucide-react";

export function HomeView() {
  return (
    <div className='home-card'>
      <h1>Live Quiz</h1>
      <p>Choose your role to begin</p>
      {/* This new structure ensures the buttons are centered and have a consistent width */}
      <div className='d-flex justify-content-center'>
        <div
          className='d-flex flex-column align-items-stretch'
          style={{ gap: "1rem", width: "100%", maxWidth: "250px" }}
        >
          <Link to='/admin' className='home-btn home-btn-admin'>
            <ShieldCheck className='mr-2' size={22} /> Admin Login
          </Link>
          <Link to='/join' className='home-btn home-btn-join'>
            <UserCheck className='mr-2' size={22} /> Join Quiz
          </Link>
        </div>
      </div>
    </div>
  );
}
