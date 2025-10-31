import React, { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { ENDPOINTS } from "../services/endpoints";
import ProtectedRoute from "../components/ProtectedRoute";

const Inner: React.FC = () => {
    const [data, setData] = useState<any>(null);
    useEffect(() => { (async () => setData(await apiFetch(ENDPOINTS.me)))(); }, []);
    if (!data) return null;
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

const ProfilePage = () => (
    <ProtectedRoute>
        <div style={{ maxWidth: 720, margin: "20px auto" }}>
            <h2>My Profile</h2>
            <Inner />
        </div>
    </ProtectedRoute>
);

export default ProfilePage;
