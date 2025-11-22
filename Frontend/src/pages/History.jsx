import React, { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchBookings, fetchBookingStatus } from "../store/bookingsSlice";
import HistoryCard from "../components/HistoryCard";

export default function History() {
  const dispatch = useAppDispatch();
  const { bookings, pendingRequests, acceptedRequests, canceledRequests, loading } = useAppSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookings());
    dispatch(fetchBookingStatus());
  }, [dispatch]);

  // Filter pending requests to only show today onwards
  const filteredPending = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pendingRequests.filter(b => {
      if (!b.start_date) return false;
      const startDate = new Date(b.start_date);
      startDate.setHours(0, 0, 0, 0);
      return startDate >= today;
    });
  }, [pendingRequests]);


  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-12 col-md-6" />

        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="h6 fw-bold mb-3">Pending</div>
              <div className="row g-1">
                {filteredPending.length === 0 && <div className="text-secondary small">No Pending request yet.</div>}
                {filteredPending.map(b => (
                  <div className="col-12 col-md-6" key={b.booking_id}>
                    <HistoryCard b={b} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="h6 fw-bold mb-3">Accepted</div>
              <div className="row g-1">
                {acceptedRequests.length === 0 && <div className="text-secondary small">No Accepted request yet.</div>}
                {acceptedRequests.map(b => (
                  <div className="col-12 col-md-6" key={b.booking_id}>
                    <HistoryCard b={b} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="h6 fw-bold mb-3">Canceled</div>
              <div className="row g-1">
                {canceledRequests.length === 0 && <div className="text-secondary small">No Canceled request yet.</div>}
                {canceledRequests.map(b => (
                  <div className="col-12 col-md-6" key={b.booking_id}>
                    <HistoryCard b={b} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="h6 fw-bold mb-3">Past trips</div>
              <div className="row g-1">
                {bookings.length === 0 && <div className="text-secondary small">No history.</div>}
                {bookings.map(b => (
                  <div className="col-12 col-md-6" key={b.booking_id}>
                    <HistoryCard b={b} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
