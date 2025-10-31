import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const nav = useNavigate();
    const [username, setU] = useState("");
    const [password, setP] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) return toast.error("Please fill all fields");
        setLoading(true);
        try {
            await login(username.trim(), password);
            toast.success("Welcome back!");
            nav("/");
        } catch (e: any) {
            toast.error("Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid">
            <div className="panel stack" style={{ maxWidth: 480, margin: "40px auto" }}>
                <h2 className="title">Login</h2>
                <form onSubmit={onSubmit} className="stack">
                    <input className="input" placeholder="Username" value={username} onChange={e => setU(e.target.value)} />
                    <input className="input" placeholder="Password" type="password" value={password} onChange={e => setP(e.target.value)} />
                    <div className="row">
                        <button className="btn" type="submit" disabled={loading}>{loading ? "..." : "Login"}</button>
                        <Link className="link" to="/register">Create account</Link>
                    </div>
                </form>
                <p className="muted">Tip: Press <span className="kbd">Enter</span> to submit</p>
            </div>
        </div>
    );
};

export default LoginPage;
