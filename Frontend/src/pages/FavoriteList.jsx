import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchFavorites } from "../store/bookingsSlice";
import PropertyCardSearch from "../components/PropertyCardSearch";

export default function FavoriteList() {
  const dispatch = useAppDispatch();
  const { favorites, loading } = useAppSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="m-0">My favorite property</h5>
      </div>
      {favorites.length === 0 && (
        <div className="text-center py-4 text-muted">
          No favorites yet. Start adding properties to your favorites!
        </div>
      )}
      <div className="row g-3">
        {favorites.map(p => (
          <div className="col-12 col-md-6 col-lg-4" key={p.property_id}>
            <PropertyCardSearch p={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
