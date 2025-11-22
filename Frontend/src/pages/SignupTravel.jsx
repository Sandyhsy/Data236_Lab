import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { signupUser, clearError } from "../store/authSlice";

export default function SignupTravel() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", city: "", country: "" });

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
    await dispatch(signupUser({ ...form, role: "traveler" }));
  };

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-body">
          <h6 className="fw-bold mb-3">Traveler Sign up</h6>
          <form onSubmit={submit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button className="btn btn-danger" type="submit" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </div>
            </div>
            {error && <div className="text-danger mt-2 small">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
