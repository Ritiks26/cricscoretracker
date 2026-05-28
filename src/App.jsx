import { MatchProvider, useMatch } from "./context/MatchContext";
import Setup from "./pages/Setup";
import Toss from "./pages/Toss";
import SelectOpeners from "./pages/SelectOpeners";
import Scorer from "./pages/Scorer";
import Result from "./pages/Result";
import "./App.css";

function AppRouter() {
  window.onerror = (msg, src, line) => alert("ERR: " + msg + " | L:" + line);
  const { state } = useMatch();
  const { phase } = state;

  switch (phase) {
    case "setup":
      return <Setup />;
    case "toss":
      return <Toss />;
    case "select_openers":
      return <SelectOpeners />;
    case "live":
    case "wicket_new_batter":
    case "over_end":
      return <Scorer />;
    case "innings_break":
    case "result":
      return <Result />;
    default:
      return <Setup />;
  }
}

export default function App() {
  return (
    <MatchProvider>
      <AppRouter />
    </MatchProvider>
  );
}
