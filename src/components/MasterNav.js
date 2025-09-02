import React from "react";
import { Users, HelpCircle, BarChart, Play } from "lucide-react";

export function MasterNav({ activeTab, setActiveTab, quiz }) {
  const navItems = [
    {
      id: "questions",
      label: "Questions",
      icon: HelpCircle,
      states: ["lobby", "running", "finished"],
    },
    { id: "startQuiz", label: "Start Quiz", icon: Play, states: ["running"] },
    {
      id: "participants",
      label: "Participants",
      icon: Users,
      states: ["lobby", "running", "finished"],
    },
    {
      id: "scoreboard",
      label: "Scoreboard",
      icon: BarChart,
      states: ["lobby", "running", "finished"],
    },
  ];

  const availableItems = navItems.filter((item) =>
    item.states.includes(quiz?.state || "lobby")
  );

  return (
    <ul className='nav nav-tabs nav-fill mb-3'>
      {availableItems.map((item) => (
        <li className='nav-item' key={item.id}>
          <a
            className={`nav-link d-flex align-items-center justify-content-center ${
              activeTab === item.id ? "active" : ""
            }`}
            href='#'
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(item.id);
            }}
          >
            <item.icon size={16} className='mr-2' /> {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
