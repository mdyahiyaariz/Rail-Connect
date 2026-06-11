import { useState } from "react";
import styles from "./Auth.module.css";
import Popup from "../components/PopUp";
import { AutoRedirect } from "../components/AutoRedirect";

const Register = () => {
    const [redirectTo, setRedirectTo] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopUpContent] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
    });

    const [formValidity, setFormValidity] = useState({
        name: false,
        email: false,
        password: false,
        confirmPassword: false,
        phone: false,
    });

    const validators = {
        name: (v) => v.trim().length >= 2,
        email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        password: (v) => /^.{5,}$/.test(v),
        confirmPassword: (v, updated = null) => {
            if (updated) {
                return (
                    validators.password(updated.password) &&
                    v === updated.password &&
                    v.length > 0
                );
            }
            return (
                validators.password(formData.password) &&
                v === formData.password &&
                v.length > 0
            );
        },
        phone: (v) => /^\d{10}$/.test(v),
    };

    const errorMessages = {
        name: "Name must be at least 2 characters",
        email: "Invalid email address",
        password: "Min 5 chars",
        confirmPassword: "Passwords do not match",
        phone: "Phone must be 10 digits",
    };

    const handleChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);

        // Update validity
        if (field === "role") return;
        setFormValidity((prev) => ({
            ...prev,
            [field]: validators[field](value),
            confirmPassword:
                field === "password" || field === "confirmPassword"
                    ? validators.confirmPassword(
                          updated.confirmPassword,
                          updated
                      )
                    : updated.confirmPassword,
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

        const dataToSend = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
        };

        fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/register", {
            method: "POST",
            credentials: "include", // cookies will be sent automatically
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSend),
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

    const fieldName = (field) =>
        field === "confirmPassword"
            ? "Confirm Password"
            : field.charAt(0).toUpperCase() + field.slice(1);

    // Redirect after success
    // if (redirect) return <Navigate to="/login" replace />;

    return (
        <div className={styles.wrapper}>
            <AutoRedirect />
            <div className={styles.left}>
                <img src="/register.png" alt="auth" className={styles.image} />
            </div>
            <div className={styles.right}>
                <div className={styles.container}>
                    <h2 className={styles["gradient-text"]}>
                        Create an Account
                    </h2>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        {[
                            "name",
                            "email",
                            "password",
                            "confirmPassword",
                            "phone",
                        ].map((field) => (
                            <div className={styles.formField} key={field}>
                                <label className={styles.label}>
                                    {fieldName(field)}
                                </label>
                                <input
                                    type={
                                        field.includes("assword")
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

                        <div className={styles.formField}>
                            <label className={styles.label}>Role</label>
                            <input
                                type="text"
                                value="User"
                                className={`${styles.input}`}
                                disabled
                            />
                        </div>

                        <button type="submit" className={styles.button}>
                            Register
                        </button>
                    </form>
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
            </div>
        </div>
    );
};

export default Register;
