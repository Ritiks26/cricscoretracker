import { useState } from "react";
import { useMatch } from "../context/MatchContext";
import { createPlayer, createTeam } from "../utils/cricket";
import "./Setup.css";

const SAVED_SETUP_KEY = "cricket_last_setup";

const DEFAULT_TEAM1 = [
  // "Rohit Sharma",
  // "Shubman Gill",
  // "Virat Kohli",
  // "Shreyas Iyer",
  // "KL Rahul",
  // "Hardik Pandya",
  // "Ravindra Jadeja",
  // "Axar Patel",
  // "Jasprit Bumrah",
  // "Mohammed Siraj",
  // "Kuldeep Yadav",
];
const DEFAULT_TEAM2 = [
  // "David Warner",
  // "Travis Head",
  // "Steve Smith",
  // "Marnus Labuschagne",
  // "Glenn Maxwell",
  // "Mitchell Marsh",
  // "Alex Carey",
  // "Pat Cummins",
  // "Mitchell Starc",
  // "Josh Hazlewood",
  // "Adam Zampa",
];

const DEFAULT_SETUP = {
  team1Name: "TEAM THUNDER",
  team2Name: "TEAM CRUSHER",
  team1Players: [...DEFAULT_TEAM1],
  team2Players: [...DEFAULT_TEAM2],
  totalOvers: 20,
  playersPerTeam: 11,
};

function getInitialSetup() {
  try {
    const saved = localStorage.getItem(SAVED_SETUP_KEY);
    if (!saved) return DEFAULT_SETUP;

    const parsed = JSON.parse(saved);
    return {
      team1Name: parsed.team1Name || DEFAULT_SETUP.team1Name,
      team2Name: parsed.team2Name || DEFAULT_SETUP.team2Name,
      team1Players: Array.isArray(parsed.team1Players)
        ? parsed.team1Players
        : DEFAULT_SETUP.team1Players,
      team2Players: Array.isArray(parsed.team2Players)
        ? parsed.team2Players
        : DEFAULT_SETUP.team2Players,
      totalOvers: Number(parsed.totalOvers) || DEFAULT_SETUP.totalOvers,
      playersPerTeam:
        Number(parsed.playersPerTeam) || DEFAULT_SETUP.playersPerTeam,
    };
  } catch {
    return DEFAULT_SETUP;
  }
}

function saveReusableSetup(setup) {
  try {
    localStorage.setItem(SAVED_SETUP_KEY, JSON.stringify(setup));
  } catch {
    // localStorage can be unavailable in private or restricted contexts.
  }
}

function PlayerInput({ players, onChange, count }) {
  const rows = Array.from({ length: count }, (_, i) => players[i] || "");

  const updatePlayer = (i, val) => {
    const next = [...players];
    next[i] = val;
    onChange(next);
  };

  return (
    <div className="player-list">
      {rows.map((p, i) => (
        <div className="player-row" key={i}>
          <span className="player-num">{i + 1}</span>
          <input
            className="player-input"
            value={p}
            onChange={(e) => updatePlayer(i, e.target.value)}
            placeholder={`Player ${i + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

export default function Setup() {
  const { setTeams } = useMatch();
  const [initialSetup] = useState(getInitialSetup);
  const [team1Name, setTeam1Name] = useState(initialSetup.team1Name);
  const [team2Name, setTeam2Name] = useState(initialSetup.team2Name);
  const [team1Players, setTeam1Players] = useState([
    ...initialSetup.team1Players,
  ]);
  const [team2Players, setTeam2Players] = useState([
    ...initialSetup.team2Players,
  ]);
  const [totalOvers, setTotalOvers] = useState(initialSetup.totalOvers);
  const [playersPerTeam, setPlayersPerTeam] = useState(
    initialSetup.playersPerTeam,
  );
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState([]);

  const handleStart = () => {
    const errs = [];
    if (!team1Name.trim()) errs.push("Team 1 name required");
    if (!team2Name.trim()) errs.push("Team 2 name required");
    if (team1Players.filter((p) => p.trim()).length < playersPerTeam)
      errs.push(`Team 1 needs ${playersPerTeam} players`);
    if (team2Players.filter((p) => p.trim()).length < playersPerTeam)
      errs.push(`Team 2 needs ${playersPerTeam} players`);
    if (errs.length) {
      setErrors(errs);
      return;
    }

    const t1 = createTeam(
      team1Name.trim(),
      team1Players.slice(0, playersPerTeam).map((n) => createPlayer(n.trim())),
    );
    const t2 = createTeam(
      team2Name.trim(),
      team2Players.slice(0, playersPerTeam).map((n) => createPlayer(n.trim())),
    );
    saveReusableSetup({
      team1Name: team1Name.trim(),
      team2Name: team2Name.trim(),
      team1Players: team1Players
        .slice(0, playersPerTeam)
        .map((n) => n.trim()),
      team2Players: team2Players
        .slice(0, playersPerTeam)
        .map((n) => n.trim()),
      playersPerTeam,
      totalOvers,
    });
    setTeams([t1, t2], totalOvers);
  };

  return (
    <div className="setup-page">
      <div className="setup-header">
        <div className="setup-badge">CRICKET SCORER</div>
        <h1 className="setup-title">Match Setup</h1>
        <p className="setup-sub">Configure teams before the toss</p>
      </div>

      <div className="setup-card">
        <div className="overs-row">
          <label className="field-label">Total Overs</label>
          <div className="overs-btns">
            {[5, 10, 20, 50].map((o) => (
              <button
                key={o}
                className={`overs-btn${totalOvers === o ? " active" : ""}`}
                onClick={() => setTotalOvers(o)}
              >
                {o} overs
              </button>
            ))}
            <input
              type="number"
              className="overs-custom"
              value={totalOvers}
              min={1}
              max={50}
              onChange={(e) => setTotalOvers(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="overs-row" style={{ marginTop: "1rem" }}>
          <label className="field-label">Players per Team</label>
          <div className="overs-btns">
            {[3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
              <button
                key={n}
                className={`overs-btn${playersPerTeam === n ? " active" : ""}`}
                onClick={() => setPlayersPerTeam(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="team-tabs">
          <button
            className={`team-tab${activeTab === 0 ? " active" : ""}`}
            onClick={() => setActiveTab(0)}
          >
            {team1Name || "Team 1"}
          </button>
          <button
            className={`team-tab${activeTab === 1 ? " active" : ""}`}
            onClick={() => setActiveTab(1)}
          >
            {team2Name || "Team 2"}
          </button>
        </div>

        {activeTab === 0 && (
          <div className="team-section">
            <div className="team-name-row">
              <label className="field-label">Team Name</label>
              <input
                className="team-name-input"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                placeholder="Team 1"
              />
            </div>
            <label
              className="field-label"
              style={{ marginTop: "1rem", display: "block" }}
            >
              Players ({playersPerTeam})
            </label>
            <PlayerInput
              players={team1Players}
              onChange={setTeam1Players}
              count={playersPerTeam}
            />
          </div>
        )}

        {activeTab === 1 && (
          <div className="team-section">
            <div className="team-name-row">
              <label className="field-label">Team Name</label>
              <input
                className="team-name-input"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                placeholder="Team 2"
              />
            </div>
            <label
              className="field-label"
              style={{ marginTop: "1rem", display: "block" }}
            >
              Players ({playersPerTeam})
            </label>
            <PlayerInput
              players={team2Players}
              onChange={setTeam2Players}
              count={playersPerTeam}
            />
          </div>
        )}

        {errors.length > 0 && (
          <div className="error-box">
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </div>
        )}

        <button className="start-match-btn" onClick={handleStart}>
          Proceed to Toss →
        </button>
      </div>
    </div>
  );
}
