import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import "./enhancements.css";
import LanguageControl from "./LanguageControl";
import { openState, parseHours, tidyRawHours, todayHours, weeklyHours, nycClock } from "./hours";
import randyPhoto from "./assets/randy-diaz.jpg";
import ryanPhoto from "./assets/ryan-diaz.jpg";

const API = "https://data.cityofnewyork.us/resource";
const NYC_SEARCH = "https://geosearch.planninglabs.nyc/v2/search";
const NYC_AUTOCOMPLETE = "https://geosearch.planninglabs.nyc/v2/autocomplete";
const ZIP_GEOJSON = `${API}/35j5-n34v.geojson?$limit=500`;
const BOROUGH_GEOJSON = `${API}/gthc-hcne.geojson?$limit=10`;
const NYC_BOUNDS = [[40.4774, -74.2591], [40.9176, -73.7004]];
const NEARBY_RADIUS_MILES = 0.5;

const LAYERS = {
  restroom: {
    label: "Restrooms",
    color: "#3B82F6",
    cache: "nyc-relief-restrooms-v7",
    geojson: [`${API}/i7jb-7jku.geojson?$limit=5000`],
  },
  fountain: {
    label: "Water fountains",
    color: "#06B6D4",
    cache: "nyc-relief-fountains-v7",
    geojson: [`${API}/qnv7-p7a2.geojson?$limit=5000`],
  },
  wifi: {
    label: "Free Wi-Fi",
    color: "#A855F7",
    cache: "nyc-relief-wifi-v7",
    geojson: [`${API}/yjub-udmw.geojson?$limit=5000`],
  },
  bike: {
    label: "Bike shelters",
    color: "#22C55E",
    cache: "nyc-relief-bike-v7",
    geojson: [`${API}/dimy-qyej.geojson?$limit=5000`],
  },
  shelter: {
    label: "Drop-in centers",
    color: "#F43F5E",
    cache: "nyc-relief-shelters-v7",
    json: [`${API}/bmxf-3rd4.json?$limit=100`],
    geocodeFallback: true,
  },
};

const BOROUGHS = ["All NYC", "Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"];

const userIcon = L.divIcon({
  className: "user-marker-wrap",
  html: '<div class="user-marker"><div></div></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function MapController({ focus, resetKey, viewMode }) {
  const map = useMap();

  useEffect(() => {
    const timers = [0, 80, 220].map((delay) =>
      setTimeout(() => map.invalidateSize({ pan: false }), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [map, viewMode]);

  useEffect(() => {
    if (focus?.bounds) {
      map.fitBounds(focus.bounds, { padding: [28, 28], maxZoom: focus.maxZoom || 14 });
      return;
    }
    if (focus?.lat && focus?.lon) {
      map.flyTo([focus.lat, focus.lon], focus.zoom || 15, { duration: 0.65 });
      return;
    }
    map.fitBounds(NYC_BOUNDS, { padding: [20, 20] });
  }, [focus, resetKey, map]);

  return null;
}

function ScrollZoomController({ enabled }) {
  const map = useMap();
  useEffect(() => {
    if (enabled) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
  }, [enabled, map]);
  return null;
}

function clean(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function firstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = clean(obj?.[key]);
    if (value) return value;
  }
  return fallback;
}

function friendly(label) {
  const messages = {
    Hours: "Hours not provided by NYC",
    Accessibility: "Accessibility information not specified by NYC yet",
    "Changing-station information": "Changing-station information not specified by NYC yet",
    Operator: "Operator information not available",
    Status: "Current facility status not specified by NYC yet",
    "Network name": "Network name not specified by NYC",
    Address: "Address not specified by NYC yet",
    Phone: "Phone number not specified by NYC yet",
  };
  return messages[label] || `${label} not specified by NYC yet`;
}

function changingStationInfo(value) {
  const text = clean(value).toLowerCase();
  if (!text || /not specified|unknown|n\/?a/i.test(text)) {
    return { has: false, men: false, women: false, specified: false };
  }
  if (/\b(no|none|without|unavailable)\b/i.test(text)) {
    return { has: false, men: false, women: false, specified: true };
  }
  const has = /yes|available|changing|table|station|\b1\b|\b2\b|both/i.test(text);
  const men = /\bmen(?:'s)?\b|\bmale\b|\bboys?\b/i.test(text);
  const women = /\bwomen(?:'s)?\b|\bfemale\b|\bgirls?\b/i.test(text);
  return { has, men, women, specified: true };
}

function isAccessible(value) {
  const text = clean(value).toLowerCase();
  if (!text || /not specified|unknown|n\/?a/i.test(text)) return false;
  if (/not accessible|\bno\b|none|inaccessible/i.test(text)) return false;
  return /accessible|fully|yes|wheelchair/i.test(text);
}

function restroomAvailability(restroom, timestamp) {
  const status = clean(restroom?.status).toLowerCase();
  if (status && !/not specified|unknown/i.test(status) && /closed|temporarily closed|construction/i.test(status)) {
    return { state: "closed", label: "Closed now" };
  }
  return openState(restroom?.hoursSchedule, timestamp);
}

function normalizeBorough(value) {
  const text = clean(value).toLowerCase();
  if (!text) return "";
  if (["bronx", "bx", "2"].includes(text)) return "Bronx";
  if (["brooklyn", "bk", "kings", "k", "3"].includes(text)) return "Brooklyn";
  if (["manhattan", "mn", "new york", "m", "1"].includes(text)) return "Manhattan";
  if (["queens", "qn", "q", "4"].includes(text)) return "Queens";
  if (["staten island", "si", "richmond", "r", "5"].includes(text)) return "Staten Island";
  return value;
}

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const rad = (n) => (n * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polygonCenter(ring) {
  if (!ring?.length) return null;
  let x = 0;
  let y = 0;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    x += (x1 + x2) * cross;
    y += (y1 + y2) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-12) return ring[Math.floor(ring.length / 2)] || null;
  return [x / (6 * area), y / (6 * area)];
}

function geometryCenter(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point") return geometry.coordinates;
  if (geometry.type === "Polygon") return polygonCenter(geometry.coordinates?.[0]);
  if (geometry.type === "MultiPolygon") {
    let bestRing = null;
    let bestSize = 0;
    for (const polygon of geometry.coordinates || []) {
      const ring = polygon?.[0];
      if (ring?.length > bestSize) {
        bestRing = ring;
        bestSize = ring.length;
      }
    }
    return polygonCenter(bestRing);
  }
  if (geometry.type === "LineString") {
    const coords = geometry.coordinates || [];
    return coords[Math.floor(coords.length / 2)] || null;
  }
  return null;
}

function geometryBounds(geometry) {
  const points = [];
  const walk = (coords) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      points.push(coords);
      return;
    }
    coords.forEach(walk);
  };
  walk(geometry?.coordinates);
  if (!points.length) return null;
  const lats = points.map((p) => p[1]);
  const lons = points.map((p) => p[0]);
  return [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lon, lat, polygon) {
  if (!polygon?.length || !pointInRing(lon, lat, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(lon, lat, polygon[i])) return false;
  }
  return true;
}

function pointInGeometry(lon, lat, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return pointInPolygon(lon, lat, geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((polygon) => pointInPolygon(lon, lat, polygon));
  return false;
}

function coordsFromProperties(props) {
  const lat = Number.parseFloat(firstValue(props, ["latitude", "lat", "y"]));
  const lon = Number.parseFloat(firstValue(props, ["longitude", "lon", "lng", "long", "x"]));
  if (Number.isFinite(lat) && Number.isFinite(lon)) return [lon, lat];
  return null;
}

function normalizePoint(feature, category, index) {
  const p = feature.properties || {};
  const coords = geometryCenter(feature.geometry) || coordsFromProperties(p);
  if (!coords) return null;
  const lon = Number.parseFloat(coords[0]);
  const lat = Number.parseFloat(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < 40.3 || lat > 41.1 || lon < -74.5 || lon > -73.45) return null;

  const base = {
    id: `${category}-${firstValue(p, ["objectid", "id", "uid"], index)}-${lat}-${lon}`,
    category,
    lat,
    lon,
    borough: normalizeBorough(firstValue(p, ["borough", "boro", "boroname", "boro_name", "city"])),
    raw: p,
  };

  if (category === "restroom") {
    const hoursRaw = firstValue(p, ["hours_of_operation", "hours", "operating_hours"], "");
    const changingStation = firstValue(p, ["changing_stations", "changing_station", "baby_changing_station"], friendly("Changing-station information"));
    return {
      ...base,
      name: firstValue(p, ["facility_name", "name", "location_name", "park_name"], "NYC Public Restroom"),
      hoursRaw,
      hoursSchedule: parseHours(hoursRaw),
      accessibility: firstValue(p, ["accessibility", "ada_accessible", "ada"], friendly("Accessibility")),
      changingStation,
      changingInfo: changingStationInfo(changingStation),
      operator: firstValue(p, ["operator", "agency"], friendly("Operator")),
      status: firstValue(p, ["status", "open"], friendly("Status")),
      type: firstValue(p, ["location_type", "facility_type", "restroom_type"], "Public restroom"),
    };
  }

  if (category === "fountain") {
    return {
      ...base,
      name: firstValue(p, ["name", "park_name", "propertyname", "signname", "location"], "NYC Parks Drinking Fountain"),
      detail: firstValue(p, ["description", "location", "park_name", "propertyname"], "NYC Parks drinking fountain"),
    };
  }

  if (category === "wifi") {
    return {
      ...base,
      name: firstValue(p, ["name", "location", "address", "site_name"], "Free Public Wi-Fi"),
      provider: firstValue(p, ["provider", "wifi_provider", "operator"], "NYC public Wi-Fi"),
      ssid: firstValue(p, ["ssid", "network_name"], friendly("Network name")),
    };
  }

  if (category === "bike") {
    return {
      ...base,
      name: firstValue(p, ["name", "location", "address", "shelter_location"], "Bicycle Parking Shelter"),
      detail: firstValue(p, ["location", "cross_street", "street", "borough"], "NYC DOT bicycle parking shelter"),
    };
  }

  if (category === "shelter") {
    return {
      ...base,
      name: firstValue(p, ["center", "center_name", "name", "facility", "facility_name"], "Drop-in center"),
      address: firstValue(p, ["address", "location", "street_address"], friendly("Address")),
      phone: firstValue(p, ["phone", "telephone", "phone_number"], friendly("Phone")),
      services: firstValue(p, ["services", "service", "description", "comments"], "Meals, showers, support services, and indoor space may be available; confirm directly with the center."),
    };
  }

  return base;
}

function uniquePoints(points) {
  const seen = new Set();
  return points.filter((point) => {
    const key = `${point.category}|${point.lat.toFixed(5)}|${point.lon.toFixed(5)}|${point.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchGeoJSON(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (!Array.isArray(json.features)) throw new Error("Invalid GeoJSON");
  return json.features;
}

async function fetchJSON(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (!Array.isArray(json)) throw new Error("Invalid JSON");
  return json;
}

function rowAddress(row, category) {
  const address = firstValue(row, ["address", "location", "street_address", "business_address"]);
  const borough = normalizeBorough(firstValue(row, ["borough", "boro", "city"]));
  if (!address) return "";
  if (category === "shelter") return `${address}${borough ? `, ${borough}` : ""}, New York, NY`;
  return `${address}${borough ? `, ${borough}` : ""}, New York, NY`;
}

async function geocodeText(text) {
  const response = await fetchWithTimeout(`${NYC_SEARCH}?text=${encodeURIComponent(text)}&size=1`, 7000);
  if (!response.ok) return null;
  const data = await response.json();
  const feature = data.features?.[0];
  const coords = feature?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  return { lon: coords[0], lat: coords[1] };
}

async function normalizeRowsWithGeocoding(rows, category) {
  const output = [];
  const pending = [];

  rows.forEach((row, index) => {
    const direct = normalizePoint({ type: "Feature", geometry: null, properties: row }, category, index);
    if (direct) output.push(direct);
    else pending.push({ row, index });
  });

  const chunkSize = 4;
  for (let i = 0; i < pending.length; i += chunkSize) {
    const chunk = pending.slice(i, i + chunkSize);
    const resolved = await Promise.all(chunk.map(async ({ row, index }) => {
      const address = rowAddress(row, category);
      if (!address) return null;
      try {
        const coords = await geocodeText(address);
        if (!coords) return null;
        return normalizePoint({ type: "Feature", geometry: { type: "Point", coordinates: [coords.lon, coords.lat] }, properties: row }, category, index);
      } catch {
        return null;
      }
    }));
    output.push(...resolved.filter(Boolean));
  }

  return output;
}

function boroughNameFromFeature(feature) {
  const p = feature?.properties || {};
  return normalizeBorough(firstValue(p, ["boro_name", "borough", "boroname", "name", "boro"]));
}

function findBoroughForPoint(point, boundaries) {
  if (point.borough && BOROUGHS.includes(point.borough)) return point.borough;
  const feature = boundaries.find((candidate) => pointInGeometry(point.lon, point.lat, candidate.geometry));
  return feature ? boroughNameFromFeature(feature) : "";
}

function amenityLabel(point) {
  if (point.category === "wifi") return point.provider || point.ssid;
  if (point.category === "shelter") return point.address;
  return point.detail || LAYERS[point.category]?.label;
}


const SERVICE_INFO = {
  fountain: "Public drinking-water fountains listed by NYC Parks.",
  services: "Optional city amenity layers you can display around your restroom search.",
  wifi: "Public Wi-Fi hotspots where you can connect without paying.",
  bike: "Covered NYC DOT structures where you can park and lock a bicycle.",
  shelter: "Walk-in NYC service centers for people experiencing homelessness. Services can include meals, showers, support, and indoor space.",
};

function InfoHint({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="info-hint" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="info-hint-button"
        aria-label={`About ${label}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && <span className="info-hint-popover" role="tooltip">{children}</span>}
    </span>
  );
}

function SourceHealth({ statuses }) {
  const entries = Object.entries(LAYERS).map(([key, layer]) => ({ key, layer, status: statuses[key] }));
  const ready = entries.filter((item) => ["live", "cached"].includes(item.status?.mode)).length;
  return (
    <div className="source-health-wrap">
      <div className="source-health">
        <i className={ready ? "health-dot live" : "health-dot"} />
        <strong>{ready}/{entries.length}</strong>
        <span>city data sources ready</span>
      </div>
      <InfoHint label="city data sources">
        <strong className="source-popover-title">City data status</strong>
        <span className="source-popover-copy">The finder uses NYC public datasets. Cached data is used only when a city source is temporarily unavailable.</span>
        <span className="source-popover-list">
          {entries.map(({ key, layer, status }) => (
            <span className="source-popover-row" key={key}>
              <i style={{ background: layer.color }} />
              <b>{layer.label}</b>
              <em>{status?.mode || "loading"}</em>
            </span>
          ))}
        </span>
      </InfoHint>
    </div>
  );
}

function makeVCard(name, linkedin) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    "ORG:RedTail Digital Group",
    "TITLE:Co-Creator, Find Relief NYC",
    "EMAIL;TYPE=INTERNET:redtaildigitalgroup@gmail.com",
    `URL:${linkedin}`,
    "END:VCARD",
  ].join("\\n");
}

function FounderCard({ image, name, linkedin, bio, filename }) {
  const vcard = `data:text/vcard;charset=utf-8,${encodeURIComponent(makeVCard(name, linkedin))}`;
  return (
    <article className="about-founder-card">
      <div className="about-founder-photo-wrap">
        <img className="about-founder-photo" src={image} alt={`${name}, co-creator of Find Relief NYC`} />
      </div>
      <div className="about-founder-content">
        <span className="about-founder-kicker">The Diaz Brothers</span>
        <h2>{name}</h2>
        <strong>Co-Creator · RedTail Digital Group</strong>
        <p>{bio}</p>
        <div className="about-founder-actions">
          <a href={linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
          <a href="mailto:redtaildigitalgroup@gmail.com">Email</a>
          <a href={vcard} download={filename}>Add contact +</a>
        </div>
      </div>
    </article>
  );
}

function AboutPage({ onBack }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="about-page-shell">
      <header className="about-page-hero">
        <nav className="top-nav about-top-nav">
          <button type="button" className="brand" onClick={onBack}>
            <span className="brand-mark">FR</span>
            <span><strong>Find Relief NYC</strong><small>Public restroom & amenity finder</small></span>
          </button>
          <div className="top-nav-tools">
            <button type="button" className="about-back-button" onClick={onBack}>← Back to finder</button>
            <LanguageControl />
          </div>
        </nav>
        <div className="about-hero-inner">
          <span className="eyebrow">WHY WE BUILT IT</span>
          <h1>Built by New Yorkers, for New Yorkers.</h1>
          <p>Find Relief NYC turns fragmented city information into a practical tool people can use in the exact moment they need it.</p>
        </div>
      </header>

      <main className="about-page-main">
        <section className="about-story">
          <p>
            Find Relief NYC began with a problem that is both deeply personal and remarkably common. For Randy Diaz, living with Crohn’s disease means access to a restroom is not simply a matter of convenience—it can determine whether navigating New York City feels possible at all. Yet the information people need is often scattered across datasets, difficult to interpret, or unavailable at the exact moment it matters most.
          </p>
          <p>
            Randy and Ryan Diaz created Find Relief NYC to turn that fragmented public information into a simple, inclusive city utility. The project is designed not only for people living with disabilities or medical conditions, but also for parents traveling with children, older New Yorkers, visitors unfamiliar with the city, and anyone caught in an unexpected bathroom emergency. Because New York is one of the world’s most linguistically diverse cities, language access is built into the experience rather than treated as an afterthought.
          </p>
          <blockquote>One search. One map. One less barrier to experiencing New York City.</blockquote>
        </section>

        <section className="about-founders-grid">
          <FounderCard
            image={randyPhoto}
            name="Randy Diaz"
            linkedin="https://www.linkedin.com/in/randy-diaz-99a231242/"
            filename="randy-diaz.vcf"
            bio="Randy helped shape the product from lived experience, focusing on urgency, accessibility, and inclusive design for New Yorkers who need dependable restroom information in real life—not just on paper."
          />
          <FounderCard
            image={ryanPhoto}
            name="Ryan Diaz"
            linkedin="https://www.linkedin.com/in/ryan-diaz-35ba92429/"
            filename="ryan-diaz.vcf"
            bio="Ryan helped translate the idea into a polished civic-tech experience, focusing on clarity, usability, and a city-service interface that feels trustworthy, modern, and easy to understand."
          />
        </section>
      </main>

      <footer className="about-page-footer">
        <strong>Find Relief NYC</strong>
        <span>The Diaz Brothers · RedTail Digital Group</span>
      </footer>
    </div>
  );
}

export default function App() {
  const explorerRef = useRef(null);
  const [page, setPage] = useState("finder");
  const searchInputRef = useRef(null);
  const [datasets, setDatasets] = useState({ restroom: [], fountain: [], wifi: [], bike: [], shelter: [] });
  const [statuses, setStatuses] = useState({});
  const [boundaries, setBoundaries] = useState([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedZipArea, setSelectedZipArea] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [focus, setFocus] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [boroughFilter, setBoroughFilter] = useState("All NYC");
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [changingRequired, setChangingRequired] = useState(false);
  const [changingGender, setChangingGender] = useState("any");
  const [availabilityFilter, setAvailabilityFilter] = useState("open");
  const [viewMode, setViewMode] = useState("split");
  const [activeLayers, setActiveLayers] = useState(new Set(["restroom"]));
  const [additionalServicesOpen, setAdditionalServicesOpen] = useState(false);
  const [mapScrollZoom, setMapScrollZoom] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedHoursId, setExpandedHoursId] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const scrollToExplorer = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => explorerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    });
  }, []);

  const loadBoundaries = useCallback(async () => {
    try {
      const features = await fetchGeoJSON(BOROUGH_GEOJSON);
      setBoundaries(features);
    } catch (error) {
      console.warn("Borough boundaries unavailable", error);
    }
  }, []);

  const loadLayer = useCallback(async (category, silent = false) => {
    const config = LAYERS[category];
    if (!silent) setStatuses((s) => ({ ...s, [category]: { mode: "loading", count: 0 } }));

    let points = [];
    try {
      if (config.geojson) {
        const results = await Promise.allSettled(config.geojson.map(fetchGeoJSON));
        const features = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
        points = features.map((feature, index) => normalizePoint(feature, category, index)).filter(Boolean);
      }

      if ((!points.length || config.geocodeFallback) && config.json) {
        const results = await Promise.allSettled(config.json.map(fetchJSON));
        const rows = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
        if (rows.length && (!points.length || category === "shelter")) {
          const geocoded = await normalizeRowsWithGeocoding(rows, category);
          if (geocoded.length) points = category === "shelter" ? geocoded : [...points, ...geocoded];
        }
      }

      points = uniquePoints(points);
      if (!points.length) throw new Error("No usable records returned");

      setDatasets((current) => ({ ...current, [category]: points }));
      setStatuses((s) => ({ ...s, [category]: { mode: "live", count: points.length } }));
      try {
        localStorage.setItem(config.cache, JSON.stringify({ savedAt: Date.now(), points }));
      } catch {}
      return;
    } catch (error) {
      console.warn(`${category} load failed`, error);
    }

    try {
      const cached = JSON.parse(localStorage.getItem(config.cache) || "null");
      if (Array.isArray(cached?.points) && cached.points.length) {
        const hydrated = cached.points.map((point) => {
          if (category !== "restroom") return point;
          const hoursRaw = point.hoursRaw || point.hours || "";
          const changingStation = point.changingStation || friendly("Changing-station information");
          return {
            ...point,
            hoursRaw,
            hoursSchedule: point.hoursSchedule?.days ? point.hoursSchedule : parseHours(hoursRaw),
            changingStation,
            changingInfo: point.changingInfo || changingStationInfo(changingStation),
          };
        });
        setDatasets((current) => ({ ...current, [category]: hydrated }));
        setStatuses((s) => ({ ...s, [category]: { mode: "cached", count: hydrated.length } }));
        return;
      }
    } catch {}

    setStatuses((s) => ({ ...s, [category]: { mode: "offline", count: 0 } }));
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadBoundaries(), ...Object.keys(LAYERS).map((category) => loadLayer(category))]);
  }, [loadBoundaries, loadLayer]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 3 || /^\d{5}$/.test(text)) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetchWithTimeout(`${NYC_AUTOCOMPLETE}?text=${encodeURIComponent(text)}&size=7`, 6000);
        if (!response.ok) return;
        const data = await response.json();
        setSuggestions(data.features || []);
      } catch {
        setSuggestions([]);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  function chooseSuggestion(feature) {
    const coords = feature?.geometry?.coordinates;
    if (!coords) {
      setSearchMessage("That NYC result did not include a usable map location.");
      return;
    }
    const location = {
      lat: coords[1],
      lon: coords[0],
      label: feature.properties?.label || feature.properties?.name || query,
    };
    setSelectedLocation(location);
    setSelectedZipArea(null);
    setFocus({ ...location, zoom: 15 });
    setQuery(location.label);
    setSuggestions([]);
    setSelectedPoint(null);
    setSearchMessage(`Showing the closest city resources to ${location.label}.`);
    scrollToExplorer();
  }

  function zipMatches(feature, zip) {
    const p = feature.properties || {};
    return Object.entries(p).some(([key, value]) => {
      if (!/(zip|zcta|postal)/i.test(key)) return false;
      return clean(value).replace(/\.0$/, "").padStart(5, "0") === zip;
    });
  }

  async function resolveZip(zip) {
    const response = await fetchWithTimeout(ZIP_GEOJSON, 9000);
    if (!response.ok) throw new Error(`ZIP layer returned ${response.status}`);
    const geojson = await response.json();
    const feature = geojson.features?.find((candidate) => zipMatches(candidate, zip));
    if (!feature) return null;
    const center = geometryCenter(feature.geometry);
    const bounds = geometryBounds(feature.geometry);
    if (!center || !bounds) return null;
    return {
      location: { lat: center[1], lon: center[0], label: `ZIP ${zip}` },
      feature,
      bounds,
    };
  }

  async function searchAddress(text) {
    try {
      const response = await fetchWithTimeout(`${NYC_SEARCH}?text=${encodeURIComponent(text)}&size=8`, 7000);
      if (response.ok) {
        const data = await response.json();
        if (data.features?.length === 1) {
          chooseSuggestion(data.features[0]);
          return;
        }
        if (data.features?.length > 1) {
          setSuggestions(data.features);
          setSearchMessage("Choose the correct NYC location from the suggestions.");
          return;
        }
      }
      const fuzzy = await fetchWithTimeout(`${NYC_AUTOCOMPLETE}?text=${encodeURIComponent(text)}&size=8`, 7000);
      if (fuzzy.ok) {
        const data = await fuzzy.json();
        if (data.features?.length) {
          setSuggestions(data.features);
          setSearchMessage("I found similar NYC locations. Choose the right one.");
          return;
        }
      }
      setSearchMessage("Address not found. Try the house number and street name, or enter a 5-digit NYC ZIP code.");
    } catch {
      setSearchMessage("NYC address search is temporarily unavailable. ZIP search may still work.");
    }
  }

  async function handleSearch() {
    const text = query.trim();
    if (!text) {
      setSearchMessage("Enter a NYC address or 5-digit ZIP code.");
      return;
    }
    setSearching(true);
    setSuggestions([]);
    try {
      if (/^\d{5}$/.test(text)) {
        const result = await resolveZip(text);
        if (!result) {
          setSearchMessage(`ZIP ${text} was not found in the official NYC ZIP boundary layer.`);
        } else {
          setSelectedLocation(result.location);
          setSelectedZipArea(result.feature);
          setSelectedPoint(null);
          setFocus({ bounds: result.bounds, maxZoom: 14 });
          setSearchMessage(`Centered on the official NYC boundary for ZIP ${text}.`);
          scrollToExplorer();
        }
      } else {
        await searchAddress(text);
      }
    } catch (error) {
      console.error(error);
      setSearchMessage("That search could not be completed right now. Try again in a moment.");
    } finally {
      setSearching(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setSearchMessage("Location is unavailable in this browser. Search by address or ZIP instead.");
      return;
    }
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lon: position.coords.longitude, label: "Your current location" };
        setSelectedLocation(location);
        setSelectedZipArea(null);
        setSelectedPoint(null);
        setFocus({ ...location, zoom: 15 });
        setSearchMessage("Showing the closest city resources to your location.");
        setSearching(false);
        scrollToExplorer();
      },
      () => {
        setSearchMessage("Windows or your browser blocked location access. Search by address or ZIP instead.");
        setSearching(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  const boroughForPoint = useCallback((point) => findBoroughForPoint(point, boundaries), [boundaries]);

  const boroughFiltered = useMemo(() => {
    const output = {};
    Object.keys(LAYERS).forEach((category) => {
      output[category] = datasets[category].filter((point) => {
        if (boroughFilter === "All NYC") return true;
        return boroughForPoint(point) === boroughFilter;
      });
    });
    return output;
  }, [datasets, boroughFilter, boroughForPoint]);

  const filteredRestrooms = useMemo(() => {
    const items = boroughFiltered.restroom || [];
    return items.filter((item) => {
      if (accessibleOnly && !isAccessible(item.accessibility)) return false;

      if (changingRequired) {
        const info = item.changingInfo || changingStationInfo(item.changingStation);
        if (!info.has) return false;
        if (changingGender === "men" && !info.men) return false;
        if (changingGender === "women" && !info.women) return false;
      }

      if (availabilityFilter === "open" && restroomAvailability(item, nowTick).state !== "open") return false;
      return true;
    });
  }, [boroughFiltered, accessibleOnly, changingRequired, changingGender, availabilityFilter, nowTick]);

  const nearestRestrooms = useMemo(() => {
    if (!selectedLocation) return [];
    return filteredRestrooms
      .map((item) => ({ ...item, distance: distanceMiles(selectedLocation.lat, selectedLocation.lon, item.lat, item.lon) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);
  }, [filteredRestrooms, selectedLocation]);

  const visiblePoints = useMemo(() => {
    const points = [];
    Object.keys(LAYERS).forEach((category) => {
      if (!activeLayers.has(category)) return;
      const source = category === "restroom" ? filteredRestrooms : boroughFiltered[category] || [];
      points.push(...source);
    });
    return points;
  }, [activeLayers, filteredRestrooms, boroughFiltered]);

  function nearestAmenity(restroom, category) {
    let best = null;
    for (const item of boroughFiltered[category] || []) {
      const distance = distanceMiles(restroom.lat, restroom.lon, item.lat, item.lon);
      if (!best || distance < best.distance) best = { item, distance };
    }
    return best?.distance <= NEARBY_RADIUS_MILES ? best : null;
  }

  function nearbyAmenities(restroom) {
    return ["fountain", "wifi", "bike", "shelter"]
      .map((category) => ({ category, result: nearestAmenity(restroom, category) }))
      .filter((entry) => entry.result);
  }

  function toggleLayer(category) {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function handleBoroughChange(value) {
    setBoroughFilter(value);
    if (value === "All NYC") {
      setFocus(null);
      setResetKey((v) => v + 1);
      return;
    }
    const feature = boundaries.find((candidate) => boroughNameFromFeature(candidate) === value);
    const bounds = feature ? geometryBounds(feature.geometry) : null;
    if (bounds) setFocus({ bounds, maxZoom: 12 });
  }

  function selectPoint(point) {
    setSelectedPoint(point);
    setFocus({ lat: point.lat, lon: point.lon, zoom: 16 });
  }

  function directions(point) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lon}`, "_blank", "noopener,noreferrer");
  }

  function resetNYC() {
    setSelectedLocation(null);
    setSelectedZipArea(null);
    setSelectedPoint(null);
    setFocus(null);
    setQuery("");
    setSearchMessage("");
    setBoroughFilter("All NYC");
    setAccessibleOnly(false);
    setChangingRequired(false);
    setChangingGender("any");
    setAvailabilityFilter("open");
    setMapScrollZoom(false);
    setResetKey((v) => v + 1);
  }

  if (page === "about") {
    return <AboutPage onBack={() => { setPage("finder"); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" })); }} />;
  }

  return (
    <div className="app-shell">
      <header className="top-hero">
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <nav className="top-nav">
          <button type="button" className="brand" onClick={resetNYC}>
            <span className="brand-mark">FR</span>
            <span><strong>Find Relief NYC</strong><small>Public restroom & amenity finder</small></span>
          </button>
          <div className="top-nav-tools">
            <div className="top-nav-links">
              <button type="button" onClick={scrollToExplorer}>Explore</button>
              <button type="button" onClick={() => { setPage("about"); window.scrollTo({ top: 0, behavior: "auto" }); }}>Why we built it</button>
            </div>
            <SourceHealth statuses={statuses} />
            <LanguageControl />
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">BUILT FOR NEW YORKERS</span>
            <h1>Find a public restroom <em>when you need it.</em></h1>
            <p>Search by address, ZIP code, or your current location. See today’s hours, accessibility, changing stations, drinking water, and optional nearby city services.</p>
          </div>

          <div className="search-console">
            <label htmlFor="search">Where are you in NYC?</label>
            <div className="search-row">
              <div className="search-input-wrap">
                <span>⌕</span>
                <input ref={searchInputRef} id="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Address or ZIP code, for example 10034" autoComplete="off" />
                {suggestions.length > 0 && (
                  <div className="suggestions">
                    <div className="suggestion-head">Choose a NYC match</div>
                    {suggestions.map((feature, index) => (
                      <button type="button" key={index} onClick={() => chooseSuggestion(feature)}><i />{feature.properties?.label || "NYC location"}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="search-btn" onClick={handleSearch} disabled={searching}>{searching ? "Finding…" : "Find restrooms"}</button>
            </div>
            <div className="search-actions">
              <button type="button" onClick={useMyLocation}>◎ Use my location</button>
              <span>ZIP searches use NYC ZIP boundaries, not address guesses.</span>
            </div>
            {searchMessage && <div className="search-message" role="status">{searchMessage}</div>}
          </div>
        </div>
      </header>

      <section className="control-band" ref={explorerRef}>
        <div className="control-left">
          <div className="field-group">
            <label htmlFor="borough">Borough</label>
            <select id="borough" value={boroughFilter} onChange={(e) => handleBoroughChange(e.target.value)}>
              {BOROUGHS.map((borough) => <option key={borough}>{borough}</option>)}
            </select>
          </div>
          <div className="view-switch" aria-label="View mode">
            <button className={viewMode === "split" ? "active" : ""} onClick={() => setViewMode("split")}>Split view</button>
            <button className={viewMode === "map" ? "active" : ""} onClick={() => setViewMode("map")}>Map only</button>
            <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>List only</button>
          </div>
        </div>
        <button type="button" className="all-nyc-btn" onClick={resetNYC}>Reset to all NYC</button>
      </section>

      <section className="layer-band">
        <div className="layer-primary">
          <button type="button" className={activeLayers.has("restroom") ? "layer-chip active" : "layer-chip"} onClick={() => toggleLayer("restroom")}>
            <i style={{ background: LAYERS.restroom.color }} />
            <span>Restrooms</span>
            <b>{boroughFiltered.restroom?.length || 0}</b>
          </button>

          <span className="layer-chip-with-info">
            <button type="button" className={activeLayers.has("fountain") ? "layer-chip active" : "layer-chip"} onClick={() => toggleLayer("fountain")}>
              <i style={{ background: LAYERS.fountain.color }} />
              <span>Water fountains</span>
              <b>{boroughFiltered.fountain?.length || 0}</b>
            </button>
            <InfoHint label="water fountains">{SERVICE_INFO.fountain}</InfoHint>
          </span>

          <div className="additional-services">
            <span className="layer-chip-with-info">
              <button type="button" className="additional-services-toggle" onClick={() => setAdditionalServicesOpen((value) => !value)} aria-expanded={additionalServicesOpen}>
                <b>+</b> Nearby services {additionalServicesOpen ? "⌃" : "⌄"}
              </button>
              <InfoHint label="nearby services">{SERVICE_INFO.services}</InfoHint>
            </span>
            {additionalServicesOpen && (
              <div className="additional-services-panel">
                <span>Optional map layers</span>
                {["wifi", "bike", "shelter"].map((category) => {
                  const config = LAYERS[category];
                  return (
                    <span className="service-row" key={category}>
                      <button type="button" className={activeLayers.has(category) ? "layer-chip active" : "layer-chip"} onClick={() => toggleLayer(category)}>
                        <i style={{ background: config.color }} />
                        <span>{config.label}</span>
                        <b>{boroughFiltered[category]?.length || 0}</b>
                      </button>
                      <InfoHint label={config.label}>{SERVICE_INFO[category]}</InfoHint>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="filter-stack">
          <div className="availability-segment">
            <span>Availability</span>
            <button type="button" className={availabilityFilter === "open" ? "filter-toggle open-now active" : "filter-toggle open-now"} onClick={() => setAvailabilityFilter("open")}>
              <i className="live-pulse" /> Open now
            </button>
            <button type="button" className={availabilityFilter === "all" ? "filter-toggle active" : "filter-toggle"} onClick={() => setAvailabilityFilter("all")}>Show all</button>
          </div>

          <div className="restroom-options restroom-features">
            <span><b>Restroom features</b><small>Choose any that apply</small></span>
            <button type="button" aria-pressed={accessibleOnly} className={accessibleOnly ? "filter-toggle active" : "filter-toggle"} onClick={() => setAccessibleOnly((value) => !value)}>♿ Accessible</button>
            <button type="button" aria-pressed={changingRequired} className={changingRequired ? "filter-toggle active" : "filter-toggle"} onClick={() => setChangingRequired((value) => !value)}>Changing station</button>
          </div>

          {changingRequired && (
            <div className="changing-gender">
              <span>Changing table location</span>
              {[
                ["any", "Any"],
                ["men", "Men's"],
                ["women", "Women's"],
              ].map(([value, label]) => (
                <button type="button" key={value} className={changingGender === value ? "active" : ""} onClick={() => setChangingGender(value)}>{label}</button>
              ))}
              <small className="changing-note">NYC does not specify the changing-table location for every restroom. Choose <strong>Any</strong> to include confirmed changing stations whose restroom location is not specified.</small>
            </div>
          )}

          <div className="open-now-note">
            “Open now” is based on NYC's posted hours at {nycClock(nowTick).displayTime} New York time. Locations with unclear hours stay under Show all.
          </div>
        </div>
      </section>

      <main className={`explorer ${viewMode}`}>
        {viewMode !== "list" && (
          <section className="map-pane">
            <MapContainer bounds={NYC_BOUNDS} minZoom={9} maxZoom={19} preferCanvas scrollWheelZoom={false} className="map">
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController focus={focus} resetKey={resetKey} viewMode={viewMode} />
              <ScrollZoomController enabled={mapScrollZoom} />
              {selectedZipArea && <GeoJSON key={query} data={selectedZipArea} style={{ color: "#60A5FA", weight: 2, fillColor: "#3B82F6", fillOpacity: 0.08 }} />}
              {selectedLocation && <Marker position={[selectedLocation.lat, selectedLocation.lon]} icon={userIcon}><Popup><strong>{selectedLocation.label}</strong><br />Search location</Popup></Marker>}
              {visiblePoints.map((point) => {
                const config = LAYERS[point.category];
                const selected = selectedPoint?.id === point.id;
                return (
                  <CircleMarker key={point.id} center={[point.lat, point.lon]} radius={selected ? 10 : point.category === "restroom" ? 6 : 5} pathOptions={{ color: selected ? "#0F172A" : "#FFFFFF", weight: selected ? 3 : 1.5, fillColor: config.color, fillOpacity: 0.9 }} eventHandlers={{ click: () => setSelectedPoint(point) }}>
                    <Popup>
                      <div className="popup-card">
                        <span style={{ color: config.color }}>{config.label}</span>
                        <strong>{point.name}</strong>
                        <p>{point.category === "restroom" ? `${todayHours(point.hoursSchedule, nowTick).day}: ${todayHours(point.hoursSchedule, nowTick).text}` : amenityLabel(point)}</p>
                        {point.category === "restroom" && <p>{point.accessibility}</p>}
                        <button type="button" onClick={() => directions(point)}>Directions ↗</button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            <button type="button" className={mapScrollZoom ? "map-scroll-control enabled" : "map-scroll-control"} onClick={() => setMapScrollZoom((value) => !value)}>
              {mapScrollZoom ? "✓ Done with scroll zoom" : "⊕ Enable map scroll zoom"}
            </button>
            {!mapScrollZoom && <div className="map-scroll-hint">Mouse wheel scrolls the page. Use +/− to zoom, or enable map scroll zoom.</div>}
            <div className="map-overlay-count"><strong>{visiblePoints.length}</strong><span>visible map locations</span></div>
          </section>
        )}

        {viewMode !== "map" && (
          <section className="list-pane">
            <div className="list-header">
              <div>
                <span className="section-label">NEAREST FIRST</span>
                <h2>{selectedLocation ? "Closest public restrooms" : "Search to rank nearby restrooms"}</h2>
                <p>{selectedLocation ? `From ${selectedLocation.label}${boroughFilter !== "All NYC" ? ` · ${boroughFilter}` : ""}` : `Choose an address, ZIP or your location. ${boroughFilter !== "All NYC" ? `Currently filtering ${boroughFilter}.` : ""}`}</p>
              </div>
              {selectedLocation && <strong className="result-count">{nearestRestrooms.length}</strong>}
            </div>

            {!selectedLocation ? (
              <div className="empty-list"><div>⌁</div><h3>Find what's nearby</h3><p>Search an NYC address or ZIP above and we'll rank the closest usable public restrooms for right now.</p><button type="button" className="start-search-btn" onClick={() => { searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => searchInputRef.current?.focus(), 350); }}>Start a search ↑</button></div>
            ) : nearestRestrooms.length === 0 ? (
              <div className="empty-list"><h3>{availabilityFilter === "open" ? "No confirmed open restrooms match these filters" : "No matching restrooms found"}</h3><p>{availabilityFilter === "open" ? "Try Show all to include closed locations and places whose posted hours could not be safely interpreted." : "Try All NYC or remove one of the current filters."}</p>{availabilityFilter === "open" && <button type="button" className="start-search-btn" onClick={() => setAvailabilityFilter("all")}>Show all nearby</button>}</div>
            ) : (
              <div className="results-list">
                {nearestRestrooms.map((restroom, index) => {
                  const open = expandedId === restroom.id;
                  const fullHoursOpen = expandedHoursId === restroom.id;
                  const amenities = nearbyAmenities(restroom);
                  const today = todayHours(restroom.hoursSchedule, nowTick);
                  const availability = restroomAvailability(restroom, nowTick);
                  const weekly = weeklyHours(restroom.hoursSchedule);
                  return (
                    <article key={restroom.id} className={selectedPoint?.id === restroom.id ? "result-item selected" : "result-item"}>
                      <button type="button" className="result-summary" onClick={() => { setExpandedId(open ? null : restroom.id); selectPoint(restroom); }}>
                        <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                        <span className="result-core">
                          <strong>{restroom.name}</strong>
                          <small className="today-hours"><b>Today</b><span className="today-day">{today.day}</span><span>{today.text}</span><i className={`open-badge ${availability.state}`}>{availability.label}</i></small>
                        </span>
                        <span className="distance">{restroom.distance.toFixed(2)}<small>mi</small></span>
                        <span className={open ? "chevron open" : "chevron"}>⌄</span>
                      </button>

                      {open && (
                        <div className="result-details">
                          <div className="detail-grid">
                            <div><span>Accessibility</span><strong className={restroom.accessibility.includes("not specified") ? "missing-info" : ""}>{restroom.accessibility}</strong></div>
                            <div><span>Changing station</span><strong className={restroom.changingStation.includes("not specified") ? "missing-info" : ""}>{restroom.changingStation}</strong></div>
                            <div><span>Operator</span><strong className={restroom.operator.includes("not available") ? "missing-info" : ""}>{restroom.operator}</strong></div>
                            <div><span>Type / status</span><strong>{restroom.type} · {restroom.status}</strong></div>
                          </div>

                          <div className="hours-section">
                            <div className="hours-section-head">
                              <span>Opening hours</span>
                              <button type="button" onClick={() => setExpandedHoursId(fullHoursOpen ? null : restroom.id)}>{fullHoursOpen ? "Hide full schedule" : "Show full schedule"}</button>
                            </div>
                            {!fullHoursOpen ? (
                              <div className="weekly-hours-row today"><strong>{today.day}</strong><span>{today.text}</span></div>
                            ) : weekly.length ? (
                              <div className="weekly-hours">
                                {weekly.map((row) => <div key={row.day} className={row.day === today.day ? "weekly-hours-row today" : "weekly-hours-row"}><strong>{row.day}</strong><span>{row.text}</span></div>)}
                              </div>
                            ) : (
                              <p className="raw-hours">{tidyRawHours(restroom.hoursRaw)}</p>
                            )}
                          </div>

                          <div className="nearby-block">
                            <span>Within {NEARBY_RADIUS_MILES} mile</span>
                            {amenities.length ? (
                              <div className="amenity-buttons">
                                {amenities.map(({ category, result }) => (
                                  <button key={category} type="button" onClick={() => { setActiveLayers((current) => new Set(current).add(category)); if (["wifi", "bike", "shelter"].includes(category)) setAdditionalServicesOpen(true); setViewMode("split"); selectPoint(result.item); }}>
                                    <i style={{ background: LAYERS[category].color }} />
                                    {LAYERS[category].label} · {result.distance.toFixed(2)} mi
                                  </button>
                                ))}
                              </div>
                            ) : <p>No additional city amenity from these datasets was found within {NEARBY_RADIUS_MILES} mile.</p>}
                          </div>

                          <div className="result-actions">
                            <button type="button" onClick={() => { setViewMode("split"); selectPoint(restroom); }}>Show on map</button>
                            <button type="button" className="primary" onClick={() => directions(restroom)}>Directions ↗</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <section className="data-footer-band">
        <div><strong>Find Relief NYC</strong><span>The Diaz Brothers · RedTail Digital Group</span></div>
        <div className="footer-sources">NYC Open Data · NYC Planning GeoSearch · OpenStreetMap</div>
      </section>
    </div>
  );
}
