import {
  getStrikeRate,
  getBowlingEconomy,
  getOversStr,
} from "../utils/cricket";
import "./ScoreCard.css";

function BattingCard({ inn }) {
  const striker = inn.striker;
  const nonStriker = inn.nonStriker;
  const rows = [];

  if (striker) {
    rows.push({ player: striker, status: "batting", isStriker: true });
  }
  if (nonStriker) {
    rows.push({ player: nonStriker, status: "batting", isStriker: false });
  }

  // dismissed batters — inn.dismissedBatters se aate hain (stats safe hain)
  (inn.dismissedBatters || []).forEach((p) => {
    rows.push({ player: p, status: "out" });
  });

  (inn.retiredBatters || []).forEach((p) => {
    rows.push({ player: p, status: "retired" });
  });

  const extras = inn.extras;
  const totalExtras =
    extras.wides + extras.noBalls + extras.legByes + extras.byes;

  return (
    <div className="scorecard-section">
      <div className="sc-team-header">
        <span className="sc-team-name">{inn.battingTeamName}</span>
        <span className="sc-team-score">
          {inn.runs}/{inn.wickets} ({getOversStr(inn.balls)} overs)
        </span>
      </div>

      <table className="sc-table">
        <thead>
          <tr>
            <th className="sc-th name-col">Batter</th>
            <th className="sc-th">R</th>
            <th className="sc-th">B</th>
            <th className="sc-th">4s</th>
            <th className="sc-th">6s</th>
            <th className="sc-th">SR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, status, isStriker }, i) => (
            <tr key={player.id || i} className={`sc-row ${status}`}>
              <td className="sc-td name-col">
                <div className="sc-batter-name">
                  {isStriker && <span className="striker-dot" />}
                  {player.name}
                </div>
                {status === "out" && player.batting.dismissal && (
                  <div className="sc-dismissal">
                    {player.batting.dismissal}
                    {player.batting.dismissedBy &&
                      ` b ${player.batting.dismissedBy}`}
                    {player.batting.fielder && ` (${player.batting.fielder})`}
                  </div>
                )}
                {status === "batting" && (
                  <div className="sc-dismissal">
                    {isStriker ? "★ batting" : "not out"}
                  </div>
                )}
                {status === "retired" && (
                  <div className="sc-dismissal">retired</div>
                )}
              </td>
              <td className="sc-td bold">{player.batting.runs}</td>
              <td className="sc-td">{player.batting.balls}</td>
              <td className="sc-td">{player.batting.fours}</td>
              <td className="sc-td">{player.batting.sixes}</td>
              <td className="sc-td">
                {getStrikeRate(player.batting.runs, player.batting.balls)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sc-extras-row">
        <span>Extras</span>
        <span className="sc-extras-detail">
          {totalExtras} (wd {extras.wides}, nb {extras.noBalls}, lb{" "}
          {extras.legByes}, b {extras.byes})
        </span>
        <span className="sc-extras-val">{totalExtras}</span>
      </div>

      {inn.fallOfWickets.length > 0 && (
        <div className="sc-fow">
          <div className="sc-fow-label">Fall of Wickets</div>
          <div className="sc-fow-list">
            {inn.fallOfWickets.map((fow, i) => (
              <span key={i} className="sc-fow-item">
                {fow.runs}/{fow.wicket} ({fow.batter}, {getOversStr(fow.over)}{" "}
                ov)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BowlingCard({ inn }) {
  // Collect all bowlers who have bowled - from over history + current
  const bowlerMap = {};

  inn.overHistory.forEach((over) => {
    if (!over.bowler) return;
    if (!bowlerMap[over.bowler])
      bowlerMap[over.bowler] = {
        name: over.bowler,
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        maidens: 0,
      };
    const runThisOver = over.balls.reduce((s, b) => s + b.runs, 0);
    const wicketsThisOver = over.balls.filter((b) => b.wicket).length;
    const widesThisOver = over.balls.filter((b) => b.type === "wide").length;
    const nbThisOver = over.balls.filter((b) => b.type === "noBall").length;
    bowlerMap[over.bowler].runs += runThisOver;
    bowlerMap[over.bowler].wickets += wicketsThisOver;
    bowlerMap[over.bowler].wides += widesThisOver;
    bowlerMap[over.bowler].noBalls += nbThisOver;
    bowlerMap[over.bowler].overs++;
    if (runThisOver === 0) bowlerMap[over.bowler].maidens++;
  });

  // current bowler in progress
  if (inn.currentBowler && inn.currentOverBalls.length > 0) {
    const cb = inn.currentBowler;
    if (!bowlerMap[cb.name])
      bowlerMap[cb.name] = {
        name: cb.name,
        overs: 0,
        balls: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        maidens: 0,
      };
    const runThisPartial = inn.currentOverBalls.reduce((s, b) => s + b.runs, 0);
    const wicketsPartial = inn.currentOverBalls.filter((b) => b.wicket).length;
    const legalBalls = inn.currentOverBalls.filter(
      (b) => b.type !== "wide" && b.type !== "noBall",
    ).length;
    bowlerMap[cb.name].runs += runThisPartial;
    bowlerMap[cb.name].wickets += wicketsPartial;
    bowlerMap[cb.name].balls += legalBalls;
  }

  const bowlers = Object.values(bowlerMap);

  return (
    <div className="scorecard-section">
      <div className="sc-team-header">
        <span className="sc-team-name">{inn.bowlingTeamName}</span>
        <span className="sc-team-sub">Bowling</span>
      </div>

      <table className="sc-table">
        <thead>
          <tr>
            <th className="sc-th name-col">Bowler</th>
            <th className="sc-th">O</th>
            <th className="sc-th">M</th>
            <th className="sc-th">R</th>
            <th className="sc-th">W</th>
            <th className="sc-th">Econ</th>
          </tr>
        </thead>
        <tbody>
          {bowlers.map((b, i) => {
            const isCurrentBowler = inn.currentBowler?.name === b.name;
            return (
              <tr
                key={i}
                className={`sc-row${isCurrentBowler ? " current-bowler" : ""}`}
              >
                <td className="sc-td name-col">
                  <div className="sc-batter-name">
                    {isCurrentBowler && <span className="bowl-dot" />}
                    {b.name}
                  </div>
                </td>
                <td className="sc-td">
                  {b.overs}
                  {b.balls > 0 ? `.${b.balls}` : ""}
                </td>
                <td className="sc-td">{b.maidens}</td>
                <td className="sc-td">{b.runs}</td>
                <td className="sc-td bold">{b.wickets}</td>
                <td className="sc-td">
                  {getBowlingEconomy(b.runs, b.balls + b.overs * 6)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ScoreCard({ inn }) {
  return (
    <div className="scorecard">
      <BattingCard inn={inn} />
      <BowlingCard inn={inn} />

      {/* Partnership */}
      <div className="scorecard-section">
        <div className="sc-team-header">
          <span className="sc-team-name">Current Partnership</span>
        </div>
        <div className="partnership-row">
          <div className="partnership-stat">
            <div className="pstat-val">{inn.currentPartnership?.runs || 0}</div>
            <div className="pstat-label">Runs</div>
          </div>
          <div className="partnership-stat">
            <div className="pstat-val">
              {inn.currentPartnership?.balls || 0}
            </div>
            <div className="pstat-label">Balls</div>
          </div>
          <div className="partnership-stat">
            <div className="pstat-val">
              {inn.currentPartnership?.balls > 0
                ? (
                    (inn.currentPartnership.runs /
                      inn.currentPartnership.balls) *
                    6
                  ).toFixed(1)
                : "-"}
            </div>
            <div className="pstat-label">Run Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
