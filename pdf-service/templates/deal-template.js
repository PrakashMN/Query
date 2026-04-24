import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build the Map link anchor when a map URL is present */
function mapLinkMarkup(mapUrl) {
  if (!mapUrl) return "";
  return `
    <a class="map-link" href="${mapUrl}" target="_blank">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
      View on Map
    </a>
  `;
}

/**
 * Build the uploaded floor plan markup (if any).
 */
function floorPlanMarkup(floorPlan) {
  if (!floorPlan) return "";
  const BACKEND = "http://localhost:8000";
  return `
    <div class="fp-section">
      <div class="section-label">Floor Plan</div>
      <div class="fp-frame">
        <img src="${BACKEND}${floorPlan}" alt="Floor Plan" crossorigin="anonymous" />
      </div>
    </div>
  `;
}

/**
 * Build the property-photos grid for page 2.
 */
function photosMarkup(images = []) {
  const BACKEND = "http://localhost:8000";

  if (!images.length) {
    return `<div class="photo-placeholder" style="width: 100%; border: 1px dashed var(--border);">No property photos uploaded.</div>`;
  }

  const cells = images.slice(0, 7).map((src, i) => {
    return `
      <div class="photo-cell">
        <img src="${BACKEND}${src}" alt="Property Photo ${i + 1}" crossorigin="anonymous" />
      </div>
    `;
  });

  const gridCells = cells.slice(0, 6);
  const lastCell = cells[6] || "";

  return `
    <div class="photo-grid">${gridCells.join("")}</div>
    ${lastCell ? `<div class="photo-single">${lastCell}</div>` : ""}
  `;
}


// ── Main export ───────────────────────────────────────────────────────────────

export function renderDealHtml(property) {
  const contactNumber = property.seller_contact || "—";
  
  // Amenities loop
  const amenitiesList = Array.isArray(property.amenities) && property.amenities.length
    ? property.amenities.map(item => `<span class="badge">${item}</span>`).join("")
    : `<span class="badge" style="background:transparent; border:none; padding-left:0; color:var(--muted);"><span style="display:none;"></span>No amenities listed</span>`;

  // Documents loop
  const documentsList = Array.isArray(property.documents) && property.documents.length
    ? property.documents.map(d => `<span class="badge badge--doc">${d.split("/").pop()}</span>`).join("")
    : `<span class="badge badge--doc" style="background:transparent; border:none; padding-left:0; color:var(--muted);"><span style="display:none;"></span>No documents uploaded</span>`;

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>MyMane – ${property.title || "Property Listing"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --green:        #1E3A2F;
      --green-mid:    #2C5040;
      --green-light:  #3D6B57;
      --gold:         #B8975A;
      --gold-light:   #D4B07A;
      --gold-pale:    #F0E4CC;
      --cream:        #FAF7F2;
      --cream-deep:   #F2EDE3;
      --warm-white:   #FFFDF9;
      --ink:          #1A1A18;
      --ink-soft:     #3A3A36;
      --muted:        #8A8A80;
      --border:       #DDD8CE;
    }

    body {
      font-family: 'Jost', sans-serif;
      background: #e8e4dc;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      padding: 40px 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ══════════════════════ A4 PAGE SHELL */
    .page {
      width: 210mm;
      min-height: 297mm;
      background: var(--cream);
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 80px rgba(0,0,0,0.25);
    }

    .page + .page {
      margin-top: 24px;
    }

    @media print {
      @page { margin: 0; size: A4; }
      body { padding: 0 !important; margin: 0; background: none; }
      .page { 
        width: 100vw; 
        min-height: 100vh;
        box-shadow: none; 
        page-break-after: always;
      }
      .page + .page { margin-top: 0; }
      .page:last-child { page-break-after: avoid; }
    }

    /* ══════════════════════ PAGE 1 */

    /* Top header bar */
    .header {
      background: var(--green);
      padding: 0 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
      position: relative;
    }

    .header::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 40%, transparent 100%);
    }

    .logo-area {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .logo-wordmark {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 22pt;
      font-weight: 700;
      color: #fff;
      letter-spacing: 2px;
      line-height: 1;
    }

    .logo-wordmark span {
      color: var(--gold-light);
    }

    .logo-tagline {
      font-size: 6.5pt;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      font-weight: 300;
    }

    .header-badge {
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--gold-light);
      border: 1px solid var(--gold);
      padding: 5px 14px;
      border-radius: 2px;
    }

    /* Hero section */
    .hero {
      padding: 36px 48px 28px;
      background: var(--warm-white);
      border-bottom: 1px solid var(--border);
      position: relative;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 180px; height: 180px;
      background: radial-gradient(circle at top right, var(--gold-pale) 0%, transparent 70%);
      opacity: 0.5;
      pointer-events: none;
    }

    .hero-eyebrow {
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 10px;
    }

    .hero-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 36pt;
      font-weight: 700;
      color: var(--green);
      line-height: 1.05;
      margin-bottom: 14px;
    }

    .hero-location {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10pt;
      color: var(--ink-soft);
      font-weight: 400;
    }

    .pin-icon {
      width: 14px; height: 14px;
      color: var(--gold);
      flex-shrink: 0;
    }

    .map-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 7.5pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--green-light);
      text-decoration: none;
      border-bottom: 1px solid var(--gold);
      padding-bottom: 1px;
      margin-left: 14px;
    }

    /* Stats strip */
    .stats {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .stat {
      padding: 18px 16px;
      text-align: center;
      border-right: 1px solid var(--border);
      background: var(--cream-deep);
    }

    .stat:last-child { border-right: none; }

    .stat-val {
      font-family: 'Cormorant Garamond', serif;
      font-size: 18pt;
      font-weight: 600;
      color: var(--green);
      display: block;
      line-height: 1;
      margin-bottom: 5px;
    }

    .stat-lbl {
      font-size: 6.5pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--muted);
      display: block;
    }

    /* Detail section */
    .details-section {
      padding: 26px 48px 20px;
    }

    .section-label {
      font-size: 6.5pt;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--gold);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }

    .detail-item {
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .detail-item:nth-child(odd) {
      padding-right: 32px;
    }

    .detail-item:nth-child(even) {
      padding-left: 32px;
      border-left: 1px solid var(--border);
    }

    .d-label {
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--muted);
    }

    .d-value {
      font-size: 10.5pt;
      color: var(--ink);
      font-weight: 400;
      line-height: 1.4;
    }

    /* Amenities */
    .amenities-section {
      padding: 20px 48px;
      border-top: 1px solid var(--border);
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--warm-white);
      border: 1px solid var(--border);
      color: var(--ink-soft);
      font-size: 8pt;
      font-weight: 500;
      padding: 5px 12px;
      border-radius: 2px;
      letter-spacing: 0.3px;
    }

    .badge::before {
      content: '✦';
      font-size: 6pt;
      color: var(--gold);
    }

    .badge--doc {
      background: #EEF4EE;
      border-color: #C2D8C2;
      color: var(--green-mid);
    }

    .badge--doc::before { color: var(--green-light); }

    /* Contact footer P1 */
    .contact-strip {
      margin: 16px 48px 32px;
      background: var(--green);
      padding: 20px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .contact-strip::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 4px; height: 100%;
      background: var(--gold);
    }

    .contact-strip::after {
      content: '';
      position: absolute;
      right: -20px; top: -40px;
      width: 120px; height: 120px;
      border-radius: 50%;
      background: rgba(255,255,255,0.03);
    }

    .contact-left .c-label {
      font-size: 6.5pt;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: var(--gold-light);
      font-weight: 600;
      display: block;
      margin-bottom: 5px;
    }

    .contact-left .c-number {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22pt;
      font-weight: 600;
      color: #fff;
      letter-spacing: 1px;
    }

    .contact-right {
      font-size: 8.5pt;
      color: rgba(255,255,255,0.55);
      max-width: 200px;
      text-align: right;
      line-height: 1.6;
      font-weight: 300;
    }

    /* Whatsapp icon line */
    .whatsapp-line {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 5px;
      margin-top: 4px;
      font-size: 8pt;
      color: rgba(255,255,255,0.4);
    }

    /* ══════════════════════ PAGE 2 */

    .p2-header {
      background: var(--green);
      height: 60px;
      padding: 0 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .p2-header::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 40%, transparent 100%);
    }

    .p2-ref {
      font-size: 8pt;
      color: rgba(255,255,255,0.35);
      font-style: italic;
      font-weight: 300;
      letter-spacing: 0.3px;
    }

    .p2-body {
      padding: 32px 48px;
    }

    /* Floor plan */
    .fp-section {
      margin-bottom: 30px;
    }

    .fp-frame {
      background: var(--warm-white);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 14px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      position: relative;
    }

    .fp-frame img {
      max-width: 100%;
      max-height: 230px;
      object-fit: contain;
    }

    .fp-placeholder {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--cream-deep), var(--gold-pale));
      color: var(--muted);
      font-size: 9pt;
      font-style: italic;
      letter-spacing: 0.5px;
      border: 2px dashed var(--border);
      border-radius: 2px;
    }

    /* Photo grid */
    .photos-section { }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 4px;
    }

    .photo-cell {
      position: relative;
      overflow: hidden;
      border-radius: 3px;
      border: 1px solid var(--border);
      background: var(--cream-deep);
    }

    .photo-cell img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }

    .photo-label {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: linear-gradient(transparent, rgba(15,30,22,0.82));
      color: rgba(255,255,255,0.9);
      font-size: 7pt;
      font-weight: 500;
      letter-spacing: 0.8px;
      padding: 18px 8px 6px;
      text-align: center;
    }

    .photo-placeholder {
      width: 100%;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--cream-deep), var(--gold-pale) 80%);
      color: var(--muted);
      font-size: 8pt;
      font-style: italic;
    }

    .photo-single {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }

    .photo-single .photo-cell {
      width: 32%;
    }

    /* P2 contact */
    .p2-contact {
      margin-top: 24px;
      background: var(--green);
      padding: 18px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }

    .p2-contact::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 4px; height: 100%;
      background: var(--gold);
    }

    .contact-left .c-label {
      font-size: 6.5pt;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: var(--gold-light);
      font-weight: 600;
      display: block;
      margin-bottom: 5px;
    }

    .contact-left .c-number {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22pt;
      font-weight: 600;
      color: #fff;
      letter-spacing: 1px;
    }

    .contact-right {
      font-size: 8.5pt;
      color: rgba(255,255,255,0.55);
      max-width: 200px;
      text-align: right;
      line-height: 1.6;
      font-weight: 300;
    }

    /* ══════════════════════ PRINT */
    @page { size: A4; margin: 0; }

    @media print {
      body {
        background: white;
        padding: 0;
        gap: 0;
      }
      .page {
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>

  <!-- ═══════════════════════════════════ PAGE 1 -->
  <div class="page">

    <div class="header">
      <div class="logo-area">
        <div class="logo-wordmark">my<span>mane</span></div>
        <div class="logo-tagline">Your Home Journey</div>
      </div>
      <div class="header-badge">${property.deal_type || "Ready to Move"}</div>
    </div>

    <!-- Hero -->
    <div class="hero">
      <div class="hero-eyebrow">${property.type} · ${property.bhk_type || "N/A"}</div>
      <div class="hero-title">${property.title || "Property"}</div>
      <div class="hero-location">
        <svg class="pin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        ${property.location || "—"}
        ${mapLinkMarkup(property.map_url)}
      </div>
    </div>

    <!-- Stats strip -->
    <div class="stats">
      <div class="stat">
        <span class="stat-val">${property.bhk_type || property.type || "—"}</span>
        <span class="stat-lbl">Type</span>
      </div>
      <div class="stat">
        <span class="stat-val">${property.area ? property.area : "—"}</span>
        <span class="stat-lbl">Sq.ft Built-up</span>
      </div>
      <div class="stat">
        <span class="stat-val">${property.carpet_area ? "~" + property.carpet_area : "—"}</span>
        <span class="stat-lbl">Sq.ft Carpet</span>
      </div>
      <div class="stat">
        <span class="stat-val">${property.facing || "—"}</span>
        <span class="stat-lbl">Facing</span>
      </div>
      <div class="stat">
        <span class="stat-val">${property.balcony_count || "—"}</span>
        <span class="stat-lbl">Balconies</span>
      </div>
    </div>

    <!-- Detail grid -->
    <div class="details-section">
      <div class="section-label">Property Details</div>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="d-label">Year Built</span>
          <span class="d-value">${property.year_built || "—"}</span>
        </div>
        <div class="detail-item">
          <span class="d-label">Deal Type</span>
          <span class="d-value">${property.deal_type || "—"}</span>
        </div>
        <div class="detail-item">
          <span class="d-label">Property Facing</span>
          <span class="d-value">${property.facing || "—"}</span>
        </div>
        <div class="detail-item">
          <span class="d-label">Location</span>
          <span class="d-value">${property.location || "—"}</span>
        </div>
      </div>
    </div>

    <!-- Amenities -->
    <div class="amenities-section">
      <div class="section-label">Amenities</div>
      <div class="badge-row">
        ${amenitiesList}
      </div>

      <div class="section-label" style="margin-top: 18px;">Documents</div>
      <div class="badge-row">
        ${documentsList}
      </div>
    </div>

    <!-- Contact -->
    <div class="contact-strip">
      <div class="contact-left">
        <span class="c-label">Contact Seller</span>
        <div class="c-number">${contactNumber}</div>
      </div>
      <div class="contact-right">
        We will reach out via WhatsApp on the dates of the site visits.
        <div class="whatsapp-line">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp preferred
        </div>
      </div>
    </div>

  </div>

  <!-- ═══════════════════════════════════ PAGE 2 -->
  <div class="page">

    <div class="p2-header">
      <div class="logo-area">
        <div class="logo-wordmark">my<span>mane</span></div>
        <div class="logo-tagline">Your Home Journey</div>
      </div>
      <span class="p2-ref">${property.title || "Property"} — Visual Reference</span>
    </div>

    <div class="p2-body">

      <!-- Floor Plan -->
      ${floorPlanMarkup(property.floor_plan)}

      <!-- Photos -->
      <div class="photos-section">
        <div class="section-label">Property Photos</div>
        ${photosMarkup(property.images)}
      </div>

      <!-- Contact -->
      <div class="p2-contact">
        <div class="contact-left">
          <span class="c-label">Contact Seller</span>
          <div class="c-number">${contactNumber}</div>
        </div>
        <div class="contact-right">
          We will reach out via WhatsApp on the dates of the site visits.
        </div>
      </div>

    </div>
  </div>

</body>
</html>
  `;
}