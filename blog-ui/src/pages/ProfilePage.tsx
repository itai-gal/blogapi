import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
    const { user, refreshMe } = useAuth();
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        // if no user, try to refreshMe (in case there's a token in localStorage)
        if (!user) {
            setLoading(true);
            // trying to refresh (if there's a token in localStorage)
            refreshMe()
                .catch(() => {
                    toast.error("You must be logged in");
                    nav("/login");
                })
                .finally(() => setLoading(false));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    if (loading) {
        return (
            <div className="panel" style={{ padding: 24 }}>
                <div className="badge">Loading…</div>
            </div>
        );
    }

    if (!user) {
        return null; // there's nav to /login in useEffect
    }

    return (
        <div className="panel" style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
            <h2 className="title" style={{ marginBottom: 12 }}>My Profile</h2>
            <div className="stack" style={{ gap: 8 }}>
                <div><b>Username:</b> {user.username}</div>
                {user.email ? <div><b>Email:</b> {user.email}</div> : null}
            </div>
        </div>
    );
};

export default ProfilePage;
