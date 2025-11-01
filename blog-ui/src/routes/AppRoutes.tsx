import React from "react";
import { Route, Routes } from "react-router-dom";
import ArticlesListPage from "../pages/ArticlesListPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import ArticleDetailsPage from "../pages/ArticleDetailsPage";
import ArticleCreatePage from "../pages/ArticleCreatePage";

const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<ArticlesListPage />} />
        <Route path="/articles/:id" element={<ArticleDetailsPage />} />
        <Route path="/articles/new" element={<ArticleCreatePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/me" element={<ProfilePage />} />
    </Routes>
);

export default AppRoutes;
