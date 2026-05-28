import { getBallClass, getBallLabel, getOversStr } from '../utils/cricket';
import './OverHistory.css';

function BallPip({ ball }) {
  return (
    <div className={`ohball ${getBallClass(ball)}`} title={getBallLabel(ball)}>
      {getBallLabel(ball)}
    </div>
  );
}

export default function OverHistory({ inn }) {
  const allOvers = [...inn.overHistory].reverse();

  const totalsByOver = allOvers.map(over => ({
    ...over,
    total: over.balls.reduce((s, b) => s + b.runs, 0),
    wickets: over.balls.filter(b => b.wicket).length,
    boundaries: over.balls.filter(b => b.runs === 4 || b.runs === 6).length,
  }));

  if (allOvers.length === 0) {
    return (
      <div className="oh-empty">
        <div className="oh-empty-icon">◉</div>
        <div className="oh-empty-text">No completed overs yet</div>
      </div>
    );
  }

  return (
    <div className="oh-page">
      <div className="oh-summary-strip">
        <div className="oh-sum-item">
          <span className="oh-sum-val">{inn.overHistory.length}</span>
          <span className="oh-sum-label">Overs</span>
        </div>
        <div className="oh-sum-item">
          <span className="oh-sum-val">{inn.runs}</span>
          <span className="oh-sum-label">Runs</span>
        </div>
        <div className="oh-sum-item">
          <span className="oh-sum-val">{inn.wickets}</span>
          <span className="oh-sum-label">Wickets</span>
        </div>
        <div className="oh-sum-item">
          <span className="oh-sum-val">{(inn.runs / Math.max(inn.overHistory.length, 1)).toFixed(1)}</span>
          <span className="oh-sum-label">Avg/Over</span>
        </div>
      </div>

      {/* Run chart bar */}
      <div className="oh-chart">
        {[...inn.overHistory].map((over, i) => {
          const runsThisOver = over.balls.reduce((s, b) => s + b.runs, 0);
          const maxRuns = Math.max(...inn.overHistory.map(o => o.balls.reduce((s, b) => s + b.runs, 0)), 1);
          const pct = (runsThisOver / maxRuns) * 100;
          const hasWicket = over.balls.some(b => b.wicket);
          return (
            <div key={i} className="oh-bar-col" title={`Over ${i + 1}: ${runsThisOver} runs${hasWicket ? ' · W' : ''}`}>
              <div className="oh-bar-val">{runsThisOver}</div>
              <div className="oh-bar-track">
                <div className={`oh-bar-fill${hasWicket ? ' wicket' : ''}`} style={{ height: `${pct}%` }} />
              </div>
              <div className="oh-bar-label">{i + 1}</div>
            </div>
          );
        })}
      </div>

      {/* Per-over details */}
      <div className="oh-list">
        {totalsByOver.map((over, i) => {
          const overNum = inn.overHistory.length - i;
          return (
            <div key={i} className="oh-row">
              <div className="oh-row-header">
                <span className="oh-over-num">Ov {overNum}</span>
                <span className="oh-bowler-name">{over.bowler}</span>
                <span className="oh-over-runs">{over.total} runs{over.wickets > 0 ? ` · ${over.wickets}W` : ''}</span>
              </div>
              <div className="oh-balls-row">
                {over.balls.map((b, j) => <BallPip key={j} ball={b} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
