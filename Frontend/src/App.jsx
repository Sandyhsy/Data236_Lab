import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { fetchUser, logoutUser } from "./store/authSlice";
import { fetchBookings, fetchBookingStatus } from "./store/bookingsSlice";
import Start from "./pages/Start";
import Header from "./components/Header";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OwnerDashboard from "./pages/OwnerDashboard";
import Profile from "./pages/Profile";
import PropertiesList from "./pages/PropertiesList";
import PropertyForm from "./pages/PropertyForm";
import LoginTravel from "./pages/LoginTravel";
import SignupTravel from "./pages/SignupTravel";
import PropertySearch from "./pages/PropertySearch";
import Property from "./pages/Property";
import History from "./pages/History";

import FavoriteList from "./pages/FavoriteList";
import ConciergeChat from "./components/ConciergeChat";

function toMillis(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(value);
  const ms = parsed.getTime();
  return Number.isNaN(ms) ? fallback : ms;
}


export default function App() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const { bookings, pendingRequests, acceptedRequests, canceledRequests } = useAppSelector((state) => state.bookings);
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "traveler") {
      dispatch(fetchBookings());
      dispatch(fetchBookingStatus());
    }
  }, [dispatch, isAuthenticated, user]);

  // Calculate concierge bookings from Redux state
  const conciergeBookings = React.useMemo(() => {
    if (!user || user.role !== "traveler") {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pending = pendingRequests.filter(b => {
      if (!b.start_date) return false;
      const startDate = new Date(b.start_date);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });

    const acceptedSorted = acceptedRequests.slice().sort(
      (a, b) =>
        toMillis(a?.start_date ?? a?.startDate, Number.MAX_SAFE_INTEGER) -
        toMillis(b?.start_date ?? b?.startDate, Number.MAX_SAFE_INTEGER)
    );
    const pendingSorted = pending.slice().sort(
      (a, b) =>
        toMillis(a?.start_date ?? a?.startDate, Number.MAX_SAFE_INTEGER) -
        toMillis(b?.start_date ?? b?.startDate, Number.MAX_SAFE_INTEGER)
    );
    const historySorted = bookings.slice().sort(
      (a, b) =>
        toMillis(a?.start_date ?? a?.startDate, 0) -
        toMillis(b?.start_date ?? b?.startDate, 0)
    );

    const seen = new Set();
    const combined = [];
    const pushUnique = (arr) => {
      arr.forEach((booking) => {
        const key = booking?.booking_id ?? booking?.id;
        if (!key || seen.has(key)) return;
        seen.add(key);
        combined.push(booking);
      });
    };

    pushUnique(acceptedSorted);
    pushUnique(pendingSorted);
    pushUnique(historySorted);
    pushUnique(canceledRequests);

    return combined;
  }, [user, bookings, pendingRequests, acceptedRequests, canceledRequests]);

  const primaryConciergeBooking = conciergeBookings[0] || null;

  const handleLogout = async () => {
    await dispatch(logoutUser());
    window.location.replace("/");
  };

  if (loading) return null;
  const isAuthed = isAuthenticated && !!user;

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <div>
        <Routes> 
          <Route path="/" element={isAuthed ?<Profile />: <Start />} />
          <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={isAuthed ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/traveler/login" element={isAuthed ? <Navigate to="/search" /> : <LoginTravel />} />
          <Route path="/traveler/signup" element={isAuthed ? <Navigate to="/dashboard" /> : <SignupTravel />} />          
          <Route path="/dashboard" element={isAuthed ? <OwnerDashboard /> : <Navigate to="/login" state={{ from: location }} />} />
          <Route path="/profile" element={isAuthed ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/properties" element={isAuthed ? <PropertiesList /> : <Navigate to="/login" />} />
          <Route path="/properties/new" element={isAuthed ? <PropertyForm /> : <Navigate to="/login" />} />
          <Route path="/properties/:id" element={isAuthed ? <PropertyForm edit /> : <Navigate to="/login" />} />
          <Route path="/search" element={isAuthed ? <PropertySearch edit /> : <Navigate to="/login" />} />
          <Route path="/property/:id" element={<Property />} />
          <Route path="/favorite" element={<FavoriteList />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
      <ConciergeChat
        user={user}
        booking={primaryConciergeBooking}
        bookings={conciergeBookings}
      />
    </>
  );
}
