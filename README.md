# Find Relief NYC

**Public restrooms and essential city amenities, when you need them most.**

Find Relief NYC is a responsive civic-tech web app that turns NYC public data into a simple, practical tool for finding nearby public restrooms across New York City.

Search by **address, ZIP code, or current location** to see the closest restrooms, today's hours, accessibility information, changing-station details, drinking-water fountains, and optional nearby city services.

Built for the **Built for NYC: AI Hackathon at NYPL** by **The Diaz Brothers — Randy Diaz and Ryan Diaz — of RedTail Digital Group**.

---

## Why we built it

Find Relief NYC began with a problem that is both deeply personal and remarkably common.

For co-creator **Randy Diaz**, living with Crohn's disease means restroom access is not simply a matter of convenience. It can determine whether navigating New York City feels possible at all. Yet the information people need is often scattered across datasets, difficult to interpret, or unavailable at the exact moment it matters most.

Randy and **Ryan Diaz** created Find Relief NYC to turn that fragmented public information into a simple, inclusive city utility.

The project is designed for:

- People living with disabilities or medical conditions
- Parents traveling with children
- Older New Yorkers
- Visitors unfamiliar with the city
- Anyone dealing with an unexpected bathroom emergency
- New Yorkers who benefit from multilingual access to city information

**Our goal is simple: take public data that already belongs to New Yorkers and make it useful at the moment they need it most.**

---

## Core features

### Find nearby public restrooms

- Search by NYC address
- Search by ZIP code
- Use browser location when available
- Rank restrooms from nearest to farthest
- Open directions in Google Maps

### Open now

The app prioritizes restrooms that appear to be open according to NYC's posted operating hours and the current New York time.

Users can switch between:

- **Open now**
- **Show all**

If a city's hours record cannot be interpreted confidently, the app avoids falsely labeling that restroom as open.

### Today's hours

Instead of displaying a long, difficult-to-read schedule, the app highlights **today's hours first**.

Users can expand a restroom result to see the full weekly schedule in an organized format.

### Accessibility and changing stations

Users can combine restroom filters, including:

- Accessible restrooms
- Changing stations
- Changing table location:
  - Any
  - Men's
  - Women's

When NYC confirms a changing station but does not specify its exact restroom location, the app keeps that location available under **Any** rather than making an unsupported assumption.

### Citywide interactive map

- View restroom locations across NYC
- Split view
- Map-only view
- List-only view
- Borough filtering
- ZIP-area map boundaries
- Optional scroll-wheel map zoom
- Responsive layouts for desktop, tablet, and mobile

### Nearby city amenities

The main experience stays focused on restroom access, while optional map layers can show:

- Drinking-water fountains
- Free public Wi-Fi
- Bike shelters
- NYC drop-in centers

Short information tooltips explain less-familiar city services.

### Language access

Find Relief NYC includes an always-available language control and can detect a non-English browser language to suggest translation.

The goal is to make the tool useful to more New Yorkers without requiring them to understand government datasets or technical terminology.

### Resilient city-data handling

If a NYC dataset is temporarily unavailable, the app can use the most recently cached successful response when available.

The interface also shows the current status of its city-data sources.

---

## NYC data sources

Find Relief NYC uses public NYC datasets and services including:

- NYC Public Restrooms
- NYC Parks Drinking Fountains
- NYC public Wi-Fi hotspot data
- NYC DOT Bicycle Parking Shelters
- NYC DHS Directory of Homeless Drop-In Centers
- NYC ZIP Code Tabulation Areas
- NYC Borough Boundaries
- NYC Planning GeoSearch

Map tiles are provided by **OpenStreetMap**.

> Data availability and completeness depend on the underlying public datasets. Find Relief NYC presents the best information available and clearly labels missing or unspecified fields rather than inventing information.

---

## Tech stack

- React
- Vite
- JavaScript
- Leaflet
- React Leaflet
- NYC Open Data / Socrata APIs
- NYC Planning GeoSearch
- OpenStreetMap
- Browser Geolocation API
- Google Maps directions links
- Google Translate integration/fallback
- LocalStorage caching

---

## Run locally

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd YOUR_REPOSITORY_FOLDER
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Vite will provide a local development URL, typically:

```text
http://localhost:5173/
```

---

## Required packages

If needed, install the map dependencies with:

```bash
npm install leaflet react-leaflet
```

---

## Project structure

```text
src/
├── main.jsx
├── App.jsx
├── App.css
├── enhancements.css
├── LanguageControl.jsx
├── hours.js
├── index.css
└── assets/
    ├── randy-diaz.jpg
    └── ryan-diaz.jpg
```

---

## Privacy

The creator contact cards included in the project intentionally contain **no phone numbers**.

Public creator contact options are limited to:

- RedTail Digital Group email
- Individual LinkedIn profiles
- Phone-free vCard contact downloads

---

## Creators

### Randy Diaz
Co-Creator, Find Relief NYC  
RedTail Digital Group

- LinkedIn: https://www.linkedin.com/in/randy-diaz-99a231242/
- Email: redtaildigitalgroup@gmail.com

### Ryan Diaz
Co-Creator, Find Relief NYC  
RedTail Digital Group

- LinkedIn: https://www.linkedin.com/in/ryan-diaz-35ba92429/
- Email: redtaildigitalgroup@gmail.com

---

## Hackathon

Created for the **Built for NYC: AI Hackathon at NYPL**, organized by the New York Public Library and Major League Hacking with support from Google.org.

The project explores how NYC public data can be transformed from raw government records into a fast, inclusive, human-centered city utility.

---

## Mission

> **One search. One map. One less barrier to experiencing New York City.**

---

## Disclaimer

Find Relief NYC is a hackathon civic-tech prototype and is not an official New York City government service.

Operating hours, accessibility information, changing-station details, amenity availability, and other records may change. Users should use the information as a practical guide and verify critical details when necessary.
