import React, { useLayoutEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function ReadyApp() {
  useLayoutEffect(() => {
    document.getElementById("root")?.removeAttribute("data-prerendered");
    document.documentElement.classList.remove("app-starting");
  }, []);
  return <App />;
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <ReadyApp />
  </React.StrictMode>,
);
