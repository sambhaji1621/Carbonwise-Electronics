import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("jwtToken");
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    if (!token) {
      setAuthorized(false);
      return;
    }

    const checkRoleMatch = (role) => {
      if (!role) return false;
      return allowedRoles.some((allowed) => {
        const cleanAllowed = allowed.replace(/^ROLE_/, "").toUpperCase();
        const cleanRole = role.replace(/^ROLE_/, "").toUpperCase();
        return (
          allowed === role ||
          cleanAllowed === cleanRole ||
          `ROLE_${cleanAllowed}` === role ||
          allowed === `ROLE_${cleanRole}`
        );
      });
    };

    // 1. Fast check from JWT payload if available
    try {
      const payloadBase64 = token.split(".")[1];
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64));
        if (payload && payload.role && checkRoleMatch(payload.role)) {
          setAuthorized(true);
          return;
        }
      }
    } catch (err) {
      // fallback to backend check
    }

    // 2. Always verify via backend /users/me
    api
      .get("/users/me")
      .then((res) => {
        if (res.data && checkRoleMatch(res.data.role)) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      })
      .catch(() => {
        setAuthorized(false);
      });
  }, [token, allowedRoles]);

  if (authorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-carbon-primary font-bold animate-pulse">
          Verifying authorization...
        </p>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}
