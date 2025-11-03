import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const MIN_USERNAME = 2;
const MIN_PASSWORD = 6;

const RegisterPage: React.FC = () => {
    const { register } = useAuth();
    const nav = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    const isValid = useMemo(() => {
        return (
            form.username.trim().length >= MIN_USERNAME &&
            form.password.length >= MIN_PASSWORD
        );
    }, [form.username, form.password]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) {
            toast.error(
                `Username ≥ ${MIN_USERNAME} chars and password ≥ ${MIN_PASSWORD} chars`
            );
            return;
        }

        setLoading(true);
        try {
            const email =
                form.email && form.email.trim() !== "" ? form.email.trim() : undefined;

            await register(form.username.trim(), form.password, email);
            toast.success("Account created! You're logged in");
            nav("/");
        } catch (err: any) {
            const msg =
                err?.detail ||
                err?.message ||
                "Registration failed. Please try again.";
            toast.error(String(msg));
            console.error("register error:", err);
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
                    autoComplete="username"
                    required
                    minLength={MIN_USERNAME}
                />

                <input
                    className="input"
                    placeholder="Email (optional)"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                />

                <input
                    className="input"
                    placeholder="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD}
                />

                <button className="btn primary" disabled={loading || !isValid}>
                    {loading ? "..." : "Create account"}
                </button>
            </form>
        </div>
    );
};

export default RegisterPage;