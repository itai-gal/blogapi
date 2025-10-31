import React from "react";
import { Route, Routes } from "react-router-dom";
import ArticlesListPage from "../pages/ArticlesListPage";
import ArticleViewPage from "../pages/ArticleViewPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";

const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<ArticlesListPage />} />
        <Route path="/articles/:id" element={<ArticleViewPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/me" element={<ProfilePage />} />
    </Routes>
);

export default AppRoutes;
