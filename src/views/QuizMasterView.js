// ... imports remain the same ...

// ... sub-components (QuestionsTab, etc.) remain the same ...

export function QuizMasterView() {
    // ... state and useEffect hooks remain the same ...

    return (
        <>
            <Navbar />
            <ParticipantDetailModal /* ... */ />
            <div className="container-fluid" style={{ paddingTop: '80px' }}>
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card shadow-sm mb-4 border-0">
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                   {/* --- THIS IS THE FIX --- */}
                                   <h1 className="card-title text-primary h3">{quiz?.title || 'Quiz Master Dashboard'}</h1>
                                   <div className="d-flex align-items-center text-muted">
                                       <span>Quiz ID: <span className="font-weight-bold text-success">{quizId}</span></span>
                                       <CopyButton text={quizId} />
                                   </div>
                                </div>
                            </div>
                        </div>
                        <MasterNav activeTab={activeTab} setActiveTab={setActiveTab} quizState={quiz?.state} />
                        {renderMainContent()}
                    </div>
                    <div className="col-lg-4">
                        {/* ... Scoreboard remains the same ... */}
                    </div>
                </div>
            </div>
        </>
    );
}
