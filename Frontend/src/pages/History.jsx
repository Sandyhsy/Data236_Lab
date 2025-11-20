import React, { useEffect, useState } from "react";
import { api } from "../api";
import HistoryCard from "../components/HistoryCard";

export default function OwnerDashboard() {

  const [bookHistory, setHistory] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [canceledRequests, setCanceledRequests] = useState([]);

  const load = async () => {
    const h = await api.getbookings();
    const historyData = Array.isArray(h) ? h : [];
    setHistory(historyData);

    let pending = [];
    let accepted = [];
    let canceled = [];

    try {
      const d = await api.getbookingStatus();
      // Filter pending requests to only show today onwards (double check on frontend)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allPending = Array.isArray(d?.pendingRequests) ? d.pendingRequests : [];
      pending = allPending.filter(b => {
        if (!b.start_date) return false;
        const startDate = new Date(b.start_date);
        startDate.setHours(0, 0, 0, 0);
        return startDate >= today;
      });
      accepted = Array.isArray(d?.acceptedRequests) ? d.acceptedRequests : [];
      canceled = Array.isArray(d?.canceledRequests) ? d.canceledRequests : [];
    } catch (e) {
      console.error("Dashboard load failed:", e);
    }

    setPendingRequests(pending);
  	setAcceptedRequests(accepted);
    setCanceledRequests(canceled);
  };
  useEffect(() => { load(); }, []);


  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-12 col-md-6" />

        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="h6 fw-bold mb-3">Pending</div>
              <div className="row g-1">
                {pendingRequests.length === 0 && <div className="text-secondary small">No Pending request yet.</div>}
                {pendingRequests.map(b => (
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
                {bookHistory.length === 0 && <div className="text-secondary small">No history.</div>}
                {bookHistory.map(b => (
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
