import { useEffect, useState } from "react";
import { HiOutlineRefresh, HiOutlineTicket } from "react-icons/hi";
import styles from "./MyBookings.module.css";
import Popup from "../components/PopUp";
import { AutoRedirect } from "../components/AutoRedirect";

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState(""); // '', 'CONFIRMED', 'WAITLIST', 'CANCELLED'
    const [waitlist, setWaitlist] = useState({});

    // Popup states
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopupContent] = useState(null);
    const [popupTitle, setPopupTitle] = useState("ALERT");
    const [popupMode, setPopupMode] = useState(null);
    const [confirmOption, setConfirmOption] = useState(false);
    const [selectedPnr, setSelectedPnr] = useState(null);

    // Fetch booking summary
    const fetchSummary = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/user/summary",
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await res.json();
            setSummary(data.summary);

            if (!data.success || res.status >= 400) {
                setError(data.message || "Some error occurred");
            }
        } catch (err) {
            setError(err.message || "Some error occurred");
            console.error("Failed to fetch summary:", err);
        }
    };

    // Fetch bookings
    const fetchBookings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let url = import.meta.env.VITE_BACKEND_URL + "/api/user/bookings";
            if (filter) {
                url += `?status=${filter}`;
            }

            const res = await fetch(url, {
                method: "GET",
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Failed to fetch bookings");
            }

            const data = await res.json();
            setBookings(data);
            setIsLoading(false);
        } catch (err) {
            setIsLoading(false);
            setError(err.message || "Some error occurred");
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchSummary();
    }, [filter]);

    // Cancel booking
    const handleCancelClick = (pnr, trainName) => {
        setSelectedPnr(pnr);
        setPopupTitle("CANCEL BOOKING");
        setPopupMode("cancelConfirm");
        setConfirmOption(true);
        setPopupContent(
            <div>
                <p>Are you sure you want to cancel booking?</p>
                <p>
                    <strong>PNR:</strong> {pnr}
                </p>
                <p>
                    <strong>Train:</strong> {trainName}
                </p>
            </div>
        );
        setIsOpen(true);
    };

    const handleCancelAPI = async (pnr) => {
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/user/cancel",
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pnr }),
                }
            );

            const data = await res.json();

            if (!data.success || res.status >= 400) {
                setPopupMode("failure");
                setConfirmOption(false);
                setPopupContent(
                    <div>
                        <strong className={styles.fail}>
                            {data.message || "Cancellation failed"}
                        </strong>
                    </div>
                );
                return;
            }

            // Success
            setConfirmOption(false);
            setPopupMode("successCancel");
            setPopupContent(
                <div>
                    <strong className={styles.success}>
                        {data.message || "Booking cancelled successfully!"}
                    </strong>
                </div>
            );
        } catch (err) {
            console.error(err);
            setConfirmOption(false);
            setPopupMode("error");
            setPopupContent(
                <div>
                    <strong className={styles.fail}>Some error occurred</strong>
                </div>
            );
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "CONFIRMED":
                return styles.confirmed;
            case "WAITLIST":
                return styles.waitlist;
            case "CANCELLED":
                return styles.cancelled;
            default:
                return "";
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const fetchWaitlist = async (pnr) => {
        setError(null);
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL + `/api/user/waitlist/${pnr}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await res.json();
            if (!data.success) {
                console.log(data.message);
                return;
            }
            setWaitlist((prev) => {
                return { ...prev, [pnr]: data.waitlist_position };
            });
        } catch (err) {
            console.error(err);
            setPopupMode("error");
            setPopupContent(
                <div>
                    <strong className={styles.fail}>Some error occurred</strong>
                </div>
            );
        }
    };

    useEffect(() => {
        for (const booking of bookings) {
            fetchWaitlist(booking.pnr);
        }
        console.log(waitlist);
    }, [bookings]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="loader"></div>
                <p>Fetching Your Bookings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>Error: {error}</p>
                <button onClick={fetchBookings} className={styles.retryButton}>
                    <HiOutlineRefresh />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <AutoRedirect />
            <div className={styles.left}>
                <div className={styles.header}>
                    <h1>
                        <HiOutlineTicket /> My Bookings
                    </h1>
                    <button
                        onClick={fetchBookings}
                        className={styles.refreshButton}
                    >
                        <HiOutlineRefresh />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <h3>Total Bookings</h3>
                            <p className={styles.summaryValue}>
                                {summary.total || 0}
                            </p>
                        </div>
                        <div
                            className={`${styles.summaryCard} ${styles.confirmedCard}`}
                        >
                            <h3>Confirmed</h3>
                            <p className={styles.summaryValue}>
                                {summary.confirmed || 0}
                            </p>
                        </div>
                        <div
                            className={`${styles.summaryCard} ${styles.waitlistCard}`}
                        >
                            <h3>Waitlist</h3>
                            <p className={styles.summaryValue}>
                                {summary.waitlist || 0}
                            </p>
                        </div>
                        <div
                            className={`${styles.summaryCard} ${styles.cancelledCard}`}
                        >
                            <h3>Cancelled</h3>
                            <p className={styles.summaryValue}>
                                {summary.cancelled || 0}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.right}>
                {/* Filter Buttons */}
                <div className={styles.filterBar}>
                    <button
                        className={`${styles.filterButton} ${
                            filter === "" ? styles.active : ""
                        }`}
                        onClick={() => setFilter("")}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterButton} ${
                            filter === "CONFIRMED" ? styles.active : ""
                        }`}
                        onClick={() => setFilter("CONFIRMED")}
                    >
                        Confirmed
                    </button>
                    <button
                        className={`${styles.filterButton} ${
                            filter === "WAITLIST" ? styles.active : ""
                        }`}
                        onClick={() => setFilter("WAITLIST")}
                    >
                        Waitlist
                    </button>
                    <button
                        className={`${styles.filterButton} ${
                            filter === "CANCELLED" ? styles.active : ""
                        }`}
                        onClick={() => setFilter("CANCELLED")}
                    >
                        Cancelled
                    </button>
                </div>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <div className={styles.noBookings}>
                        <HiOutlineTicket size={64} />
                        <p>No bookings found</p>
                        {filter && (
                            <button
                                className={styles.clearFilterButton}
                                onClick={() => setFilter("")}
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.bookingsList}>
                        {bookings.map((booking) => (
                            <div
                                key={booking.pnr}
                                className={styles.bookingCard}
                            >
                                <div className={styles.bookingHeader}>
                                    <div className={styles.pnrSection}>
                                        <span className={styles.pnrLabel}>
                                            PNR
                                        </span>
                                        <span className={styles.pnrValue}>
                                            {booking.pnr}
                                        </span>
                                    </div>
                                    <section className={styles.waitlistStatus}>
                                        <span
                                            className={`${
                                                styles.statusBadge
                                            } ${getStatusClass(
                                                booking.status
                                            )}`}
                                        >
                                            {booking.status}
                                        </span>
                                        {booking.status === "WAITLIST" && (
                                            <span
                                                className={`${styles.statusBadge} ${styles.waitNumber} `}
                                            >
                                                {waitlist[booking.pnr]}
                                            </span>
                                        )}
                                    </section>
                                </div>

                                <div className={styles.bookingBody}>
                                    <div className={styles.trainInfo}>
                                        <h3>{booking.train_name}</h3>
                                        <p className={styles.trainNumber}>
                                            Train No: {booking.train_no}
                                        </p>
                                    </div>

                                    <div className={styles.bookingDetails}>
                                        <div className={styles.detailRow}>
                                            <span
                                                className={styles.detailLabel}
                                            >
                                                Booking Date:
                                            </span>
                                            <span
                                                className={styles.detailValue}
                                            >
                                                {formatDate(
                                                    booking.booking_time
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.bookingActions}>
                                    <button
                                        className={styles.cancelButton}
                                        onClick={() =>
                                            booking.status !== "CANCELLED" &&
                                            handleCancelClick(
                                                booking.pnr,
                                                booking.train_name
                                            )
                                        }
                                        disabled={
                                            booking.status === "CANCELLED"
                                        }
                                    >
                                        {booking.status !== "CANCELLED"
                                            ? "Cancel Booking"
                                            : "Cancelled"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Popup */}
            <Popup
                id={selectedPnr}
                isOpen={isOpen}
                cnfOption={confirmOption}
                onConfirm={handleCancelAPI}
                onClose={() => {
                    setIsOpen(false);
                    setTimeout(() => {
                        setPopupTitle("ALERT");
                        setPopupMode(null);
                        setConfirmOption(false);
                    }, 190);
                    if (popupMode === "successCancel") {
                        fetchBookings();
                        fetchSummary();
                    }
                }}
                title={popupTitle}
            >
                {popupContent}
            </Popup>
        </div>
    );
}
