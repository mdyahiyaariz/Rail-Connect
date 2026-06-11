import { useContext, useState } from "react";
import styles from "./Auth.module.css";
import { GlobalContext } from "../GlobalContext";
import Popup from "../components/PopUp";
import { AutoRedirect } from "../components/AutoRedirect";

const Login = () => {
    const { state, dispatch } = useContext(GlobalContext);
    const [redirectTo, setRedirectTo] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopUpContent] = useState(null);
    const [userData, setUserData] = useState(null);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [formValidity, setFormValidity] = useState({
        email: false,
        password: false,
    });

    const validators = {
        email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        password: (v) => /^.{5,}$/.test(v),
    };

    const errorMessages = {
        email: "Invalid email address",
        password: "Min 5 chars",
    };

    const handleChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);

        // Update validity
        setFormValidity((prev) => ({
            ...prev,
            [field]: validators[field](value),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const allValid = Object.keys(validators).every((field) =>
            validators[field](formData[field])
        );
        if (!allValid) {
            setPopUpContent(
                <div>
                    <strong className={styles.fail}>Validation Failed</strong>
                    <p>Please fill all fields correctly.</p>
                </div>
            );
            setIsOpen(true);
            return;
        }

        fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/login", {
            method: "POST",
            credentials: "include", // cookies will be sent automatically
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setUserData(data.user);
                    setPopUpContent(
                        <div>
                            <strong className={styles.success}>
                                Login Successful
                            </strong>
                            <p>Click Redirect to go to Home Page</p>
                        </div>
                    );
                    setRedirectTo("/");
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

    const fieldName = (field) => field.charAt(0).toUpperCase() + field.slice(1);

    return (
        <div className={styles.wrapper}>
            <AutoRedirect />
            <div className={styles.left}>
                <img src="/login.jpg" alt="auth" className={styles.image} />
            </div>
            <div className={styles.right}>
                <div
                    className={styles.container}
                    style={{ justifyContent: "center" }}
                >
                    <h2 className={styles["gradient-text"]}>Login</h2>
                    <label className={styles.instruction}>Both users and admins can login.</label>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        {["email", "password"].map((field) => (
                            <div className={styles.formField} key={field}>
                                <label className={styles.label}>
                                    {fieldName(field)}
                                </label>
                                <input
                                    type={
                                        field.includes("password")
                                            ? "password"
                                            : "text"
                                    }
                                    placeholder={`Enter your ${fieldName(
                                        field
                                    )}`}
                                    value={formData[field]}
                                    onChange={(e) =>
                                        handleChange(field, e.target.value)
                                    }
                                    className={`${styles.input} ${
                                        formData[field].length === 0
                                            ? ""
                                            : formValidity[field]
                                            ? styles.valid
                                            : styles.invalid
                                    }`}
                                    autoComplete={
                                        field === "name"
                                            ? "name"
                                            : field === "email"
                                            ? "email"
                                            : field.includes("assword")
                                            ? "new-password"
                                            : "tel"
                                    }
                                />
                                {formData[field].length > 0 &&
                                    !formValidity[field] && (
                                        <span className={styles.errorMsg}>
                                            {errorMessages[field]}
                                        </span>
                                    )}
                            </div>
                        ))}

                        <button type="submit" className={styles.button}>
                            Login
                        </button>
                    </form>
                    <Popup
                        isOpen={isOpen}
                        onClose={() => {
                            setRedirectTo(false);
                            setIsOpen(false);
                            dispatch({ type: "SET_USER", payload: userData });
                        }}
                        title="ALERT"
                        redirectTo={redirectTo}
                    >
                        {popupContent}
                    </Popup>
                </div>
            </div>
        </div>
    );
};

export default Login;
