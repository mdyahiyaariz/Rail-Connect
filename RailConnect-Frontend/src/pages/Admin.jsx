import { useEffect, useState } from "react";
import {
    HiOutlineRefresh,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
} from "react-icons/hi";
import styles from "./Admin.module.css";
import Popup from "../components/PopUp";
import { AutoRedirect } from "../components/AutoRedirect";

export default function Admin() {
    const [trains, setTrains] = useState([]);
    const [statistics, setStatistics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("trains"); // "trains" or "statistics"

    // Waitlists for trains
    const [waitlist, setWaitlist] = useState([]);

    // Popup states
    const [isOpen, setIsOpen] = useState(false);
    const [popupContent, setPopupContent] = useState(null);
    const [popupTitle, setPopupTitle] = useState("ALERT");
    const [popupMode, setPopupMode] = useState(null);
    const [confirmOption, setConfirmOption] = useState(false);
    const [selectedTrainId, setSelectedTrainId] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        train_no: "",
        name: "",
        start_station: "",
        end_station: "",
        journey_days: "",
        total_seats: "",
    });

    const fetchTrainWait = async (trainId) => {
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
                            <strong className={styles.fail}>
                                {data.message || "Some error occured!"}
                            </strong>
                        </div>
                );
                return;
            }

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
        if (trains.length > 0) {
            setWaitlist([]);
            for (const train of trains) {
                fetchTrainWait(train.train_no);
            }
        }
    }, [trains]);

    const getWaiting = (train_no) => {
        return waitlist.filter((wait) => wait.train_no === train_no)[0]
            ?.total_waitlist;
    };

    // Fetch all trains
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

    // Fetch statistics
    const fetchStatistics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/admin/statistics",
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await res.json();
            // API returns an array of stats for the summary endpoint.
            // Guard against unexpected shapes by normalizing to an array.
            if (Array.isArray(data)) {
                setStatistics(data);
            } else if (data && data.stat) {
                setStatistics([data.stat]);
            } else {
                setStatistics([]);
            }
            setIsLoading(false);
        } catch (err) {
            setIsLoading(false);
            setError(err.message || "Some error occurred");
            console.error(err);
        }
    };

    // View detailed statistics for a train (includes passenger list)
    const handleViewStat = async (train_no) => {
        setError(null);
        setPopupTitle("TRAIN STATISTICS");
        setPopupMode("loading");
        setIsOpen(true);
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL +
                    `/api/admin/statistics?train_no=${train_no}`,
                { method: "GET", credentials: "include" }
            );

            const data = await res.json();

            if (!data || !data.success) {
                setPopupMode("error");
                setPopupContent(
                    <div>
                        <strong className={styles.fail}>
                            {data?.message || "Failed to load statistics"}
                        </strong>
                    </div>
                );
                return;
            }

            const stat = data.stat || null;
            const passengers = data.passengers || [];

            setPopupMode("statDetails");
            setPopupContent(
                <div className={styles.statDetail}>
                    {stat ? (
                        <div className={styles.statSummary}>
                            <h3>
                                {stat.name} — {stat.train_no}
                            </h3>
                            <p>
                                <strong>Total Seats:</strong> {stat.total_seats}
                            </p>
                            <p>
                                <strong>Available:</strong>{" "}
                                {stat.available_seats || 0}
                            </p>
                            <p>
                                <strong>Occupancy:</strong>{" "}
                                {stat.occupancy_percentage !== null &&
                                stat.occupancy_percentage !== undefined
                                    ? `${stat.occupancy_percentage}%`
                                    : "N/A"}
                            </p>
                            <p>
                                <strong>Confirmed:</strong> {stat.confirmed || 0}
                                {"  "}
                                <strong>Waitlist:</strong> {stat.waitlist || 0}
                                {"  "}
                                <strong>Cancelled:</strong> {stat.cancelled || 0}
                            </p>
                        </div>
                    ) : (
                        <p>No statistics available for this train.</p>
                    )}

                    <div className={styles.passengersSection}>
                        <h4>Passengers (Confirmed + Waitlist)</h4>
                        {passengers.length === 0 ? (
                            <p>No active passengers</p>
                        ) : (
                            <div className={styles.passengerTableWrap}>
                                <table className={styles.passengerTable}>
                                    <thead>
                                        <tr>
                                            <th>PNR</th>
                                            <th>Status</th>
                                            <th>Booking Time</th>
                                            <th>Passenger</th>
                                            <th>Phone</th>
                                            <th>User</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {passengers.map((p) => {
                                            const formattedTime = p.booking_time
                                                ? new Date(p.booking_time).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })
                                                : "-";
                                            return (
                                                <tr key={p.pnr}>
                                                    <td>{p.pnr}</td>
                                                    <td>{p.status}</td>
                                                    <td>{formattedTime}</td>
                                                    <td>{p.user_name || "-"}</td>
                                                    <td>{p.phone || "-"}</td>
                                                    <td>{p.email || "-"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
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

    useEffect(() => {
        if (activeTab === "trains") {
            fetchTrains();
        } else {
            fetchStatistics();
        }
    }, [activeTab]);

    // Handle input change
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Open Add Train popup
    const handleAddTrainClick = () => {
        setPopupMode("add");
        setPopupTitle("ADD NEW TRAIN");
        setFormData({
            train_no: "",
            name: "",
            start_station: "",
            end_station: "",
            journey_days: "",
            total_seats: "",
        });
        setIsOpen(true);
    };

    // Open Edit Train popup
    const handleEditTrainClick = async (trainNo) => {
        setPopupMode("edit");
        setPopupTitle("UPDATE TRAIN");
        setSelectedTrainId(trainNo);

        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL +
                    `/api/admin/train/${trainNo}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await res.json();
            setFormData({
                train_no: data.train_no,
                name: data.name,
                start_station: data.start_station,
                end_station: data.end_station,
                journey_days: data.journey_days,
                total_seats: data.total_seats,
            });
            setIsOpen(true);
        } catch (err) {
            console.error(err);
            setPopupMode("error");
            setPopupContent(
                <div>
                    <strong className={styles.fail}>
                        Failed to load train details
                    </strong>
                </div>
            );
            setIsOpen(true);
        }
    };

    // Handle Add Train API
    const handleAddTrainAPI = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL + "/api/admin/train",
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                }
            );

            const data = await res.json();

            if (!data.message || res.status >= 400) {
                setPopupMode("failure");
                setPopupContent(
                    <div>
                        <strong className={styles.fail}>
                            {data.message || "Failed to add train"}
                        </strong>
                    </div>
                );
                return;
            }

            setPopupMode("successAdd");
            setPopupContent(
                <div>
                    <strong className={styles.success}>
                        {data.message || "Train added successfully!"}
                    </strong>
                </div>
            );
            fetchTrains();
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

    // Handle Update Train API
    const handleUpdateTrainAPI = async (e) => {
        e.preventDefault();

        try {
            const { train_no, ...updateData } = formData;
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL +
                    `/api/admin/train/${selectedTrainId}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updateData),
                }
            );

            const data = await res.json();

            if (!data.message || res.status >= 400) {
                setPopupMode("failure");
                setPopupContent(
                    <div>
                        <strong className={styles.fail}>
                            {data.message || "Failed to update train"}
                        </strong>
                    </div>
                );
                return;
            }

            setPopupMode("successUpdate");
            setPopupContent(
                <div>
                    <strong className={styles.success}>
                        {data.message || "Train updated successfully!"}
                    </strong>
                </div>
            );
            await fetchTrains();
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

    // Handle Delete Train Click
    const handleDeleteTrainClick = (trainNo, trainName) => {
        setSelectedTrainId(trainNo);
        setPopupTitle("DELETE TRAIN");
        setPopupMode("deleteConfirm");
        setConfirmOption(true);
        setPopupContent(
            <div>
                <p>Are you sure you want to delete this train?</p>
                <p>
                    <strong>Train No:</strong> {trainNo}
                </p>
                <p>
                    <strong>Train Name:</strong> {trainName}
                </p>
                <p style={{ color: "#f44336", marginTop: "1rem" }}>
                    This action cannot be undone!
                </p>
            </div>
        );
        setIsOpen(true);
    };

    // Handle Delete Train API
    const handleDeleteTrainAPI = async (trainNo) => {
        try {
            const res = await fetch(
                import.meta.env.VITE_BACKEND_URL +
                    `/api/admin/train/${trainNo}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (!data.message || res.status >= 400) {
                setPopupMode("failure");
                setConfirmOption(false);
                setPopupContent(
                    <div>
                        <strong className={styles.fail}>
                            {data.message || "Failed to delete train"}
                        </strong>
                    </div>
                );
                return;
            }

            setConfirmOption(false);
            setPopupMode("successDelete");
            setPopupContent(
                <div>
                    <strong className={styles.success}>
                        {data.message || "Train deleted successfully!"}
                    </strong>
                </div>
            );
            fetchTrains();
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

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="loader"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>Error: {error}</p>
                <button
                    onClick={() =>
                        activeTab === "trains"
                            ? fetchTrains()
                            : fetchStatistics()
                    }
                    className={styles.retryButton}
                >
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
                <h1>Admin Dashboard</h1>
                <div className={styles.headerButtons}>
                    <button
                        onClick={() =>
                            activeTab === "trains"
                                ? fetchTrains()
                                : fetchStatistics()
                        }
                        className={styles.refreshButton}
                    >
                        <HiOutlineRefresh />
                        <span>Refresh</span>
                    </button>
                    {activeTab === "trains" && (
                        <button
                            onClick={handleAddTrainClick}
                            className={styles.addButton}
                        >
                            <HiOutlinePlus />
                            <span>Add Train</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${
                        activeTab === "trains" ? styles.activeTab : ""
                    }`}
                    onClick={() => setActiveTab("trains")}
                >
                    Manage Trains
                </button>
                <button
                    className={`${styles.tab} ${
                        activeTab === "statistics" ? styles.activeTab : ""
                    }`}
                    onClick={() => setActiveTab("statistics")}
                >
                    Statistics
                </button>
            </div>

            {/* Trains Tab */}
            {activeTab === "trains" && (
                <div className={styles.trainsContainer}>
                    {trains.length === 0 ? (
                        <div className={styles.noData}>
                            <p>No trains available</p>
                        </div>
                    ) : (
                        <div className={styles.trainGrid}>
                            {trains.map((train) => (
                                <div
                                    key={train.train_no}
                                    className={styles.trainCard}
                                >
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
                                            {train.available_seats || 0} /{" "}
                                            {train.total_seats}
                                        </div>
                                    </div>

                                    <div className={styles.trainRoute}>
                                        <div className={styles.station}>
                                            <span
                                                className={styles.stationLabel}
                                            >
                                                From
                                            </span>
                                            <span
                                                className={styles.stationName}
                                            >
                                                {train.start_station}
                                            </span>
                                        </div>
                                        <div className={styles.arrow}>→</div>
                                        <div className={styles.station}>
                                            <span
                                                className={styles.stationLabel}
                                            >
                                                To
                                            </span>
                                            <span
                                                className={styles.stationName}
                                            >
                                                {train.end_station}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.trainDetails}>
                                        <div className={styles.detailItem}>
                                            <span
                                                className={styles.detailLabel}
                                            >
                                                Journey Days:
                                            </span>
                                            <span
                                                className={styles.detailValue}
                                            >
                                                {train.journey_days}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span
                                                className={styles.detailLabel}
                                            >
                                                Total Seats:
                                            </span>
                                            <span
                                                className={styles.detailValue}
                                            >
                                                {train.total_seats}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span
                                                className={styles.detailLabel}
                                            >
                                                Waitings
                                            </span>
                                            <span
                                                className={styles.detailValue}
                                            >
                                                {getWaiting(train.train_no)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.actions}>
                                        <button
                                            className={styles.editButton}
                                            onClick={() =>
                                                handleEditTrainClick(
                                                    train.train_no
                                                )
                                            }
                                        >
                                            <HiOutlinePencil />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() =>
                                                handleDeleteTrainClick(
                                                    train.train_no,
                                                    train.name
                                                )
                                            }
                                        >
                                            <HiOutlineTrash />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "statistics" && (
                <div className={styles.statisticsContainer}>
                    {statistics.length === 0 ? (
                        <div className={styles.noData}>
                            <p>No statistics available</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.statsTable}>
                                <thead>
                                    <tr>
                                        <th>Train No</th>
                                        <th>Train Name</th>
                                        <th>Total Seats</th>
                                        <th>Occupancy %</th>
                                        <th>Available</th>
                                        <th>Total Bookings</th>
                                        <th>Confirmed</th>
                                        <th>Waitlist</th>
                                        <th>Cancelled</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statistics.map((stat) => (
                                        <tr key={stat.train_no}>
                                            <td>{stat.train_no}</td>
                                            <td>{stat.name}</td>
                                            <td>{stat.total_seats}</td>
                                            <td>
                                                {stat.occupancy_percentage !== null &&
                                                stat.occupancy_percentage !== undefined
                                                    ? `${stat.occupancy_percentage}%`
                                                    : "-"}
                                            </td>
                                            <td>
                                                <span
                                                    className={`${
                                                        styles.badge
                                                    } ${
                                                        stat.available_seats ===
                                                        0
                                                            ? styles.badgeDanger
                                                            : stat.available_seats <
                                                              stat.total_seats *
                                                                  0.2
                                                            ? styles.badgeWarning
                                                            : styles.badgeSuccess
                                                    }`}
                                                >
                                                    {stat.available_seats || 0}
                                                </span>
                                            </td>
                                            <td>{stat.total_bookings || 0}</td>
                                            <td>
                                                <span
                                                    className={
                                                        styles.badgeSuccess
                                                    }
                                                >
                                                    {stat.confirmed || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={
                                                        styles.badgeWarning
                                                    }
                                                >
                                                    {stat.waitlist || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className={
                                                        styles.badgeDanger
                                                    }
                                                >
                                                    {stat.cancelled || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.viewButton}
                                                    onClick={() =>
                                                        handleViewStat(
                                                            stat.train_no
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Popup */}
            <Popup
                id={selectedTrainId}
                isOpen={isOpen}
                cnfOption={confirmOption}
                onConfirm={handleDeleteTrainAPI}
                wide={popupMode === "statDetails"}
                onClose={() => {
                    setIsOpen(false);
                    setTimeout(() => {
                        setPopupTitle("ALERT");
                        setPopupMode(null);
                        setConfirmOption(false);
                    }, 190);
                }}
                title={popupTitle}
            >
                {(popupMode === "add" || popupMode === "edit") && (
                    <form
                        className={styles.form}
                        onSubmit={
                            popupMode === "add"
                                ? handleAddTrainAPI
                                : handleUpdateTrainAPI
                        }
                    >
                        <div className={styles.formField}>
                            <label className={styles.label}>
                                Train Number *
                            </label>
                            <input
                                type="text"
                                name="train_no"
                                placeholder="e.g., 12345"
                                value={formData.train_no}
                                onChange={handleInputChange}
                                className={styles.input}
                                required
                                disabled={popupMode === "edit"}
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.label}>Train Name *</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g., Rajdhani Express"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.label}>
                                Start Station *
                            </label>
                            <input
                                type="text"
                                name="start_station"
                                placeholder="e.g., New Delhi"
                                value={formData.start_station}
                                onChange={handleInputChange}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.label}>
                                End Station *
                            </label>
                            <input
                                type="text"
                                name="end_station"
                                placeholder="e.g., Mumbai"
                                value={formData.end_station}
                                onChange={handleInputChange}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.label}>
                                Journey Days *
                            </label>
                            <input
                                type="number"
                                name="journey_days"
                                placeholder="e.g., 2"
                                value={formData.journey_days}
                                onChange={handleInputChange}
                                className={styles.input}
                                required
                                min="1"
                            />
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.label}>
                                Total Seats *
                            </label>
                            <input
                                type="number"
                                name="total_seats"
                                placeholder="e.g., 100"
                                value={formData.total_seats}
                                onChange={handleInputChange}
                                className={styles.input}
                                required
                                min="1"
                            />
                        </div>

                        <button type="submit" className={styles.submitButton}>
                            {popupMode === "add" ? "Add Train" : "Update Train"}
                        </button>
                    </form>
                )}

                {popupMode === "successAdd" && popupContent}
                {popupMode === "successUpdate" && popupContent}
                {popupMode === "successDelete" && popupContent}
                {popupMode === "deleteConfirm" && popupContent}
                {popupMode === "statDetails" && popupContent}
                {popupMode === "failure" && popupContent}
                {popupMode === "error" && popupContent}
            </Popup>
        </div>
    );
}
