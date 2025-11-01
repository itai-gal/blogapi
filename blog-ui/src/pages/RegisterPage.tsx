import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ username: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(form.username.trim(), form.password, form.email.trim() || undefined);
            nav("/");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="panel" style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
            <h2 className="title" style={{ marginBottom: 16 }}>Register</h2>
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
                    placeholder="Email (optional)"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                    {loading ? "..." : "Create account"}
                </button>
            </form>
        </div>
    );
};

export default RegisterPage;