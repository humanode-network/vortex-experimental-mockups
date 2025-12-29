/// <reference types="@rsbuild/core/types" />

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

import "./styles/global.css";
import "./styles/base.css";
import { initTheme } from "./lib/theme";

initTheme("sky");

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
