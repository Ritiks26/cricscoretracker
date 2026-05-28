import { useState } from "react";
import { useMatch } from "../context/MatchContext";
import "./Toss.css";

export default function Toss() {
  const { state, setToss } = useMatch();
  const [winner, setWinner] = useState(null);
  const [choice, setChoice] = useState(null);

  const handleConfirm = () => {
    if (winner === null || !choice) return;
    setToss(winner, choice);
  };

  const teams = state.teams;

  return (
    <div className="toss-page">
      <div className="toss-header">
        <div className="setup-badge">TOSS</div>
        <h1 className="setup-title">
          {teams[0].name} vs {teams[1].name}
        </h1>
        <p className="setup-sub">{state.totalOvers} overs per side</p>
      </div>

      <div className="toss-card">
        <div className="toss-section">
          <label className="field-label">Toss won by</label>
          <div className="toss-teams">
            {teams.map((t, i) => (
              <button
                key={i}
                className={`toss-team-btn${winner === i ? " active" : ""}`}
                onClick={() => setWinner(i)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="toss-section">
          <label className="field-label">Elected to</label>
          <div className="toss-teams">
            <button
              className={`toss-team-btn${choice === "bat" ? " active" : ""}`}
              onClick={() => setChoice("bat")}
            >
              Bat
            </button>
            <button
              className={`toss-team-btn${choice === "field" ? " active" : ""}`}
              onClick={() => setChoice("field")}
            >
              Field
            </button>
          </div>
        </div>

        {winner !== null && choice && (
          <div className="toss-result">
            <span className="toss-result-text">
              {teams[winner].name} won the toss and elected to {choice} first
            </span>
          </div>
        )}

        <button
          className={`start-match-btn${winner === null || !choice ? " inactive" : ""}`}
          onClick={handleConfirm}
        >
          Select Openers →
        </button>
      </div>
    </div>
  );
}
