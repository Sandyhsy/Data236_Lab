import React from "react";

export default function BookingCard({ b, onAccept, onCancel, isHistory = false }) {
  const statusClass =
    b.status === "ACCEPTED" ? "text-bg-success" :
    b.status === "CANCELLED" ? "text-bg-secondary" : "text-bg-warning";

  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Determine which buttons to show
  const showAccept = !isHistory && b.status === "PENDING";
  const showCancel = isHistory 
    ? b.status === "ACCEPTED"  // In history, only show cancel for ACCEPTED
    : b.status === "PENDING";  // In recent, show cancel for PENDING

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
          <div className="flex-grow-1">
            <div className="fw-bold">{b.property_name}</div>
            <div className="d-flex flex-wrap gap-2 mt-2">
              <span className="badge text-bg-light">#{b.booking_id}</span>
              <span className="badge text-bg-light">{formatDate(b.start_date)} - {formatDate(b.end_date)}</span>
              {b.guests != null && <span className="badge text-bg-light">{b.guests} guests</span>}
              <span className={`badge ${statusClass}`}>{b.status}</span>
            </div>
          </div>
          {(showAccept || showCancel) && (
            <div className="d-flex gap-2 flex-shrink-0">
              {showAccept && (
                <button className="btn btn-primary btn-sm" onClick={() => onAccept(b)}>Accept</button>
              )}
              {showCancel && (
                <button className="btn btn-outline-secondary btn-sm" onClick={() => onCancel(b)}>Cancel</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
