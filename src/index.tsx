import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./base.css";

const rootEl = document.getElementById("root");
if (rootEl === null) {
  throw new Error("no root");
}

const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
