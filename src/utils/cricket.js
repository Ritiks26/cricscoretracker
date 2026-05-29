export const DISMISSAL_TYPES = [
  "Bowled",
  "Caught",
  "LBW",
  "Run Out",
  "Stumped",
  "Hit Wicket",
  "Obstructed Field",
  "Handled Ball",
  "Timed Out",
  "Hit Ball Twice",
];

export function createPlayer(name, role = "batsman") {
  return {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    name,
    role,
    batting: {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dotBalls: 0,
      out: false,
      dismissal: "",
      dismissedBy: "",
      fielder: "",
    },
    bowling: {
      overs: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      maidens: 0,
    },
    fielding: { catches: 0, runOuts: 0, stumpings: 0 },
  };
}

export function createTeam(name, players = []) {
  return { name, players };
}

export function createInningsState(
  battingTeamName,
  bowlingTeamName,
  totalOvers,
  target = null,
) {
  return {
    battingTeamName,
    bowlingTeamName,
    totalOvers,
    target,
    runs: 0,
    wickets: 0,
    balls: 0,
    extras: { wides: 0, noBalls: 0, legByes: 0, byes: 0 },
    striker: null,
    nonStriker: null,
    currentBowler: null,
    currentOverBalls: [],
    overHistory: [],
    fallOfWickets: [],
    currentPartnership: { runs: 0, balls: 0 },
    status: "live",
    isNoBallActive: false,
  };
}

export function getOversStr(balls) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

export function getRunRate(runs, balls) {
  if (balls === 0) return "0.00";
  return ((runs / balls) * 6).toFixed(2);
}

export function getRequiredRate(needed, ballsLeft) {
  if (ballsLeft <= 0) return "∞";
  return ((needed / ballsLeft) * 6).toFixed(2);
}

export function getStrikeRate(runs, balls) {
  if (balls === 0) return "-";
  return ((runs / balls) * 100).toFixed(1);
}

export function getBowlingEconomy(runs, balls) {
  if (balls === 0) return "-";
  const overs = balls / 6;
  return (runs / overs).toFixed(2);
}

export function getBallClass(ball) {
  if (ball.wicket) return "ball-wicket";
  if (ball.type === "wide" || ball.type === "noBall") return "ball-extra";
  if (ball.type === "legBye" || ball.type === "bye") return "ball-bye";
  if (ball.runs === 4) return "ball-four";
  if (ball.runs === 6) return "ball-six";
  if (ball.runs === 0) return "ball-dot";
  return "ball-run";
}

export function getBallLabel(ball) {
  if (ball.wicket) return ball.runs > 0 ? `${ball.runs}W` : "W";
  if (ball.type === "wide") return ball.runs > 1 ? `Wd+${ball.runs - 1}` : "Wd";
  if (ball.type === "noBall")
    return ball.runs > 1 ? `NB+${ball.runs - 1}` : "NB";
  if (ball.type === "legBye") return ball.runs > 0 ? `LB${ball.runs}` : "LB";
  if (ball.type === "bye") return ball.runs > 0 ? `B${ball.runs}` : "B";
  if (ball.runs === 0) return "•";
  return String(ball.runs);
}

export function isLegalDelivery(ball) {
  return ball.type !== "wide" && ball.type !== "noBall";
}

export function isLastManStanding(innings) {
  const battingTeamPlayers = innings.dismissedBatters?.length
    ? innings.dismissedBatters.length + 1
    : innings.wickets + 1;

  const totalPlayers = innings._usedBatters?.length
    ? innings._usedBatters.length +
      (innings.wickets < innings._usedBatters.length ? 1 : 0)
    : 11;

  return innings.wickets === totalPlayers - 1;
}
