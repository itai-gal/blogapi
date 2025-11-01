import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form.username.trim(), form.password);
            nav("/");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel" style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
            <h2 className="title" style={{ marginBottom: 16 }}>Login</h2>
            <form onSubmit={onSubmit} className="stack" style={{ gap: 12 }}>
                <input
                    className="input"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                />
                <input
                    className="input"
                    placeholder="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <button className="btn primary" disabled={loading}>
                    {loading ? "..." : "Login"}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
