import React from "react";
import SmartDunebugger from "./components/dunebugger";
import { TranslationProvider } from "./contexts/TranslationContext";

function App() {
  return (
    <TranslationProvider>
      <div className="App">
        {/* <h1>Smart Dunebugger</h1> */}
        <SmartDunebugger />
      </div>
    </TranslationProvider>
  );
}

export default App;
