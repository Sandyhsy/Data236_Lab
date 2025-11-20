import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB to match backend proxy
const PUT_TIMEOUT_MS = 120000;     // 120s guard

export default function PropertyForm({ edit }) {
  const { state } = useLocation();
  const nav = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    type: "",
    description: "",
    location: "",
    amenities: "",
    price_per_night: "",
    bedrooms: "",
    bathrooms: "",
    availability_start: "",
    availability_end: "",
  });

  const [imageText, setImageText] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);
  const [stagedUrls, setStagedUrls] = useState([]);

  const urls = useMemo(
    () => imageText.split("\n").map((s) => s.trim()).filter(Boolean),
    [imageText]
  );
  const preview = useMemo(() => [...stagedUrls, ...urls], [stagedUrls, urls]);

  function formatDateForInput(v) {
    if (!v) return "";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }

  useEffect(() => {
    async function init() {
      if (edit && state?.p) {
        const p = state.p;
        setForm({
          name: p.name || "",
          type: p.type || "",
          description: p.description || "",
          location: p.location || "",
          amenities: p.amenities || "",
          price_per_night: p.price_per_night || "",
          bedrooms: p.bedrooms ?? "",
          bathrooms: p.bathrooms ?? "",
          availability_start: formatDateForInput(p.availability_start),
          availability_end: formatDateForInput(p.availability_end),
        });
        const imgs = await api.getPropertyImages(p.property_id).catch(() => []);
        setImageText(imgs.map((i) => i.url).join("\n"));
      }
    }
    init();
  }, [edit, state]);

  async function syncUrlsToServer(propertyId, list) {
    await api.setPropertyImages(propertyId, list);
  }

  function validateFiles(fileList) {
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_SIZE) {
        setUploadErr(`File ${f.name} is too large.`);
        return false;
      }
      if (!ALLOWED_MIME.includes(f.type)) {
        setUploadErr(`Unsupported format: ${f.name}`);
        return false;
      }
    }
    setUploadErr("");
    return true;
  }

  async function putWithTimeout(url, file, contentType) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort("timeout"), PUT_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }
  }

  async function handleUploadFiles(fileList) {
    if (!fileList?.length) return;
    if (!validateFiles(fileList)) return;

    setUploading(true);
    try {
      if (edit && id) {
        let working = [...urls];
        for (const file of Array.from(fileList)) {
          try {
            const presign = await api.presignUpload({
              property_id: Number(id),
              filename: file.name,
              contentType: file.type || "image/jpeg",
            });
            const contentTypeToUse = presign.contentType || file.type || "image/jpeg";
            const putRes = await putWithTimeout(presign.uploadUrl, file, contentTypeToUse);
            if (!putRes.ok) throw new Error(await putRes.text().catch(() => putRes.statusText));
            working.push(presign.publicUrl);
            setImageText(working.join("\n"));
          } catch {
            const prox = await api.proxyPropertyUpload(Number(id), file);
            working.push(prox.publicUrl);
            setImageText(working.join("\n"));
          }
        }
        return;
      }

      const added = [];
      for (const file of Array.from(fileList)) {
        try {
          const presign = await api.presignUploadTemp({
            filename: file.name,
            contentType: file.type || "image/jpeg",
          });
          const contentTypeToUse = presign.contentType || file.type || "image/jpeg";
          const putRes = await putWithTimeout(presign.uploadUrl, file, contentTypeToUse);
          if (!putRes.ok) throw new Error(await putRes.text().catch(() => putRes.statusText));
          added.push(presign.publicUrl);
        } catch {
          const prox = await api.proxyStagingUpload(file);
          added.push(prox.publicUrl);
        }
      }
      setStagedUrls((prev) => [...prev, ...added]);
    } catch (e) {
      setUploadErr(e?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function removeUrl(u) {
    try {
      await api.deleteS3Object(u);
    } catch {}
    if (stagedUrls.includes(u)) {
      setStagedUrls(stagedUrls.filter((x) => x !== u));
      return;
    }
    const next = urls.filter((x) => x !== u);
    setImageText(next.join("\n"));
  }

  function validate() {
    const errs = {};
    if (!form.availability_start) errs.availability_start = "Availability start is required.";
    if (!form.availability_end) errs.availability_end = "Availability end is required.";
    if (form.availability_start && form.availability_end) {
      const s = new Date(form.availability_start);
      const e = new Date(form.availability_end);
      if (s > e) errs.dateRange = "End date must be on or after start date.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      alert(Object.values(errs).join("\n"));
      return false;
    }
    return true;
  }

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!validate()) return;

    const payload = {
      ...form,
      price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
    };

    if (edit) {
      await api.updateProperty(id, payload);
      await syncUrlsToServer(Number(id), urls);
      setMsg("Saved");
    } else {
      const created = await api.createProperty(payload);
      let finalUploads = [];
      if (stagedUrls.length > 0) {
        const out = await api.finalizeTempUploads({
          property_id: created.property_id,
          tempUrls: stagedUrls,
        });
        finalUploads = Array.isArray(out?.finalUrls) ? out.finalUrls : [];
      }
      const all = [...urls, ...finalUploads];
      if (all.length > 0) {
        await syncUrlsToServer(created.property_id, all);
      }
      nav("/properties");
    }
  };

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-body">
          <h6 className="fw-bold mb-3">{edit ? "Edit property" : "Add property"}</h6>

          <form onSubmit={save}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Type</label>
                <input className="form-control" value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})} placeholder="Apartment, House, Studio" />
              </div>

              <div className="col-md-6">
                <label className="form-label">Location</label>
                <input className="form-control" value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} placeholder="City, Country" />
              </div>

              <div className="col-md-6">
                <label className="form-label">Price per night (USD)</label>
                <input className="form-control" type="number" step="0.01" value={form.price_per_night} onChange={(e)=>setForm({...form, price_per_night:e.target.value})} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Bedrooms</label>
                <input className="form-control" type="number" value={form.bedrooms} onChange={(e)=>setForm({...form, bedrooms:e.target.value})} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Bathrooms</label>
                <input className="form-control" type="number" value={form.bathrooms} onChange={(e)=>setForm({...form, bathrooms:e.target.value})} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Availability start</label>
                <input
                  className={`form-control ${errors.availability_start ? "is-invalid" : ""}`}
                  type="date"
                  value={form.availability_start}
                  onChange={(e)=>setForm({...form, availability_start:e.target.value})}
                  required
                />
                {errors.availability_start && <div className="invalid-feedback">{errors.availability_start}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label">Availability end</label>
                <input
                  className={`form-control ${(errors.availability_end || errors.dateRange) ? "is-invalid" : ""}`}
                  type="date"
                  min={form.availability_start || undefined}
                  value={form.availability_end}
                  onChange={(e)=>setForm({...form, availability_end:e.target.value})}
                  required
                />
                {(errors.availability_end || errors.dateRange) && (
                  <div className="invalid-feedback">
                    {errors.availability_end || errors.dateRange}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label className="form-label">Amenities (comma separated)</label>
                <input className="form-control" value={form.amenities} onChange={(e)=>setForm({...form, amenities:e.target.value})} placeholder="WiFi, Kitchen, Heating" />
              </div>

              <div className="col-md-6">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
              </div>

              {/* Upload images */}
              <div className="col-12">
                <label htmlFor="fileInput" className="form-label">Property images</label>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    id="fileInput"
                    ref={fileRef}
                    className="d-none"
                    type="file"
                    multiple
                    accept={ALLOWED_MIME.join(",")}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleUploadFiles(files);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Choose files"}
                  </button>
                  <span className="text-secondary small">JPG, PNG, WEBP, GIF up to 25MB.</span>
                </div>
                {uploadErr && <div className="text-danger small mt-2">{uploadErr}</div>}
              </div>

              {/* Preview grid */}
              <div className="col-12">
                <div className="row g-2">
                  {preview.map((u) => (
                    <div className="col-6 col-md-3" key={u}>
                      <div className="card position-relative">
                        <img src={u} alt="preview" className="img-cover" />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2"
                          onClick={() => removeUrl(u)}
                          disabled={uploading}
                          title="Remove"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {preview.length === 0 && <div className="text-secondary small">No images yet.</div>}
                </div>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2">
                <button className="btn btn-danger" type="submit">{edit ? "Save" : "Create"}</button>
                {msg && <span className="text-success align-self-center">{msg}</span>}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
