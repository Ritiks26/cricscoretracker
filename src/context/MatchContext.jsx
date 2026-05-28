import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { createInningsState, isLegalDelivery } from "../utils/cricket";

const MatchContext = createContext(null);

const initialState = {
  phase: "setup", // setup | toss | select_openers | select_bowler | live | over_end | wicket_new_batter | innings_break | result
  teams: [null, null], // [team0, team1] each: { name, players: [...createPlayer] }
  totalOvers: 20,
  toss: { winner: null, choice: null },
  innings: [null, null],
  activeInnings: 0,
  modal: null,
  undoStack: [],
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function applyDelivery(innings, ball) {
  const s = deepClone(innings);
  const isLegal = isLegalDelivery(ball);

  s.runs += ball.runs;
  if (isLegal) s.balls++;
  s.currentPartnership.runs += ball.runs;
  if (isLegal) s.currentPartnership.balls++;
  s.isNoBallActive = ball.type === "noBall";

  // extras
  if (ball.type === "wide") s.extras.wides += ball.runs;
  else if (ball.type === "noBall") {
    s.extras.noBalls += 1;
  } else if (ball.type === "legBye") s.extras.legByes += ball.runs;
  else if (ball.type === "bye") s.extras.byes += ball.runs;

  // update striker
  if (ball.type !== "wide") {
    const batter = s.striker;
    if (batter) {
      if (ball.type === "normal") {
        batter.batting.runs += ball.runs;
        if (ball.runs === 4) batter.batting.fours++;
        if (ball.runs === 6) batter.batting.sixes++;
        if (ball.runs === 0) batter.batting.dotBalls++;
      }
      if (isLegal) batter.batting.balls++;
    }
  }

  // update bowler
  const bowler = s.currentBowler;
  if (bowler) {
    if (ball.type !== "legBye" && ball.type !== "bye")
      bowler.bowling.runs += ball.runs;
    if (ball.type === "wide") bowler.bowling.wides++;
    if (ball.type === "noBall") bowler.bowling.noBalls++;
    if (isLegal) bowler.bowling.balls++;
  }

  // wicket handling
  if (ball.wicket) {
    s.wickets++;
    if (s.striker) {
      s.striker.batting.out = true;
      s.striker.batting.dismissal = ball.wicket.type;
      s.striker.batting.dismissedBy = ball.wicket.bowler || "";
      s.striker.batting.fielder = ball.wicket.fielder || "";
    }
    if (
      bowler &&
      ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"].includes(
        ball.wicket.type,
      )
    ) {
      bowler.bowling.wickets++;
    }
    // fielding stats
    if (ball.wicket.fielderRef) {
      if (ball.wicket.type === "Caught")
        ball.wicket.fielderRef.fielding.catches++;
      if (ball.wicket.type === "Run Out")
        ball.wicket.fielderRef.fielding.runOuts++;
      if (ball.wicket.type === "Stumped")
        ball.wicket.fielderRef.fielding.stumpings++;
    }
    s.fallOfWickets.push({
      wicket: s.wickets,
      runs: s.runs,
      batter: s.striker?.name || "",
      over: s.balls,
    });
    s.currentPartnership = { runs: 0, balls: 0 };

    if (!s.dismissedBatters) s.dismissedBatters = [];
    s.dismissedBatters.push({ ...s.striker }); // dismissed batter ko save karo
    s.striker = null;
  }

  // odd runs => swap strike (except wide)
  if (ball.type !== "wide" && !ball.wicket) {
    if (ball.runs % 2 === 1) {
      [s.striker, s.nonStriker] = [s.nonStriker, s.striker];
    }
  }

  s.currentOverBalls.push(ball);

  // check end of over (6 legal deliveries)
  const legalInOver = s.currentOverBalls.filter((b) =>
    isLegalDelivery(b),
  ).length;
  if (legalInOver >= 6) {
    // maiden check
    const overRuns = s.currentOverBalls.reduce((acc, b) => acc + b.runs, 0);
    if (overRuns === 0 && bowler) bowler.bowling.maidens++;
    if (bowler) {
      bowler.bowling.overs += 1;
      bowler.bowling.balls = 0;
    }
    s.overHistory.push({
      balls: [...s.currentOverBalls],
      bowler: bowler?.name || "",
      bowlerId: bowler?.id || "",
    });
    s.currentOverBalls = [];
    // end of over: swap strike
    if (!ball.wicket) [s.striker, s.nonStriker] = [s.nonStriker, s.striker];
    s.currentBowler = null;
    return { innings: s, overEnded: true };
  }

  return { innings: s, overEnded: false };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_TEAMS":
      return {
        ...state,
        teams: action.teams,
        totalOvers: action.totalOvers,
        phase: "toss",
      };

    case "SET_TOSS": {
      const { winner, choice } = action;
      // batting team index
      let battingIdx = winner;
      if (choice === "field") battingIdx = winner === 0 ? 1 : 0;
      const bowlingIdx = battingIdx === 0 ? 1 : 0;
      const newState = {
        ...state,
        toss: { winner, choice, battingIdx, bowlingIdx },
        phase: "select_openers",
      };
      // init first innings structure
      newState.innings = [null, null];
      newState.innings[0] = createInningsState(
        state.teams[battingIdx].name,
        state.teams[bowlingIdx].name,
        state.totalOvers,
      );
      newState.innings[0]._battingTeamIdx = battingIdx;
      newState.innings[0]._bowlingTeamIdx = bowlingIdx;
      return newState;
    }

    case "SET_OPENERS": {
      const { strikerId, nonStrikerId, bowlerId } = action;
      const inn = deepClone(state.innings[state.activeInnings]);
      const battingTeam = state.teams[inn._battingTeamIdx];
      const bowlingTeam = state.teams[inn._bowlingTeamIdx];
      inn.striker = deepClone(
        battingTeam.players.find((p) => p.id === strikerId),
      );
      inn.nonStriker = deepClone(
        battingTeam.players.find((p) => p.id === nonStrikerId),
      );
      inn.currentBowler = deepClone(
        bowlingTeam.players.find((p) => p.id === bowlerId),
      );
      // mark used
      inn._usedBatters = [strikerId, nonStrikerId];
      inn._usedBowlers = [];
      const innings = [...state.innings];
      innings[state.activeInnings] = inn;
      return { ...state, innings, phase: "live" };
    }

    case "DELIVER": {
      const prev = deepClone(state.innings[state.activeInnings]);
      const undoStack = [...state.undoStack, prev].slice(-20);
      const { innings: updatedInnings, overEnded } = applyDelivery(
        state.innings[state.activeInnings],
        action.ball,
      );
      const allOvers = updatedInnings.balls >= updatedInnings.totalOvers * 6;
      const allOut = updatedInnings.wickets >= 10;
      const chased =
        updatedInnings.target !== null &&
        updatedInnings.runs > updatedInnings.target;

      let phase = state.phase;
      let modal = state.modal;
      const inningsArr = [...state.innings];
      inningsArr[state.activeInnings] = updatedInnings;

      if (chased) {
        updatedInnings.status = "complete";
        phase = "result";
      } else if (allOut || allOvers) {
        updatedInnings.status = "complete";
        if (state.activeInnings === 0) phase = "innings_break";
        else phase = "result";
      } else if (action.ball.wicket && !updatedInnings.striker) {
        phase = "wicket_new_batter";
      } else if (overEnded) {
        phase = "over_end";
      }

      return { ...state, innings: inningsArr, phase, modal, undoStack };
    }

    case "SET_NEW_BATTER": {
      const { batterId } = action;
      const inn = deepClone(state.innings[state.activeInnings]);
      const battingTeam = state.teams[inn._battingTeamIdx];
      const newBatter = deepClone(
        battingTeam.players.find((p) => p.id === batterId),
      );
      inn.striker = newBatter;
      inn._usedBatters = [...(inn._usedBatters || []), batterId];
      const innings = [...state.innings];
      innings[state.activeInnings] = inn;
      // check if over also ended
      const phase = state.phase === "wicket_new_batter" ? "live" : state.phase;
      return { ...state, innings, phase };
    }

    case "SET_NEW_BOWLER": {
      const { bowlerId } = action;
      const inn = deepClone(state.innings[state.activeInnings]);
      const bowlingTeam = state.teams[inn._bowlingTeamIdx];

      const freshBowler = deepClone(
        bowlingTeam.players.find((p) => p.id === bowlerId),
      );

      // FIX: name se match karo, bowlerId se nahi
      const existingStats = inn.overHistory
        .filter((over) => over.bowler === freshBowler.name)
        .reduce(
          (acc, over) => {
            const overRuns = over.balls.reduce((s, b) => s + b.runs, 0);
            const overWickets = over.balls.filter((b) => b.wicket).length;
            const overWides = over.balls.filter(
              (b) => b.type === "wide",
            ).length;
            const overNBs = over.balls.filter(
              (b) => b.type === "noBall",
            ).length;
            const isMaiden = overRuns === 0;
            return {
              overs: acc.overs + 1,
              balls: 0,
              runs: acc.runs + overRuns,
              wickets: acc.wickets + overWickets,
              wides: acc.wides + overWides,
              noBalls: acc.noBalls + overNBs,
              maidens: acc.maidens + (isMaiden ? 1 : 0),
            };
          },
          {
            overs: 0,
            balls: 0,
            runs: 0,
            wickets: 0,
            wides: 0,
            noBalls: 0,
            maidens: 0,
          },
        );

      freshBowler.bowling = existingStats;

      inn.currentBowler = freshBowler;
      inn._usedBowlers = [...(inn._usedBowlers || []), bowlerId];
      const innings = [...state.innings];
      innings[state.activeInnings] = inn;
      return { ...state, innings, phase: "live" };
    }

    case "START_SECOND_INNINGS": {
      const inn0 = state.innings[0];
      const target = inn0.runs + 1;
      const battingIdx = inn0._bowlingTeamIdx;
      const bowlingIdx = inn0._battingTeamIdx;
      const inn1 = createInningsState(
        state.teams[battingIdx].name,
        state.teams[bowlingIdx].name,
        state.totalOvers,
        target,
      );
      inn1._battingTeamIdx = battingIdx;
      inn1._bowlingTeamIdx = bowlingIdx;
      inn1._usedBatters = [];
      inn1._usedBowlers = [];
      const innings = [state.innings[0], inn1];
      return { ...state, innings, activeInnings: 1, phase: "select_openers" };
    }

    case "UNDO": {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      const undoStack = state.undoStack.slice(0, -1);
      const innings = [...state.innings];
      innings[state.activeInnings] = prev;
      return { ...state, innings, undoStack, phase: "live" };
    }

    case "RESET":
      localStorage.removeItem("cricket_match");
      return { ...initialState };
  }
}

export function MatchProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem("cricket_match");
      return saved ? JSON.parse(saved) : initialState;
    } catch {
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cricket_match", JSON.stringify(state));
    } catch {}
  }, [state]);

  const deliver = useCallback(
    (ball) => dispatch({ type: "DELIVER", ball }),
    [],
  );
  const setTeams = useCallback(
    (teams, totalOvers) => dispatch({ type: "SET_TEAMS", teams, totalOvers }),
    [],
  );
  const setToss = useCallback(
    (winner, choice) => dispatch({ type: "SET_TOSS", winner, choice }),
    [],
  );
  const setOpeners = useCallback(
    (s, ns, b) =>
      dispatch({
        type: "SET_OPENERS",
        strikerId: s,
        nonStrikerId: ns,
        bowlerId: b,
      }),
    [],
  );
  const setNewBatter = useCallback(
    (id) => dispatch({ type: "SET_NEW_BATTER", batterId: id }),
    [],
  );
  const setNewBowler = useCallback(
    (id) => dispatch({ type: "SET_NEW_BOWLER", bowlerId: id }),
    [],
  );
  const startSecondInnings = useCallback(
    () => dispatch({ type: "START_SECOND_INNINGS" }),
    [],
  );
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const currentInnings = state.innings[state.activeInnings];

  return (
    <MatchContext.Provider
      value={{
        state,
        currentInnings,
        deliver,
        setTeams,
        setToss,
        setOpeners,
        setNewBatter,
        setNewBowler,
        startSecondInnings,
        undo,
        reset,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  return useContext(MatchContext);
}
