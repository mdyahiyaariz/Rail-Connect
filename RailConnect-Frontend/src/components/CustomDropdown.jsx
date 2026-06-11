import { useState, useRef, useEffect } from "react";
import styles from "./CustomDropdown.module.css";

export default function CustomDropdown({
    content1 = [],
    content2 = [],
    selectedLocation,
    setSelectedLocation,
    type,
    save,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const allOptions = [...content1, ...content2];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            )
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = allOptions.find((opt) =>
        type === "Location"
            ? opt._id === selectedLocation
            : opt.name === selectedLocation
    );

    return (
        <div ref={dropdownRef} className={styles.dropdownWrapper}>
            <div
                className={`${styles.dropdownHeader} ${
                    isOpen ? styles.open : ""
                }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption
                    ? `${selectedOption.name} ${
                          selectedOption.code ? `(${selectedOption.code})` : ""
                      }`
                    : `-- Select ${type} --`}
                <span
                    className={`${styles.arrow} ${
                        isOpen ? styles.up : styles.down
                    }`}
                >
                    ▾
                </span>
            </div>

            {isOpen && (
                <div className={styles.dropdownList}>
                    {allOptions.map((loc) => (
                        <div
                            key={loc._id}
                            className={`${styles.dropdownItem} ${
                                selectedLocation === loc._id
                                    ? styles.selected
                                    : ""
                            }`}
                            onClick={() => {
                                setSelectedLocation(loc[`${save}`]);
                                setIsOpen(false);
                            }}
                        >
                            {loc.name} {loc.code ? `(${loc.code})` : ""}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
