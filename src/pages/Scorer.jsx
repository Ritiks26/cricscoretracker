import { useState } from "react";
import { useMatch } from "../context/MatchContext";
import {
  getBallClass,
  getBallLabel,
  getOversStr,
  getRunRate,
  getRequiredRate,
  getStrikeRate,
  DISMISSAL_TYPES,
} from "../utils/cricket";
import ScoreCard from "../components/ScoreCard";
import OverHistory from "../components/OverHistory";
import "./Scorer.css";

function BallDot({ ball }) {
  return (
    <div
      className={`ball-dot-item ${getBallClass(ball)}`}
      title={getBallLabel(ball)}
    >
      {getBallLabel(ball)}
    </div>
  );
}

function WicketModal({ onConfirm, onCancel, innings }) {
  const [dismissal, setDismissal] = useState("");
  const [runsBeforeWicket, setRunsBeforeWicket] = useState(0);
  const [fielder, setFielder] = useState("");
  const [dismissedSlot, setDismissedSlot] = useState("");

  const isRunOut = dismissal === "Run Out";
  const canConfirm = dismissal && (!isRunOut || dismissedSlot);

  const confirm = () => {
    if (!canConfirm) return;
    onConfirm({
      type: dismissal,
      fielder,
      runsBeforeWicket: Number(runsBeforeWicket),
      dismissedSlot: isRunOut ? dismissedSlot : "striker",
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 className="modal-title">Wicket!</h3>
        <p className="modal-sub">Select dismissal type</p>

        <div className="dismissal-grid">
          {DISMISSAL_TYPES.map((d) => (
            <button
              key={d}
              className={`dismissal-btn${dismissal === d ? " active" : ""}`}
              onClick={() => setDismissal(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {["Caught", "Run Out", "Stumped"].includes(dismissal) && (
          <div className="modal-field">
            <label className="modal-field-label">Fielder (optional)</label>
            <input
              className="modal-input"
              value={fielder}
              onChange={(e) => setFielder(e.target.value)}
              placeholder="Fielder name"
            />
          </div>
        )}

        {isRunOut && (
          <div className="modal-field">
            <label className="modal-field-label">Who is out?</label>
            <div className="runout-choice-grid">
              {innings.striker && (
                <button
                  className={`runout-choice-btn${
                    dismissedSlot === "striker" ? " active" : ""
                  }`}
                  onClick={() => setDismissedSlot("striker")}
                >
                  <span>{innings.striker.name}</span>
                  <small>Striker</small>
                </button>
              )}
              {innings.nonStriker && (
                <button
                  className={`runout-choice-btn${
                    dismissedSlot === "nonStriker" ? " active" : ""
                  }`}
                  onClick={() => setDismissedSlot("nonStriker")}
                >
                  <span>{innings.nonStriker.name}</span>
                  <small>Non-striker</small>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="modal-field">
          <label className="modal-field-label">
            Runs scored on this delivery
          </label>
          <div className="runs-btns">
            {[0, 1, 2, 3].map((r) => (
              <button
                key={r}
                className={`runs-btn${runsBeforeWicket === r ? " active" : ""}`}
                onClick={() => setRunsBeforeWicket(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`modal-confirm${!canConfirm ? " inactive" : ""}`}
            onClick={confirm}
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
}

function NewBatterModal({ team, usedIds, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const available = team.players.filter((p) => !usedIds.includes(p.id));

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 className="modal-title">New Batter</h3>
        <p className="modal-sub">Select next player to bat</p>
        <div className="player-pick-list">
          {available.length === 0 && <div className="no-players">All out!</div>}
          {available.map((p) => (
            <button
              key={p.id}
              className={`player-pick-btn${selected === p.id ? " active" : ""}`}
              onClick={() => setSelected(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        <button
          className={`modal-confirm${!selected ? " inactive" : ""}`}
          onClick={() => onConfirm(selected)}
          style={{ width: "100%", marginTop: 12 }}
        >
          Send to Crease →
        </button>
      </div>
    </div>
  );
}

function NewBowlerModal({ team, lastBowlerId, onConfirm }) {
  const [selected, setSelected] = useState(null);
  // Can't bowl consecutive overs
  const available = team.players.filter((p) => p.id !== lastBowlerId);

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 className="modal-title">Select Bowler</h3>
        <p className="modal-sub">Choose bowler for next over</p>
        <div className="player-pick-list">
          {available.map((p) => {
            const o =
              p.bowling.overs +
              (p.bowling.balls > 0 ? `+${p.bowling.balls}` : "");
            return (
              <button
                key={p.id}
                className={`player-pick-btn${selected === p.id ? " active" : ""}`}
                onClick={() => setSelected(p.id)}
              >
                <span>{p.name}</span>
                <span className="bowler-pick-stat">
                  {o} ov · {p.bowling.wickets}w · {p.bowling.runs}r
                </span>
              </button>
            );
          })}
        </div>
        <button
          className={`modal-confirm${!selected ? " inactive" : ""}`}
          onClick={() => onConfirm(selected)}
          style={{ width: "100%", marginTop: 12 }}
        >
          Start Bowling →
        </button>
      </div>
    </div>
  );
}

export default function Scorer() {
  const {
    state,
    currentInnings: inn,
    deliver,
    setNewBatter,
    setNewBowler,
    undo,
    reset,
  } = useMatch();
  const [showWicket, setShowWicket] = useState(false);
  const [activeTab, setActiveTab] = useState("score");

  if (!inn) return null;

  const battingTeam = state.teams[inn._battingTeamIdx];
  const bowlingTeam = state.teams[inn._bowlingTeamIdx];
  const usedBatterIds = inn._usedBatters || [];
  const lastBowlerId =
    inn.overHistory.length > 0
      ? inn.overHistory[inn.overHistory.length - 1]?.bowlerId
      : null;

  const totalBalls = inn.totalOvers * 6;
  const ballsDone = inn.balls;
  const ballsLeft = totalBalls - ballsDone;
  const oversLeft = getOversStr(ballsLeft);
  const rr = getRunRate(inn.runs, inn.balls);
  const needed = inn.target !== null ? inn.target - inn.runs : null;
  const rrr = needed !== null ? getRequiredRate(needed, ballsLeft) : null;

  const handleBall = (runs, type = "normal") => {
    deliver({ runs, type, wicket: null });
  };

  const handleExtra = (type) => {
    deliver({ runs: 1, type, wicket: null });
  };

  const handleWicketConfirm = ({
    type,
    fielder,
    runsBeforeWicket,
    dismissedSlot,
  }) => {
    setShowWicket(false);
    deliver({
      runs: runsBeforeWicket,
      type: "normal",
      wicket: {
        type,
        bowler: inn.currentBowler?.name || "",
        fielder,
        dismissedSlot,
      },
    });
  };

  const handleNewBatter = (id) => {
    setNewBatter(id);
  };

  const handleNewBowler = (id) => {
    setNewBowler(id);
  };

  const progressPct = Math.min((ballsDone / totalBalls) * 100, 100);

  const isOverEnd = state.phase === "over_end";
  const isWicketNewBatter = state.phase === "wicket_new_batter";

  // Bowler stats for current over display
  const bowler = inn.currentBowler;
  const striker = inn.striker;
  const nonStriker = inn.nonStriker;

  return (
    <div className="scorer-page">
      {showWicket && (
        <WicketModal
          innings={inn}
          onConfirm={handleWicketConfirm}
          onCancel={() => setShowWicket(false)}
        />
      )}

      {isWicketNewBatter && (
        <NewBatterModal
          team={battingTeam}
          usedIds={usedBatterIds}
          onConfirm={handleNewBatter}
        />
      )}

      {isOverEnd && (
        <NewBowlerModal
          team={bowlingTeam}
          lastBowlerId={lastBowlerId}
          onConfirm={handleNewBowler}
        />
      )}

      {/* Score Hero */}
      <div className="score-hero">
        <div className="hero-left">
          <div className="hero-team">{inn.battingTeamName}</div>
          <div className="hero-score">
            {inn.runs}
            <span className="hero-wkt"> / {inn.wickets}</span>
          </div>
          <div className="hero-meta">
            overs {getOversStr(inn.balls)} / {getOversStr(totalBalls)} · RR {rr}
            {rrr && (
              <span className="rrr-tag">
                {" "}
                · need {needed} in {oversLeft} ov (RRR {rrr})
              </span>
            )}
          </div>
        </div>
        <div className="hero-right">
          {inn.target && (
            <div className="target-label">Target {inn.target}</div>
          )}
          <div className="inn-badge">{state.activeInnings + 1}st Inn</div>
          <button className="undo-btn" onClick={undo} title="Undo last ball">
            ↩
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        {inn.fallOfWickets.map((fow, i) => (
          <div
            key={i}
            className="fow-marker"
            style={{ left: `${(fow.over / totalBalls) * 100}%` }}
            title={`${fow.batter} ${fow.runs}/${fow.wicket}`}
          />
        ))}
      </div>

      {/* Current Over Balls */}
      <div className="current-over">
        <span className="over-label-text">This over</span>
        <div className="over-balls">
          {Array.from({ length: 9 }).map((_, i) => {
            const b = inn.currentOverBalls[i];
            return b ? (
              <BallDot key={i} ball={b} />
            ) : (
              <div key={i} className="ball-dot-item ball-empty">
                ·
              </div>
            );
          })}
        </div>
        {bowler && (
          <span className="bowler-tag">
            {bowler.name} · {getOversStr(bowler.bowling.balls)} overs{" "}
            {bowler.bowling.runs} runs {bowler.bowling.wickets} wickets
          </span>
        )}
      </div>

      {/* At Crease */}
      <div className="crease-panel">
        {striker && (
          <div className="crease-batter">
            <span className="crease-strike-dot" />
            <div>
              <div className="crease-name">
                {striker.name} <span className="crease-badge">★</span>
              </div>
              <div className="crease-stat">
                {striker.batting.runs}({striker.batting.balls}) SR{" "}
                {getStrikeRate(striker.batting.runs, striker.batting.balls)} |{" "}
                {striker.batting.fours}×4 {striker.batting.sixes}×6
              </div>
            </div>
          </div>
        )}
        {nonStriker && (
          <div className="crease-batter ns">
            <span className="crease-ns-dot" />
            <div>
              <div className="crease-name">{nonStriker.name}</div>
              <div className="crease-stat">
                {nonStriker.batting.runs}({nonStriker.batting.balls}) SR{" "}
                {getStrikeRate(
                  nonStriker.batting.runs,
                  nonStriker.batting.balls,
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {["score", "card", "history"].map((t) => (
          <button
            key={t}
            className={`tab${activeTab === t ? " active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t === "score"
              ? "Scoring"
              : t === "card"
                ? "Scorecard"
                : "Over History"}
          </button>
        ))}
      </div>

      {activeTab === "score" && (
        <div className="action-panel">
          <div className="action-section-label">Runs</div>
          <div className="run-btns">
            {[0, 1, 2, 3, 4, 6].map((r) => (
              <button
                key={r}
                className={`run-btn r${r}`}
                onClick={() => handleBall(r)}
              >
                {r === 0 ? "•" : r}
              </button>
            ))}
          </div>

          <div className="action-section-label">Extras</div>
          <div className="extra-btns">
            <button
              className="extra-btn wide"
              onClick={() => handleExtra("wide")}
            >
              Wide
            </button>
            <button
              className="extra-btn nb"
              onClick={() => handleExtra("noBall")}
            >
              No Ball
            </button>
            <button
              className="extra-btn lb"
              onClick={() => handleExtra("legBye")}
            >
              Leg Bye
            </button>
            <button
              className="extra-btn bye"
              onClick={() => handleExtra("bye")}
            >
              Bye
            </button>
          </div>

          <div className="action-section-label">Boundaries + Wicket</div>
          <div className="special-btns">
            <button className="special-btn four" onClick={() => handleBall(4)}>
              FOUR
            </button>
            <button className="special-btn six" onClick={() => handleBall(6)}>
              SIX
            </button>
            <button
              className="special-btn wicket"
              onClick={() => setShowWicket(true)}
            >
              WICKET
            </button>
          </div>

          <div className="extras-summary">
            <div className="extras-item">
              Wides <strong>{inn.extras.wides}</strong>
            </div>
            <div className="extras-item">
              No Balls <strong>{inn.extras.noBalls}</strong>
            </div>
            <div className="extras-item">
              Leg Byes <strong>{inn.extras.legByes}</strong>
            </div>
            <div className="extras-item">
              Byes <strong>{inn.extras.byes}</strong>
            </div>
            <div className="extras-item total">
              Total Extras{" "}
              <strong>
                {inn.extras.wides +
                  inn.extras.noBalls +
                  inn.extras.legByes +
                  inn.extras.byes}
              </strong>
            </div>
          </div>
        </div>
      )}

      {activeTab === "card" && (
        <ScoreCard
          inn={inn}
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
        />
      )}
      {activeTab === "history" && <OverHistory inn={inn} />}

      <div className="bottom-bar">
        <button
          className="reset-btn"
          onClick={() => {
            if (window.confirm("End match and reset?")) reset();
          }}
        >
          End Match
        </button>
      </div>
    </div>
  );
}
