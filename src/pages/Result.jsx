import { useMatch } from '../context/MatchContext';
import { getOversStr, getStrikeRate, getBowlingEconomy } from '../utils/cricket';
import './Result.css';

const SAVED_SETUP_KEY = 'cricket_last_setup';

function hasSavedSetup() {
  try {
    return Boolean(localStorage.getItem(SAVED_SETUP_KEY));
  } catch {
    return false;
  }
}

export default function Result() {
  const { state, startSecondInnings, reset } = useMatch();
  const inn0 = state.innings[0];
  const inn1 = state.innings[1];
  const isInningsBreak = state.phase === 'innings_break';

  let resultText = '';
  if (!isInningsBreak && inn1) {
    const runs1 = inn1.runs;
    const target = inn1.target;
    const wickets1 = inn1.wickets;
    const team1 = inn0.battingTeamName;
    const team2 = inn1.battingTeamName;

    if (runs1 > inn0.runs) {
      resultText = `${team2} won by ${10 - wickets1} wickets`;
    } else if (runs1 < inn0.runs && (inn1.wickets >= 10 || inn1.balls >= inn1.totalOvers * 6)) {
      resultText = `${team1} won by ${inn0.runs - runs1} runs`;
    } else if (runs1 === inn0.runs) {
      resultText = 'Match Tied!';
    }
  }

  const handleNewMatch = () => {
    if (!window.confirm('Start a new match?')) return;
    const keepSquad = hasSavedSetup()
      ? window.confirm('Keep old squad?')
      : false;
    reset({ keepSquad });
  };

  return (
    <div className="result-page">
      <div className="result-header">
        {isInningsBreak ? (
          <>
            <div className="setup-badge">INNINGS BREAK</div>
            <h1 className="result-title">{inn0.battingTeamName}</h1>
            <div className="result-score-big">{inn0.runs}/{inn0.wickets}</div>
            <div className="result-meta">({getOversStr(inn0.balls)} overs)</div>
            <div className="target-announce">
              {inn0.bowlingTeamName} need <strong>{inn0.runs + 1}</strong> runs to win in {inn0.totalOvers} overs
            </div>
          </>
        ) : (
          <>
            <div className="setup-badge">MATCH RESULT</div>
            <div className="result-winner">{resultText}</div>
            <div className="scores-row">
              <div className="final-score-block">
                <div className="fsc-team">{inn0.battingTeamName}</div>
                <div className="fsc-score">{inn0.runs}/{inn0.wickets}</div>
                <div className="fsc-ov">({getOversStr(inn0.balls)} ov)</div>
              </div>
              <div className="vs-divider">vs</div>
              <div className="final-score-block">
                <div className="fsc-team">{inn1?.battingTeamName}</div>
                <div className="fsc-score">{inn1?.runs}/{inn1?.wickets}</div>
                <div className="fsc-ov">({getOversStr(inn1?.balls || 0)} ov)</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Summary of first innings */}
      <div className="result-cards">
        <InningsSummary inn={inn0} label="1st Innings" />
        {inn1 && <InningsSummary inn={inn1} label="2nd Innings" />}
      </div>

      <div className="result-actions">
        {isInningsBreak && (
          <button className="start-match-btn" onClick={startSecondInnings}>
            Start 2nd Innings →
          </button>
        )}
        <button className="reset-btn" style={{ width: '100%', marginTop: 8, padding: '12px' }} onClick={handleNewMatch}>
          New Match
        </button>
      </div>
    </div>
  );
}

function InningsSummary({ inn, label }) {
  const usedIds = inn._usedBatters || [];
  const battingTeam = null; // we only have player state on innings
  
  // Top scorer from FOW data — show basic summary
  const fow = inn.fallOfWickets;

  return (
    <div className="inn-summary-card">
      <div className="inn-sum-header">
        <span className="inn-sum-label">{label} · {inn.battingTeamName}</span>
        <span className="inn-sum-score">{inn.runs}/{inn.wickets} ({getOversStr(inn.balls)} ov)</span>
      </div>
      <div className="inn-sum-extras">
        Extras: {inn.extras.wides + inn.extras.noBalls + inn.extras.legByes + inn.extras.byes}
        {' '}(wd {inn.extras.wides}, nb {inn.extras.noBalls}, lb {inn.extras.legByes}, b {inn.extras.byes})
      </div>
      {fow.length > 0 && (
        <div className="inn-sum-fow">
          <div className="inn-sum-fow-label">Fall of Wickets</div>
          <div className="fow-chips">
            {fow.map((f, i) => (
              <span key={i} className="fow-chip">{f.runs}/{f.wicket}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
