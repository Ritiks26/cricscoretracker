import { useState } from "react";
import { useMatch } from "../context/MatchContext";
import "./SelectOpeners.css";

export default function SelectOpeners() {
  const { state, setOpeners } = useMatch();
  const inn = state.innings[state.activeInnings];
  const battingTeam = state.teams[inn._battingTeamIdx];
  const bowlingTeam = state.teams[inn._bowlingTeamIdx];
  const usedBatters = inn._usedBatters || [];

  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);

  const availableBatters = battingTeam.players.filter(
    (p) =>
      !usedBatters.includes(p.id) && p.id !== striker && p.id !== nonStriker,
  );

  const handleConfirm = () => {
    if (!striker || !nonStriker || !bowler) return;
    setOpeners(striker, nonStriker, bowler);
  };

  const isSecondInnings = state.activeInnings === 1;

  return (
    <div className="openers-page">
      <div className="openers-header">
        <div className="setup-badge">
          {isSecondInnings ? "2ND INNINGS" : "1ST INNINGS"}
        </div>
        <h1 className="setup-title">Select Players</h1>
        <p className="setup-sub">
          {battingTeam.name} batting · {bowlingTeam.name} bowling
        </p>
        {isSecondInnings && inn.target && (
          <div className="target-chip">
            Target: {inn.target} runs in {inn.totalOvers} overs
          </div>
        )}
      </div>

      <div className="openers-grid">
        <div className="openers-card">
          <div className="openers-card-header">
            <span className="openers-card-title">{battingTeam.name}</span>
            <span className="openers-card-sub">
              Select Opener & Non-Striker
            </span>
          </div>
          {battingTeam.players.map((p) => {
            const isStriker = striker === p.id;
            const isNs = nonStriker === p.id;
            const used = usedBatters.includes(p.id);
            return (
              <div
                key={p.id}
                className={`player-select-row${used ? " used" : ""}`}
              >
                <span className="player-select-name">{p.name}</span>
                {!used && (
                  <div className="player-select-actions">
                    <button
                      className={`sel-btn${isStriker ? " active striker" : ""}`}
                      onClick={() => {
                        setStriker(isStriker ? null : p.id);
                        if (nonStriker === p.id) setNonStriker(null);
                      }}
                    >
                      ★ Strike
                    </button>
                    <button
                      className={`sel-btn${isNs ? " active non-striker" : ""}`}
                      onClick={() => {
                        setNonStriker(isNs ? null : p.id);
                        if (striker === p.id) setStriker(null);
                      }}
                    >
                      Non-Strike
                    </button>
                  </div>
                )}
                {used && <span className="used-tag">Dismissed</span>}
              </div>
            );
          })}
        </div>

        <div className="openers-card">
          <div className="openers-card-header">
            <span className="openers-card-title">{bowlingTeam.name}</span>
            <span className="openers-card-sub">Select Opening Bowler</span>
          </div>
          {bowlingTeam.players.map((p) => (
            <div key={p.id} className={`player-select-row`}>
              <span className="player-select-name">{p.name}</span>
              <button
                className={`sel-btn${bowler === p.id ? " active bowler" : ""}`}
                onClick={() => setBowler(bowler === p.id ? null : p.id)}
              >
                Bowl
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="openers-summary">
        {striker && (
          <div className="sel-chip striker">
            ⚡ {battingTeam.players.find((p) => p.id === striker)?.name}{" "}
            (striker)
          </div>
        )}
        {nonStriker && (
          <div className="sel-chip ns">
            ○ {battingTeam.players.find((p) => p.id === nonStriker)?.name}{" "}
            (non-striker)
          </div>
        )}
        {bowler && (
          <div className="sel-chip bowler">
            ⚾ {bowlingTeam.players.find((p) => p.id === bowler)?.name} (bowler)
          </div>
        )}
      </div>
      <button
        className={`start-match-btn${!striker || !nonStriker || !bowler ? " inactive" : ""}`}
        style={{ maxWidth: 480, width: "100%" }}
        onClick={handleConfirm}
      >
        Start Innings →
      </button>
    </div>
  );
}
