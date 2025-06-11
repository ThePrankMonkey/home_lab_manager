import "./App.css";
import ServiceImageButtonFactory from "./components/ServiceImageButtonFactory";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <ServiceImageButtonFactory action={"restart"} />
      </header>
    </div>
  );
}

export default App;
