
// src/components/Auth/PrivateRoute.jsx
import { useContext } from "react";
import { AuthContext } from "../../authContext/AuthContext";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const { token } = useContext(AuthContext);

  // If no token, send to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Otherwise render the children (protected page)
  return children;
}
