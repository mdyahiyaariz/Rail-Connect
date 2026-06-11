import { useContext } from "react";
import { Link } from "react-router-dom";
import { GlobalContext } from "../GlobalContext";
import styles from "./Intro.module.css";
import { 
    HiOutlineTicket, 
    HiOutlineClock, 
    HiOutlineUserGroup,
    HiOutlineCheckCircle 
} from "react-icons/hi";

export default function Intro() {
    const { state } = useContext(GlobalContext);

    return (
        <div className={styles.landingContainer}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Welcome to RailConnect
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Book your train tickets seamlessly with real-time seat availability,
                        waitlist management, and instant confirmation
                    </p>
                    <div className={styles.heroButtons}>
                        {state.user ? (
                            <>
                                <Link to="/home" className={styles.primaryBtn}>
                                    <HiOutlineTicket />
                                    <span>Browse Trains</span>
                                </Link>
                                <Link to="/my-bookings" className={styles.secondaryBtn}>
                                    View My Bookings
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/signup" className={styles.primaryBtn}>
                                    Get Started
                                </Link>
                                <Link to="/login" className={styles.secondaryBtn}>
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.heroImage}>
                    <div className={styles.trainIllustration}>
                        🚄
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <h2 className={styles.sectionTitle}>Why Choose Us?</h2>
                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <HiOutlineTicket size={40} />
                        </div>
                        <h3>Easy Booking</h3>
                        <p>
                            Book tickets in just a few clicks with our intuitive
                            interface and streamlined process
                        </p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <HiOutlineClock size={40} />
                        </div>
                        <h3>Real-Time Updates</h3>
                        <p>
                            Get instant updates on seat availability, waitlist status,
                            and booking confirmations
                        </p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <HiOutlineUserGroup size={40} />
                        </div>
                        <h3>Waitlist Management</h3>
                        <p>
                            Automatic seat allocation when cancellations occur with
                            smart waitlist promotion system
                        </p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <HiOutlineCheckCircle size={40} />
                        </div>
                        <h3>Secure & Reliable</h3>
                        <p>
                            Your bookings are safe with our secure database and
                            reliable booking confirmation system
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className={styles.howItWorks}>
                <h2 className={styles.sectionTitle}>How It Works</h2>
                <div className={styles.stepsContainer}>
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>1</div>
                        <h3>Create Account</h3>
                        <p>Sign up with your details to get started</p>
                    </div>

                    <div className={styles.stepArrow}>→</div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>2</div>
                        <h3>Browse Trains</h3>
                        <p>Search and view available trains with seat info</p>
                    </div>

                    <div className={styles.stepArrow}>→</div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>3</div>
                        <h3>Book Ticket</h3>
                        <p>Confirm your booking instantly</p>
                    </div>

                    <div className={styles.stepArrow}>→</div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>4</div>
                        <h3>Travel Safe</h3>
                        <p>Manage bookings and enjoy your journey</p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.statItem}>
                    <h3 className={styles.statNumber}>1000+</h3>
                    <p>Happy Travelers</p>
                </div>
                <div className={styles.statItem}>
                    <h3 className={styles.statNumber}>50+</h3>
                    <p>Train Routes</p>
                </div>
                <div className={styles.statItem}>
                    <h3 className={styles.statNumber}>24/7</h3>
                    <p>Customer Support</p>
                </div>
                <div className={styles.statItem}>
                    <h3 className={styles.statNumber}>99%</h3>
                    <p>Success Rate</p>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <h2>Ready to Start Your Journey?</h2>
                <p>Join thousands of satisfied travelers using our platform</p>
                {state.user ? (
                    <Link to="/home" className={styles.ctaButton}>
                        Browse Available Trains
                    </Link>
                ) : (
                    <Link to="/signup" className={styles.ctaButton}>
                        Sign Up Now - It's Free!
                    </Link>
                )}
            </section>
        </div>
    );
}
