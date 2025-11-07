import React from "react";
import { Route, Routes } from "react-router-dom";
import ArticlesListPage from "../pages/ArticlesListPage";
import ArticleDetailsPage from "../pages/ArticleDetailsPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import ArticleCreatePage from "../pages/ArticleCreatePage";
import ArticleEditPage from "../pages/ArticleEditPage";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<ArticlesListPage />} />
        <Route path="/articles/create" element={<ProtectedRoute><ArticleCreatePage /></ProtectedRoute>} />
        <Route path="/articles/:id" element={<ArticleDetailsPage />} />
        <Route path="/articles/:id/edit" element={<ProtectedRoute><ArticleEditPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/me" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    </Routes>
);

export default AppRoutes;
