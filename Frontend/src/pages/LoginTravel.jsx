import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser, clearError } from "../store/authSlice";

export default function LoginTravel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/search");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const submit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    await dispatch(loginUser({ email, password, role: "traveler" }));
  };

  return (
    <div className="container py-4">
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">traveler Login</h6>
              <form onSubmit={submit}>
                <label className="form-label">Email</label>
                <input className="form-control" value={email} onChange={e=>setEmail(e.target.value)} placeholder="owner@example.com" />
                <label className="form-label mt-3">Password</label>
                <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="********" />
                {error && <div className="text-danger mt-2 small">{error}</div>}
                <div className="mt-3 d-flex gap-2">
                  <button className="btn btn-danger" type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
