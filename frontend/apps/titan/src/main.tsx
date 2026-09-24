import React from "react";
import ReactDOM from "react-dom/client";
import { Root } from "./Root";
import "./global.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Root />);
}
