import React from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "./contexts/AuthContext";
import AppRoutes from "./routes/AppRoutes";

const App: React.FC = () => {
  const { user, logout } = useAuth();

  const onLogout = () => {
    logout();
    toast.success("Logged out");
  };

  return (
    <>
      <Toaster position="top-center" />
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand link">
            Blog<span className="muted">API</span>
          </Link>

          {!user && <Link className="link" to="/login">Login</Link>}
          {!user && <Link className="link" to="/register">Register</Link>}
          {user && <Link className="link" to="/me">My Profile</Link>}
          {user && (
            <button className="btn ghost" onClick={onLogout} aria-label="Logout">
              Logout
            </button>
          )}
        </div>
      </header>

      <div className="container">
        <AppRoutes />
      </div>
    </>);
};

export default App;