import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, UserCheck } from "lucide-react";

export function HomeView() {
  return (
    <div className='animated-card text-center' style={{ maxWidth: "500px" }}>
      <h1 className='display-4 font-weight-bold mb-3 text-primary'>
        Live Quiz Platform
      </h1>
      <p className='lead text-light mb-5'>Choose your role to begin</p>
      <div className='d-flex justify-content-center'>
        <Link
          to='/admin'
          className='btn btn-primary btn-lg animated-button d-flex align-items-center justify-content-center mx-2'
        >
          <ShieldCheck className='mr-2' size={24} /> Admin Login
        </Link>
        <Link
          to='/join'
          className='btn btn-success btn-lg animated-button d-flex align-items-center justify-content-center mx-2'
        >
          <UserCheck className='mr-2' size={24} /> Join Quiz
        </Link>
      </div>
    </div>
  );
}
