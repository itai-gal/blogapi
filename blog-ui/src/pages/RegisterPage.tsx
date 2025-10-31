import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const RegisterPage: React.FC = () => {
    const { register } = useAuth();
    const nav = useNavigate();
    const [username, setU] = useState("");
    const [email, setE] = useState("");
    const [password, setP] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) return toast.error("Username & Password are required");
        setLoading(true);
        try {
            await register(username.trim(), password, email.trim() || undefined);
            toast.success("Account created");
            nav("/");
        } catch (e: any) {
            toast.error("Register failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid">
            <div className="panel stack" style={{ maxWidth: 480, margin: "40px auto" }}>
                <h2 className="title">Register</h2>
                <form onSubmit={onSubmit} className="stack">
                    <input className="input" placeholder="Username" value={username} onChange={e => setU(e.target.value)} />
                    <input className="input" placeholder="Email (optional)" value={email} onChange={e => setE(e.target.value)} />
                    <input className="input" placeholder="Password" type="password" value={password} onChange={e => setP(e.target.value)} />
                    <div className="row">
                        <button className="btn" type="submit" disabled={loading}>{loading ? "..." : "Create account"}</button>
                        <Link className="link" to="/login">I have an account</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
