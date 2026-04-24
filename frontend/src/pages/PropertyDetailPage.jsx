import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusBar from "../components/StatusBar";
import { fetchProperty, generatePropertyPdf } from "../services/api";

const PRODUCTION_URL = "https://backend-production-d39ef.up.railway.app";
const apiBaseUrl = import.meta.env.VITE_API_URL || PRODUCTION_URL || "http://localhost:8000";

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "Not set";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function DocumentList({ items }) {
  if (!items?.length) return <div className="empty-inline">No documents selected</div>;
  return (
    <div className="doc-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
      {items.map((item) => (
        <div key={item} className="doc-item" style={{ fontSize: '14px', color: '#333' }}>
          • {item}
        </div>
      ))}
    </div>
  );
}

function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const pdfUrl = property?.generated_pdf
    ? `${apiBaseUrl}${property.generated_pdf}?v=${encodeURIComponent(property.updated_at || "")}`
    : null;

  const loadProperty = async () => {
    setLoading(true);
    try {
      const data = await fetchProperty(id);
      setProperty(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to fetch property");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperty();
  }, [id]);

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      await generatePropertyPdf(id);
      await loadProperty();
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="empty-state">Loading property details...</div>
        </main>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Navbar />
        <main className="page-shell">
          <div className="error-banner">{error || "Property not found"}</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-shell">
        <section className="detail-header">
          <div>
            <p className="eyebrow">Property record</p>
            <h1>{property.title}</h1>
            <span>{property.location}</span>
            <div className="card-chip-row">
              <span className="chip chip-blue">{property.type}</span>
              <span className="chip chip-gold">{property.deal_type}</span>
            </div>
          </div>
          <div className="detail-actions">
            <button className="secondary-button" onClick={handleGeneratePdf} disabled={pdfLoading}>
              {pdfLoading ? "Generating..." : "Generate PDF"}
            </button>
            <Link className="primary-button" to={`/properties/${property.id}/edit`}>
              Edit Property
            </Link>
            {property.generated_pdf ? (
              <a
                className="ghost-link"
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                Download PDF
              </a>
            ) : null}
          </div>
        </section>

        <StatusBar current={property.deal_status} />

        <section className="detail-grid">
          <article className="detail-card">
            <h2>Property Details</h2>
            <div className="info-row"><span>Area</span><strong>{property.area} sq.ft</strong></div>
            <div className="info-row"><span>Listed Price</span><strong>{formatCurrency(property.price)}</strong></div>
            <div className="info-row"><span>Deal Price</span><strong>{formatCurrency(property.deal_price)}</strong></div>
            <div className="info-row"><span>Payment Mode</span><strong>{property.payment_mode || "Not set"}</strong></div>
            <div className="info-row"><span>Possession Date</span><strong>{property.possession_date || "Not set"}</strong></div>
            <div className="info-stack">
              <span>Description</span>
              <p>{property.description || "No description provided."}</p>
            </div>
            <div className="info-stack">
              <span>Amenities</span>
              <p>{property.amenities?.length ? property.amenities.join(", ") : "No amenities listed."}</p>
            </div>
          </article>

          <article className="detail-card">
            <h2>Seller & Buyer</h2>
            <div className="info-row"><span>Seller Name</span><strong>{property.seller_name || "Not set"}</strong></div>
            <div className="info-row"><span>Seller Contact</span><strong>{property.seller_contact || "Not set"}</strong></div>

            <div className="info-row"><span>Buyer Name</span><strong>{property.buyer_name || "Not set"}</strong></div>
            <div className="info-row"><span>Buyer Contact</span><strong>{property.buyer_contact || "Not set"}</strong></div>
            <div className="info-row">
              <span>Buyer ID Proof</span>
              <strong>{property.buyer_id_proof ? <a href={`${apiBaseUrl}${property.buyer_id_proof}`} target="_blank" rel="noreferrer">Open file</a> : "Not uploaded"}</strong>
            </div>
          </article>
        </section>

        <section className="detail-card">
          <h2>Property Images</h2>
          {property.images?.length ? (
            <div className="image-grid">
              {property.images.map((image) => (
                <a key={image} href={`${apiBaseUrl}${image}`} target="_blank" rel="noreferrer">
                  <img src={`${apiBaseUrl}${image}`} alt={property.title} />
                </a>
              ))}
            </div>
          ) : (
            <div className="empty-inline">No images uploaded</div>
          )}
        </section>

        <section className="detail-card">
          <h2>Legal Documents</h2>
          <DocumentList items={property.documents} />
        </section>
      </main>
    </>
  );
}

export default PropertyDetailPage;
