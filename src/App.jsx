// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import PrivateRoute from "./components/Auth/PrivateRoute";
import LandingPage from "./pages/LandingPage";
import Profile from "./pages/Profile";

export default function App() {
  const isAuth = Boolean(localStorage.getItem("token"));

  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Auth */}
      <Route path="/register" element={!isAuth ? <Register /> : <Navigate to="/home" replace />} />
      <Route path="/login" element={!isAuth ? <Login /> : <Navigate to="/home" replace />} />

      {/* Protected */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/chat/:chatId"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />
      <Route
  path="/profile"
  element={
    <PrivateRoute>
      <Profile />
    </PrivateRoute>
  }
/>


      {/* Catch‐all */}
      <Route
        path="*"
        element={<Navigate to={isAuth ? "/home" : "/"} replace />}
      />
    </Routes>
  );
}
