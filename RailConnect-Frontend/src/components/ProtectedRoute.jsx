import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";

export default function ProtectedRoute({
    children,
    isProtected = true,
    role = "user",
    home = false
}) {
    const { state, dispatch } = useContext(GlobalContext);

    useEffect(() => {
        if (!state.user) {
            dispatch({ type: "LOADING_USER" });

            fetch(import.meta.env.VITE_BACKEND_URL + "/api/user/profile", {
                method: "GET",
                credentials: "include",
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        console.log(data.profile);
                        dispatch({ type: "SET_USER", payload: data.profile });
                    } else {
                        console.log(data.message);
                        dispatch({ type: "REMOVE_USER" });
                    }
                })
                .catch(() => dispatch({ type: "REMOVE_USER" }));
        }
    }, []);

    if (state.loading) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "1.2rem",
                    color: "#555",
                }}
            >
                <div className="loader"></div>
                <p style={{ marginTop: "12px" }}>Checking authentication...</p>
            </div>
        );
    }

    if (isProtected && !state.user && state.autoRedirect) {
        return <Navigate to="/login" replace />;
    }

    if (!isProtected && home) {
        return children;
    }

    if (!isProtected && state.user && state.autoRedirect) {
        return <Navigate to="/profile" replace />;
    }

    if (role === "admin" && state.user.role !== "admin") {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "2rem",
                    color: "#555",
                }}
            >
                <p style={{ marginTop: "12px" }}>
                    Unauthorized: Only for admins
                </p>
            </div>
        );
    }

    return children;
}
