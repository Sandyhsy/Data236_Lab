import React, { useEffect, useState } from "react";
import { api } from "../api";
import BookingCard from "../components/BookingCard";

export default function OwnerDashboard() {
  // 1) Safe initial shape so .length exists
  const [stats, setStats] = useState({
    total_props: 0,
    incoming: 0,
    recentRequests: [],
    previousBookings: []
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const d = await api.dashboard();
      // 2) Normalize response to avoid undefined
      setStats({
        total_props: Number(d?.total_props ?? 0),
        incoming: Number(d?.incoming ?? 0),
        recentRequests: Array.isArray(d?.recentRequests) ? d.recentRequests : [],
        previousBookings: Array.isArray(d?.previousBookings) ? d.previousBookings : []
      });
    } catch (e) {
      // Optional: keep UI usable even if API fails
      setStats({ total_props: 0, incoming: 0, recentRequests: [], previousBookings: [] });
      console.error("Dashboard load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accept = async (b) => {
    try {
      await api.acceptBooking(b.booking_id);
      alert("Booking accepted");
    } catch (e) {
      alert(e.message || "Failed to accept booking");
    } finally {
      await load();
    }
  };

  const cancel = async (b) => {
    try {
      await api.cancelBooking(b.booking_id);
      alert("Booking cancelled");
    } catch (e) {
      alert(e.message || "Failed to cancel booking");
    } finally {
      await load();
    }
  };

  if (loading) return <div className="container py-4"><div className="alert alert-light">Loading...</div></div>;

  // 3) Always read arrays via fallback to avoid "undefined.length"
  // Filter recent requests to only show today onwards (double check on frontend)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recent = (stats.recentRequests ?? []).filter(b => {
    if (!b.start_date) return false;
    const startDate = new Date(b.start_date);
    startDate.setHours(0, 0, 0, 0);
    return startDate >= today;
  });
  const history = stats.previousBookings ?? [];

  return (
    <div className="container py-4">
      <div className="row g-3">
        {/* Stats card - responsive */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body text-center">
              <div className="text-secondary small mb-1">Total properties</div>
              <div className="fs-2 fw-bold text-danger">{stats.total_props}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card h-100">
            <div className="card-body text-center">
              <div className="text-secondary small mb-1">Pending requests</div>
              <div className="fs-2 fw-bold text-danger">{stats.incoming}</div>
            </div>
          </div>
        </div>

        {/* Recent booking requests - responsive */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <div className="h6 fw-bold mb-3">Recent booking requests</div>
              <div className="d-flex flex-column gap-2" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {recent.length === 0 && <div className="text-secondary small">No requests yet.</div>}
                {recent.map(b => (
                  <BookingCard key={b.booking_id} b={b} onAccept={accept} onCancel={cancel} isHistory={false} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* History bookings - responsive */}
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="h6 fw-bold mb-3">History bookings</div>
              <div className="row g-2">
                {history.length === 0 && <div className="col-12"><div className="text-secondary small">No history.</div></div>}
                {history.map(b => (
                  <div className="col-12 col-sm-6 col-lg-4" key={b.booking_id}>
                    <BookingCard b={b} onAccept={accept} onCancel={cancel} isHistory={true} />
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
