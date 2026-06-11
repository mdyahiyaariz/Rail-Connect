import { useState } from "react";
import styles from "./Auth.module.css";
import styles_prof from "./Profile.module.css";
import Popup from "../components/PopUp";
import { AutoRedirect } from "../components/AutoRedirect";

const UpdateProfile = () => {
    const [redirectTo, setRedirectTo] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopUpContent] = useState(null);

    const [updateData, setUpdateData] = useState({
        name: "",
        phoneNumber: "",
    });

    const [formValidity, setFormValidity] = useState({
        name: false,
        phoneNumber: false,
    });

    const validators = {
        name: (v) => v.trim().length >= 2,
        phoneNumber: (v) => /^\d{10}$/.test(v),
    };

    const errorMessages = {
        name: "Name must be at least 2 characters",
        phoneNumber: "Phone must be 10 digits",
    };

    const handleChange = (field, value) => {
        const updated = { ...updateData, [field]: value };
        setUpdateData(updated);

        // Update validity
        setFormValidity((prev) => ({
            ...prev,
            [field]: validators[field](value),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let allEmpty = 1;
        const allValid = Object.keys(validators).every((field) => {
            if (updateData[field].trim().length === 0) {
                return true;
            }
            allEmpty = 0;
            return validators[field](updateData[field]);
        });
        if (!allValid || allEmpty) {
            setPopUpContent(
                <div>
                    <strong className={styles.fail}>Validation Failed</strong>
                    {allEmpty ? (
                        <p>Nothing to update</p>
                    ) : (
                        <p>Please fill data correctly</p>
                    )}
                </div>
            );
            setIsOpen(true);
            return;
        }

        fetch(import.meta.env.VITE_BACKEND_URL + "/api/user/profile", {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: updateData.name,
                phone: updateData.phoneNumber,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    console.log("Profile Updated");
                    setPopUpContent(
                        <div>
                            <strong className={styles.success}>
                                Profile Updated
                            </strong>
                        </div>
                    );
                    setRedirectTo("/profile");
                    setIsOpen(true);
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
    };

    const fieldName = (field) => {
        switch (field) {
            case "name":
                return "Name";
            case "phoneNumber":
                return "Phone Number";
            default:
                break;
        }
    };
    return (
        <div className={styles.wrapper}>
            <AutoRedirect />
            <div className={styles.left}>
                <img src="/login.jpg" alt="auth" className={styles.image} />
            </div>
            <div className={styles.right}>
                <div className={styles.container}>
                    <h2 className={styles["gradient-text"]}>Update Profile</h2>
                    <form className={styles.form}>
                        {["name", "phoneNumber"].map((field) => (
                            <div className={styles.formField} key={field}>
                                <label className={styles.label}>
                                    {fieldName(field)} [Optional]
                                </label>
                                <input
                                    type="text"
                                    placeholder={`Enter your ${fieldName(
                                        field
                                    )}`}
                                    value={updateData[field]}
                                    onChange={(e) =>
                                        handleChange(field, e.target.value)
                                    }
                                    className={`${styles.input} ${
                                        updateData[field].length === 0
                                            ? ""
                                            : formValidity[field]
                                            ? styles.valid
                                            : styles.invalid
                                    }`}
                                />
                                {updateData[field].length > 0 &&
                                    !formValidity[field] && (
                                        <span className={styles.errorMsg}>
                                            {errorMessages[field]}
                                        </span>
                                    )}
                            </div>
                        ))}
                    </form>
                    <div className={styles_prof.actionBtns}>
                        <button
                            className={styles_prof.btnPrimary}
                            onClick={handleSubmit}
                        >
                            Update Profile
                        </button>
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
export default UpdateProfile;
