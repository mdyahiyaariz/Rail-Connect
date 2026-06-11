import { useEffect, useState } from "react";
import styles from "./Auth.module.css";
import styles_prof from "./Profile.module.css";
import Popup from "../components/PopUp";
import { NavLink } from "react-router-dom";
import { AutoRedirect } from "../components/AutoRedirect";

const Profile = () => {
    const [redirectTo, setRedirectTo] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopUpContent] = useState(null);
    const [profile, setProfile] = useState(null);

    // Redirect after success
    // if (redirect) return <Navigate to="/login" replace />;
    useEffect(() => {
        fetch(import.meta.env.VITE_BACKEND_URL + "/api/user/profile", {
            method: "GET",
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    console.log(data.profile);
                    setProfile(data.profile);
                } else {
                    console.error("ERROR : ", data.message);
                    setPopUpContent(
                        <div>
                            <strong className={styles.fail}>
                                {data.message}
                            </strong>
                        </div>
                    );
                    setIsOpen(true);
                }
            })
            .catch((err) => {
                console.error(err);
                setPopUpContent("Some error occured");
                setIsOpen(true);
            });
    }, []);

    return (
        <div className={styles.wrapper}>
            <AutoRedirect />
            <div className={styles.left}>
                <img src="/login.jpg" alt="auth" className={styles.image} />
            </div>
            <div className={styles.right}>
                <div className={styles.container}>
                    <h2 className={styles["gradient-text"]}>Your Profile</h2>
                    {profile && (
                        <table className={styles_prof.profileTable}>
                            <tbody>
                                <tr>
                                    <td>Name</td>
                                    <td>{profile.name}</td>
                                </tr>
                                <tr>
                                    <td>Email</td>
                                    <td>{profile.email}</td>
                                </tr>
                                <tr>
                                    <td>Role</td>
                                    <td>{profile.role}</td>
                                </tr>
                                <tr>
                                    <td>Phone</td>
                                    <td>{profile.phone}</td>
                                </tr>
                                <tr>
                                    <td>Account Created</td>
                                    <td>
                                        {new Date(
                                            profile.created_at
                                        ).toLocaleDateString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                    <div className={styles_prof.actionBtns}>
                        <NavLink to="/update-profile">
                            <button className={styles_prof.btnPrimary}>
                                Update Profile
                            </button>
                        </NavLink>
                        <NavLink to="/change-password">
                            <button className={styles_prof.btnSecondary}>
                                Change Password
                            </button>
                        </NavLink>
                    </div>
                </div>
            </div>
            <Popup
                isOpen={isOpen}
                onClose={() => {
                    setRedirectTo(false);
                    setIsOpen(false);
                }}
                title="ALERT"
                redirectTo={redirectTo}
            >
                {popupContent}
            </Popup>
        </div>
    );
};

export default Profile;
