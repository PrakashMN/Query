import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import Navbar from "../components/Navbar";
import {
  createProperty,
  fetchProperty,
  generatePropertyPdf,
  updateProperty,
  uploadFloorPlan,
  uploadPropertyDocuments,
  uploadPropertyImages,
} from "../services/api";

const initialState = {
  // ── Core ──────────────────────────────────────────────────
  title: "",
  type: "Residential",
  deal_type: "Sell",
  location: "",
  map_url: "",
  price: "",
  description: "",
  documents: [],

  // ── myMane Listing Fields ─────────────────────────────────
  bhk_type: "2BHK",
  facing: "East",
  area: "",          // super built-up area (sq.ft)
  carpet_area: "",   // carpet area (sq.ft)
  balcony_count: "", // number of balconies
  year_built: "",    // year of construction
  amenities: "",     // comma-separated

  // ── Seller ───────────────────────────────────────────────
  seller_name: "",
  seller_contact: "",
};

/** High-Performance Client-Side Image Compression */
const compressImage = async (file) => {
  if (file.type === "application/pdf") return file; // Don't compress PDFs
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1000; // Limit dimensions to 1000px
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          console.log(`Compressed ${file.name}: ${Math.round(file.size/1024)}KB -> ${Math.round(compressedFile.size/1024)}KB`);
          resolve(compressedFile);
        }, 'image/jpeg', 0.7); // 70% quality JPEG is plenty
      };
    };
  });
};

function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(initialState);
  const [imageFiles, setImageFiles] = useState([]);
  const [floorPlanFile, setFloorPlanFile] = useState(null);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) return;
    const loadProperty = async () => {
      try {
        const property = await fetchProperty(id);
        setForm({
          ...property,
          area: property.area ?? "",
          price: property.price ?? "",
          deal_price: property.deal_price ?? "",
          carpet_area: property.carpet_area ?? "",
          balcony_count: property.balcony_count ?? "",
          year_built: property.year_built ?? "",
          map_url: property.map_url ?? "",
          bhk_type: property.bhk_type ?? "2BHK",
          facing: property.facing ?? "East",
          possession_date: property.possession_date ?? "",
          amenities: (property.amenities || []).join(", "),
          documents: property.documents || [],
          seller_name: property.seller_name ?? "",
          seller_contact: property.seller_contact ?? "",
        });
      } catch (err) {
        setError(getErrorMessage(err, "Unable to load property"));
      } finally {
        setLoading(false);
      }
    };
    loadProperty();
  }, [id, isEditing]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    const { name, value, checked } = event.target;
    if (name === "documents") {
      setForm((current) => {
        const docs = new Set(current.documents);
        if (checked) docs.add(value);
        else docs.delete(value);
        return { ...current, documents: Array.from(docs) };
      });
    }
  };

  const buildPayload = () => ({
    ...form,
    area: Number(form.area),
    price: Number(form.price),
    carpet_area: form.carpet_area ? Number(form.carpet_area) : null,
    balcony_count: form.balcony_count ? Number(form.balcony_count) : null,
    year_built: form.year_built ? Number(form.year_built) : null,
    amenities: form.amenities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  });

  const getErrorMessage = (err, fallback) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length)
      return detail.map((item) => item?.msg || JSON.stringify(item)).join(", ");
    if (err?.message === "Network Error")
      return "Unable to reach the backend API. Please make sure FastAPI is running on http://localhost:8000.";
    return fallback;
  };

  const handleSubmit = async (event, generatePdfAfterSave = false) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      const property = isEditing
        ? await updateProperty(id, payload)
        : await createProperty(payload);

      const propertyId = property.id;
      const patchPayload = {};

      if (imageFiles.length)
        await uploadPropertyImages(propertyId, Array.from(imageFiles));
      if (floorPlanFile)
        await uploadFloorPlan(propertyId, floorPlanFile);

      if (Object.keys(patchPayload).length)
        await updateProperty(propertyId, patchPayload);
      if (generatePdfAfterSave)
        await generatePropertyPdf(propertyId);

      navigate(`/properties/${propertyId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save property"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="empty-state">Loading property form…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <section className="form-shell">

          {/* ── Header ── */}
          <div className="form-header">
            <div>
              <p className="eyebrow">{isEditing ? "Update listing" : "New listing"}</p>
              <h1>{isEditing ? "Edit Property" : "Add New Property"}</h1>
            </div>
          </div>

          <form className="property-form" onSubmit={(e) => handleSubmit(e, false)}>

            {/* ══════════════════════════════════════════════════
                SECTION 1 – Location & Identity
                Matches PDF: Location, Property Name, Map link
            ════════════════════════════════════════════════════ */}
            <section className="form-section">
              <h2>Location &amp; Identity</h2>
              <div className="field-grid field-grid--3">
                <label>
                  <span>Property Name / Title</span>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Ganeshpur 36"
                    required
                  />
                </label>
                <label>
                  <span>Location / Area</span>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Ganeshpur, Bangalore"
                    required
                  />
                </label>
                <label>
                  <span>Google Map URL</span>
                  <input
                    name="map_url"
                    value={form.map_url}
                    onChange={handleChange}
                    placeholder="https://maps.google.com/..."
                  />
                </label>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 2 – Property Specifications
                Matches PDF: Type, Facing, Built-up, Carpet, Balcony, Year
            ════════════════════════════════════════════════════ */}
            <section className="form-section">
              <h2>Property Specifications</h2>
              <div className="field-grid field-grid--3">

                <label>
                  <span>BHK / Property Type</span>
                  <select name="bhk_type" value={form.bhk_type} onChange={handleChange}>
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="3BHK">3BHK</option>
                    <option value="4BHK">4BHK</option>
                    <option value="4+BHK">4+BHK</option>
                    <option value="Studio">Studio</option>
                    <option value="Villa">Villa</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Land/Plot">Land / Plot</option>
                  </select>
                </label>

                <label>
                  <span>Property Facing</span>
                  <select name="facing" value={form.facing} onChange={handleChange}>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="North-East">North-East</option>
                    <option value="North-West">North-West</option>
                    <option value="South-East">South-East</option>
                    <option value="South-West">South-West</option>
                  </select>
                </label>

                <label>
                  <span>Super Built-up Area (Sq.ft)</span>
                  <input
                    type="number"
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="e.g. 1006"
                    required
                  />
                </label>

                <label>
                  <span>Carpet Area (Sq.ft)</span>
                  <input
                    type="number"
                    name="carpet_area"
                    value={form.carpet_area}
                    onChange={handleChange}
                    placeholder="e.g. 850"
                  />
                </label>

                <label>
                  <span>Number of Balconies</span>
                  <input
                    type="number"
                    name="balcony_count"
                    value={form.balcony_count}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    min="0"
                  />
                </label>

                <label>
                  <span>Year Built</span>
                  <input
                    type="number"
                    name="year_built"
                    value={form.year_built}
                    onChange={handleChange}
                    placeholder="e.g. 2021"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </label>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 3 – Amenities & Documents
                Matches PDF: Amenities list, Documents (Clear Title etc.)
            ════════════════════════════════════════════════════ */}
            <section className="form-section">
              <h2>Amenities &amp; Documents</h2>

              <label>
                <span>Amenities</span>
                <input
                  name="amenities"
                  value={form.amenities}
                  onChange={handleChange}
                  placeholder="Modular Kitchen, Solar water heater, Geyser, Lift, Carparking (ground floor), Ganesh Temple"
                />
                <small className="field-hint">Separate multiple items with commas</small>
              </label>

              <div className="field-grid">
                <label>
                  <span>Property Description</span>
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief description of the property..."
                  />
                </label>

                <label>
                  <span>Deal / Listing Type</span>
                  <select name="deal_type" value={form.deal_type} onChange={handleChange}>
                    <option value="Ready to Move">Ready to Move</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Sell">Sell</option>
                    <option value="Buy">Buy</option>
                    <option value="Rent">Rent</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Category</span>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Land/Plot">Land / Plot</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </label>

              <div style={{ marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Add-on Documents</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    "The Sale Deed (Original)",
                    "Mother Deed (Parent Document)",
                    "Encumbrance Certificate (EC)",
                    "Khata Certificate and Extract",
                    "Latest Property Tax Receipts"
                  ].map((doc) => (
                    <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input
                        type="checkbox"
                        name="documents"
                        value={doc}
                        checked={form.documents.includes(doc)}
                        onChange={handleCheckboxChange}
                        style={{ width: 'auto', marginBottom: 0 }}
                      />
                      {doc}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 4 – Contact / Seller Details
                Matches PDF: Contact number, WhatsApp note
            ════════════════════════════════════════════════════ */}
            <section className="form-section">
              <h2>Contact &amp; Seller Details</h2>
              <div className="field-grid">
                <label>
                  <span>Seller Name</span>
                  <input
                    name="seller_name"
                    value={form.seller_name}
                    onChange={handleChange}
                    placeholder="e.g. Ravi Kumar"
                  />
                </label>
                <label>
                  <span>Contact Number (shown on PDF)</span>
                  <input
                    name="seller_contact"
                    value={form.seller_contact}
                    onChange={handleChange}
                    placeholder="e.g. 82771 00727"
                  />
                </label>
              </div>

            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 5 – Floor Plan (Optional)
            ════════════════════════════════════════════════════ */}
            <section className="form-section">
              <h2>Floor Plan <span style={{ fontWeight: 400, fontSize: "0.85em", color: "var(--text-muted, #888)" }}>(Optional)</span></h2>
              <p className="field-hint section-hint">
                Upload the actual floor plan for this property. Accepted formats: JPG, PNG, PDF.
                This will appear in the generated PDF.
              </p>
              <FileUpload
                label="Floor Plan Image"
                accept=".jpg,.jpeg,.png,.pdf"
                files={floorPlanFile ? [floorPlanFile] : []}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  // Extra safety check for raw size before we even try to compress
                  if (file.size > 10 * 1024 * 1024) { 
                    alert("This file is way too big (>10MB). Please pick a smaller image.");
                    return;
                  }

                  try {
                    const compressed = await compressImage(file);
                    if (compressed.size > 2097152) {
                      alert("Even after compression, this image is too large. Please use a smaller file.");
                      setFloorPlanFile(null);
                    } else {
                      setFloorPlanFile(compressed);
                    }
                  } catch (err) {
                    console.error("Compression failed", err);
                    setFloorPlanFile(file); // Fallback
                  }
                }}
                helper="Upload 1 property floor plan (Automatically compressed)."
              />
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 6 – Property Photos
                Matches PDF page 2: room photos grid
            ════════════════════════════════════════════════════ */}
            <section className="form-section">
              <h2>Property Photos</h2>
              <p className="field-hint section-hint">
                Upload room photos in order: Living Room, 1st Bedroom, Kitchen, 2nd Bedroom,
                Common Washroom, Balconies. These appear in the PDF grid.
              </p>
              <FileUpload
                label="Property Room Photos"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                files={imageFiles}
                onChange={async (e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length > 6) {
                    alert("You can only select up to 6 property photos.");
                    return;
                  }

                  const compressedFiles = [];
                  for (const file of selected) {
                    try {
                      const compressed = await compressImage(file);
                      compressedFiles.push(compressed);
                    } catch (err) {
                      console.error("Compression failed", err);
                      compressedFiles.push(file);
                    }
                  }
                  setImageFiles(compressedFiles.slice(0, 6));
                }}
                helper="Upload up to 6 room photos. (Automatically compressed to 2MB)."
              />
            </section>

            {error ? <div className="error-banner">{error}</div> : null}

            {/* ── Form Actions ── */}
            <div className="form-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
              >
                {saving ? "Working…" : "💾 Save & Generate PDF"}
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving…" : "Save Property"}
              </button>
            </div>

          </form>
        </section>
      </main>
    </>
  );
}

export default PropertyFormPage;
