import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const loc = useLocation();
    if (!user) {
        return <Navigate to="/login" replace state={{ from: loc }} />;
    }
    return <>{children}</>;
};

export default RequireAuth;
