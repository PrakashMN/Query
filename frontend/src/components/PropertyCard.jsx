import { Link } from "react-router-dom";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function PropertyCard({ property }) {
  const cover = property.images?.[0];

  return (
    <Link className="property-card" to={`/properties/${property.id}`}>
      <div className="property-cover">
        {cover ? <img src={`http://localhost:8000${cover}`} alt={property.title} /> : <span>No image</span>}
      </div>
      <div className="property-card-body">
        <div className="card-chip-row">
          <span className="chip chip-blue">{property.type}</span>
          <span className="chip chip-gold">{property.deal_type}</span>
        </div>
        <h3>{property.title}</h3>
        <p>{property.location}</p>
        <div className="property-card-footer">
          <strong>{formatCurrency(property.price)}</strong>
          <span>{property.area} sq.ft</span>
        </div>
        <div className="status-pill">{property.deal_status}</div>
      </div>
    </Link>
  );
}

export default PropertyCard;
