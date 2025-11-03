import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AuthProvider from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          toastOptions={{
            style: { background: "#151922", color: "#e6e8ee", border: "1px solid #242a3a" }
          }}
          position="top-center"
          reverseOrder={false}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
