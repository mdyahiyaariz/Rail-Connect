import { useContext, useState } from "react";
import { GlobalContext } from "../GlobalContext";
import styles from "./Header.module.css";
import { Link } from "react-router-dom";
import { LuLogOut } from "react-icons/lu";
import Popup from "./PopUp";
import { AutoRedirect } from "./AutoRedirect";
import { TbTicket } from "react-icons/tb";
import { MdAdminPanelSettings, MdTrain } from "react-icons/md";

const Header = () => {
    <AutoRedirect />;
    const { state, dispatch } = useContext(GlobalContext);
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopUpContent] = useState(null);
    const [redirectTo, setRedirectTo] = useState(false);

    const handleLogout = () => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/logout", {
            method: "POST",
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    console.log(data.message);
                    setPopUpContent(
                        <div>
                            <strong className={styles.success}>
                                {data.message}
                            </strong>
                            <p>Click Redirect to go to Login page</p>
                        </div>
                    );
                    setRedirectTo("/login");
                    setIsOpen(true);
                } else {
                    console.error("ERROR : ", data.message);
                }
            })
            .catch(() => {
                setPopUpContent("Some error occured");
                setIsOpen(true);
            });
    };

    return (
        <div className={styles.header}>
            <Link to="/" className={styles.appName}>
                <MdTrain className={styles.logo} />
                <h1 className={styles.title}>RailConnect</h1>
            </Link>
            <div className={styles.buttons}>
                {!state.user ? (
                    <>
                        <Link to="/login" className={styles.button}>
                            <p>Login</p>
                        </Link>
                        <Link to="/signup" className={styles.button}>
                            <p>Sign Up</p>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/home" className={styles.button}>
                            <TbTicket />
                            <p>Trains</p>
                        </Link>
                        <Link to="/my-bookings" className={styles.button}>
                            <TbTicket />
                            <p>My Bookings</p>
                        </Link>
                        {state.user.role === "admin" && (
                            <Link to="/admin" className={styles.button}>
                                <MdAdminPanelSettings />
                                <p>Admin</p>
                            </Link>
                        )}
                        <Link to="/profile" className={styles.button}>
                            <p>Profile</p>
                        </Link>
                        <a className={styles.button} onClick={handleLogout}>
                            <LuLogOut />
                        </a>
                    </>
                )}
                <Link to="/">
                    <img src="/backtrack.png" alt="Home page button" />
                </Link>
            </div>
            <Popup
                isOpen={isOpen}
                onClose={() => {
                    setRedirectTo(false);
                    setIsOpen(false);
                    dispatch({ type: "REMOVE_USER" });
                }}
                title="ALERT"
                redirectTo={redirectTo}
            >
                {popupContent}
            </Popup>
        </div>
    );
};

export default Header;
