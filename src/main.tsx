import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

document.documentElement.lang = "ar";
document.documentElement.dir = "rtl";
document.documentElement.classList.add("dark");

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found in index.html");
}

createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
