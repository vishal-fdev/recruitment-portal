import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Grommet } from "grommet";
import App from "./App";
import appTheme from "./theme/hpeTheme";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Grommet full theme={appTheme} themeMode="light">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Grommet>
  </React.StrictMode>
);
