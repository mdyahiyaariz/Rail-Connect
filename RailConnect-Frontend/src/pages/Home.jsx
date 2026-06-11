import { useContext, useEffect, useState } from "react";
import { HiOutlineRefresh } from "react-icons/hi";
import styles from "./Home.module.css";
import Popup from "../components/PopUp";
import { GlobalContext } from "../GlobalContext";
import { AutoRedirect } from "../components/AutoRedirect";

export default function Home() {
    const { state, dispatch } = useContext(GlobalContext);
    const [trains, setTrains] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Popup states
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopupContent] = useState(null);
    const [popupTitle, setPopupTitle] = useState("ALERT");
    const [popupMode, setPopupMode] = useState(null);
    const [confirmOption, setConfirmOption] = useState(false);
    const [redirectTo, setRedirectTo] = useState(false);

    // Booking states
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [phone, setPhone] = useState("");

    // Waitlists for trains
    const [waitlist, setWaitlist] = useState([]);

    const fetchTrains = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/train",
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await res.json();
            setTrains(data);
            setIsLoading(false);
        } catch (err) {
            setIsLoading(false);
            setError(err.message || "Some error occurred");
            console.error(err);
        }
    };

    const fetchWaitlist = async (trainId) => {
        setError(null);
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL +
                    `/api/train/${trainId}/waitlist`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await res.json();
            if (!data.success) {
                setPopupTitle("ERROR IN FETCHING WAITLIST");
                setPopupMode("error");
                setIsOpen(true);
                setPopupContent(
                    <div>
                        <strong className={styles.failure}>
                            {data.message || "Some error occured!"}
                        </strong>
                    </div>
                );
                return;
            }
            // console.log(data);

            setWaitlist((prev) => {
                return [...prev, data];
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
        fetchTrains();
    }, []);

    useEffect(() => {
        for (const train of trains) {
            fetchWaitlist(train.train_no);
        }
    }, [trains]);

    const getWaiting = (train_no) => {
        return waitlist.filter((wait) => wait.train_no === train_no)[0]
            ?.total_waitlist;
    };

    // Handle book now click
    const handleBookClick = (train) => {
        setPopupTitle("BOOK TICKET");
        if (!state.user) {
            setPopupMode("failure");
            setRedirectTo("/login");
            setPopupContent(
                <div>
                    <strong className={styles.success}>
                        Not logged in, please go to login page.
                    </strong>
                </div>
            );
        } else {
            setSelectedTrain(train);
            setPopupMode("booking");
            setPhone("");
        }
        setIsOpen(true);
    };

    // Handle booking API
    const handleBookingAPI = async (e) => {
        e.preventDefault();
        if (!state.user.phone && (!phone || phone.length < 10)) {
            setPopupMode("failure");
            setPopupContent(
                <div>
                    <strong className={styles.fail}>
                        Please enter a valid phone number
                    </strong>
                </div>
            );
            return;
        }

        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/user/book",
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        train_no: selectedTrain.train_no,
                        phone: state.user.phone || phone,
                    }),
                }
            );

            const data = await res.json();

            if (!data.message || res.status >= 400) {
                setPopupMode("failure");
                setPopupContent(
                    <div>
                        <strong className={styles.fail}>
                            {data.message || "Booking failed"}
                        </strong>
                    </div>
                );
                return;
            }

            // Success
            setPopupMode("successBooking");
            setRedirectTo("/my-bookings");
            setPopupContent(
                <div>
                    <strong className={styles.success}>
                        {data.message || "Booking successful!"}
                    </strong>
                    <p style={{ marginTop: "1rem", color: "#666" }}>
                        Check your bookings to view details.
                    </p>
                </div>
            );
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

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="loader"></div>
                <p>Fetching Trains...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>Error: {error}</p>
                <button onClick={fetchTrains} className={styles.retryButton}>
                    <HiOutlineRefresh />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <AutoRedirect />
            <div className={styles.header}>
                <h1>Available Trains</h1>
                <button onClick={fetchTrains} className={styles.refreshButton}>
                    <HiOutlineRefresh />
                    <span>Refresh</span>
                </button>
            </div>

            {trains.length === 0 ? (
                <div className={styles.noTrains}>
                    <p>No trains available at the moment</p>
                </div>
            ) : (
                <div className={styles.trainGrid}>
                    {trains.map((train) => (
                        <div key={train.train_no} className={styles.trainCard}>
                            <div className={styles.trainHeader}>
                                <div>
                                    <h2>{train.name}</h2>
                                    <p className={styles.trainNumber}>
                                        Train No: {train.train_no}
                                    </p>
                                </div>
                                <div
                                    className={`${styles.seatBadge} ${
                                        train.available_seats === 0
                                            ? styles.fullBooked
                                            : train.available_seats <
                                              train.total_seats * 0.2
                                            ? styles.almostFull
                                            : styles.available
                                    }`}
                                >
                                    {train.available_seats === 0
                                        ? `FULL -> ${getWaiting(
                                              train.train_no
                                          )} waiting`
                                        : `${train.available_seats} seats`}
                                </div>
                            </div>

                            <div className={styles.trainRoute}>
                                <div className={styles.station}>
                                    <span className={styles.stationLabel}>
                                        From
                                    </span>
                                    <span className={styles.stationName}>
                                        {train.start_station}
                                    </span>
                                </div>
                                <div className={styles.arrow}>→</div>
                                <div className={styles.station}>
                                    <span className={styles.stationLabel}>
                                        To
                                    </span>
                                    <span className={styles.stationName}>
                                        {train.end_station}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.trainDetails}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>
                                        Journey Days:
                                    </span>
                                    <span className={styles.detailValue}>
                                        {train.journey_days}
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>
                                        Total Seats:
                                    </span>
                                    <span className={styles.detailValue}>
                                        {train.total_seats}
                                    </span>
                                </div>
                            </div>

                            <button
                                className={styles.bookButton}
                                // disabled={train.available_seats === 0}
                                onClick={() => handleBookClick(train)}
                            >
                                {train.available_seats === 0
                                    ? "Book in Waitlist"
                                    : `Book Now (${train.available_seats})`}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Booking Popup */}
            <Popup
                isOpen={isOpen}
                cnfOption={confirmOption}
                onClose={() => {
                    setRedirectTo(false);
                    setIsOpen(false);
                    setTimeout(() => {
                        setPopupTitle("ALERT");
                        setPopupMode(null);
                        setConfirmOption(false);
                        setPhone("");
                    }, 190);
                    if (popupMode === "successBooking") {
                        fetchTrains();
                    }
                }}
                title={popupTitle}
                redirectTo={redirectTo}
            >
                {popupMode === "booking" && selectedTrain && (
                    <form
                        className={styles.bookingForm}
                        onSubmit={handleBookingAPI}
                    >
                        <div className={styles.trainInfoPopup}>
                            <h3>{selectedTrain.name}</h3>
                            <p>Train No: {selectedTrain.train_no}</p>
                            <p>
                                {selectedTrain.start_station} →{" "}
                                {selectedTrain.end_station}
                            </p>
                            <p className={styles.availableSeats}>
                                Available Seats: {selectedTrain.available_seats}
                            </p>
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.label}>
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                placeholder="Enter your phone number"
                                value={
                                    state.user?.phone ? state.user.phone : phone
                                }
                                onChange={(e) => setPhone(e.target.value)}
                                className={styles.input}
                                autoComplete="tel"
                                required
                                disabled={state.user?.phone ? true : false}
                            />
                            <p className={styles.fieldHint}>
                                This will be used for passenger profile
                            </p>
                        </div>

                        <button type="submit" className={styles.submitButton}>
                            Confirm Booking
                        </button>
                    </form>
                )}

                {popupMode === "successBooking" && popupContent}
                {popupMode === "failure" && popupContent}
                {popupMode === "error" && popupContent}
            </Popup>
        </div>
    );
}
