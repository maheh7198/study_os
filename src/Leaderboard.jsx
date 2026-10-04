import { useState } from "react";
import {
  Trophy,
  Medal,
  Flame,
  Zap,
  Target,
  Clock3,
  BookOpen,
  Code2,
  LockKeyhole,
} from "lucide-react";

import "./Leaderboard.css";

const PERIODS = [
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
];

function Leaderboard() {
  const [period, setPeriod] = useState("week");

  return (
    <div className="leaderboard-page">
      {/* HEADER */}
      <header className="leaderboard-header">
        <div className="leaderboard-heading">
          <div className="leaderboard-heading-icon">
            <Trophy size={28} />
          </div>

          <div>
            <h1>Leaderboard</h1>
            <p>
              Stay consistent, track your progress, and see
              where you stand.
            </p>
          </div>
        </div>

        <div className="leaderboard-period">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              className={
                period === item.id ? "active" : ""
              }
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* YOUR POSITION */}
      <section className="leaderboard-your-card">
        <div className="your-rank-icon">
          <Trophy size={24} />
        </div>

        <div className="your-rank-content">
          <span>Your Position</span>

          <div className="your-rank-row">
            <strong>—</strong>
            <small>Rank will appear after students join</small>
          </div>
        </div>

        <div className="your-stats">
          <div>
            <span>XP</span>
            <strong>—</strong>
          </div>

          <div>
            <span>Streak</span>
            <strong>—</strong>
          </div>
        </div>
      </section>

      {/* TOP STUDENTS */}
      <section className="leaderboard-card">
        <div className="leaderboard-card-header">
          <div>
            <h2>Top Students</h2>
            <p>
              Rankings will be calculated from real StudyOS
              activity.
            </p>
          </div>

          <div className="leaderboard-status">
            <span className="status-dot" />
            Waiting for data
          </div>
        </div>

        <div className="leaderboard-empty">
          <div className="empty-trophy">
            <Trophy size={27} />
          </div>

          <h3>No rankings yet</h3>

          <p>
            Once students start using StudyOS, their real
            activity will be converted into XP and rankings.
          </p>
        </div>
      </section>

      {/* HOW XP WILL WORK */}
      <section className="xp-section">
        <div className="xp-heading">
          <div>
            <h2>How XP will be earned</h2>
            <p>
              These activities will be connected to the
              backend later.
            </p>
          </div>

          <div className="xp-lock">
            <LockKeyhole size={15} />
            Backend controlled
          </div>
        </div>

        <div className="xp-grid">
          <XPCard
            icon={Target}
            title="Complete Tasks"
            description="Finish your StudyOS tasks."
            color="indigo"
          />

          <XPCard
            icon={Clock3}
            title="Study Sessions"
            description="Complete focused study sessions."
            color="cyan"
          />

          <XPCard
            icon={Flame}
            title="Maintain Streak"
            description="Study consistently each day."
            color="orange"
          />

          <XPCard
            icon={BookOpen}
            title="Complete Topics"
            description="Finish subject and placement topics."
            color="green"
          />

          <XPCard
            icon={Code2}
            title="Solve Problems"
            description="Complete coding practice."
            color="purple"
          />

          <XPCard
            icon={Zap}
            title="Reach Goals"
            description="Make progress on your goals."
            color="red"
          />
        </div>
      </section>
    </div>
  );
}

function XPCard({
  icon: Icon,
  title,
  description,
  color,
}) {
  return (
    <div className={`xp-card ${color}`}>
      <div className="xp-icon">
        <Icon size={18} />
      </div>

      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default Leaderboard;