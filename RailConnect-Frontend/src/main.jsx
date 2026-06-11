// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import { GlobalProvider } from "./GlobalContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Profile from "./pages/Profile.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import UpdateProfile from "./pages/UpdateProfile.jsx";
import Home from "./pages/Home.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Intro from "./pages/Intro.jsx";
import Admin from "./pages/Admin.jsx";

//! Creating router for our chat application
const routerMine = createBrowserRouter([
    {
        path: "/",
        element: <App />, // App is the layout
        children: [
            {
                index: true,
                element: (
                    <ProtectedRoute isProtected={false} home={true}>
                        <Intro />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/home",
                element: (
                    <ProtectedRoute isProtected={false} home={true}>
                        <Home />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/signup",
                element: (
                    <ProtectedRoute isProtected={false}>
                        <Register />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/login",
                element: (
                    <ProtectedRoute isProtected={false}>
                        <Login />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/profile",
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/change-password",
                element: (
                    <ProtectedRoute>
                        <ChangePassword />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/update-profile",
                element: (
                    <ProtectedRoute>
                        <UpdateProfile />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/my-bookings",
                element: (
                    <ProtectedRoute>
                        <MyBookings />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/admin",
                element: (
                    <ProtectedRoute role="admin">
                        <Admin />
                    </ProtectedRoute>
                ),
            },
        ],
    },
]);

createRoot(document.getElementById("root")).render(
    // <StrictMode>
    <GlobalProvider>
        <RouterProvider router={routerMine} />
    </GlobalProvider>
    // </StrictMode>
);
