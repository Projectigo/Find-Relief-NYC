<div align="center">

# 🚻 Find Relief NYC

### **Public restrooms and essential city amenities — when you need them most.**

**A fast, accessible, multilingual civic-tech experience built with NYC public data.**

<br>

[![Built with React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Built with Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Maps](https://img.shields.io/badge/Maps-Leaflet-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![NYC Open Data](https://img.shields.io/badge/Data-NYC%20Open%20Data-103FEF)](https://opendata.cityofnewyork.us/)
[![Hackathon Project](https://img.shields.io/badge/Project-Built%20for%20NYC-111827)](#-hackathon)

<br>

**One search. One map. One less barrier to experiencing New York City.**

</div>

---

## 🌆 What is Find Relief NYC?

**Find Relief NYC** turns fragmented public city data into one simple, practical experience for finding nearby public restrooms across New York City.

Search by **address, ZIP code, or current location** to quickly see:

- 🚻 Nearby public restrooms
- 🕐 Today's operating hours
- ♿ Accessibility information
- 👶 Changing-station availability
- 🚰 Drinking-water fountains
- 📶 Free public Wi-Fi
- 🚲 Bike shelters
- 🏠 NYC drop-in centers
- 🌐 Multilingual access

Instead of forcing users to search through multiple datasets, agency pages, or raw government records, Find Relief NYC brings the information together in a format designed for **real-world urgency**.

---

## 💡 Why we built it

Find Relief NYC began with a problem that is both deeply personal and remarkably common.

For co-creator **Randy Diaz**, living with Crohn's disease means restroom access is not simply a matter of convenience. It can determine whether navigating New York City feels possible at all.

Yet restroom information can be scattered, incomplete, difficult to interpret, or unavailable at the exact moment it matters most.

Randy and **Ryan Diaz** created Find Relief NYC to turn that fragmented public information into a more useful, inclusive city utility — one designed for people who need answers quickly.

The project is built with the needs of many New Yorkers in mind, including:

- People living with disabilities or medical conditions
- Parents traveling with children
- Older New Yorkers
- Tourists and visitors unfamiliar with the city
- Anyone dealing with an unexpected bathroom emergency
- Residents who benefit from multilingual access to city information

> **Our goal is simple: take public data that already belongs to New Yorkers and make it useful at the moment they need it most.**

---

## ✨ Core features

### 🔎 Smart restroom search

Search using:

- NYC street address
- 5-digit ZIP code
- Current device location

Results are ranked by proximity so users can immediately see the closest options.

---

### 🟢 Open now

By default, Find Relief NYC prioritizes restrooms that appear to be open based on:

- NYC's posted operating hours
- Current New York City time
- Parsed daily schedules

Users can switch between:

**Open now** · **Show all**

If the city's schedule is unclear or cannot be interpreted safely, the app avoids falsely labeling the restroom as open.

---

### 🕐 Today's hours first

Raw operating-hour strings can be difficult to read.

Find Relief NYC highlights **today's schedule first**, then lets users expand a result to see the full weekly schedule in a cleaner format.

---

### ♿ Accessibility filters

Users can filter for restrooms with accessibility information and combine that requirement with other needs.

Missing data is clearly labeled instead of being treated as a positive match.

---

### 👶 Changing-station filters

Users can filter by:

- **Any**
- **Men's**
- **Women's**

When NYC confirms that a changing station exists but does not specify exactly where it is located, Find Relief NYC keeps it available under **Any** instead of making an unsupported assumption.

---

### 🗺️ Interactive NYC map

Explore restroom and amenity locations using:

- Split view
- Map-only view
- List-only view
- Borough filtering
- ZIP boundary visualization
- Search-location marker
- Clickable map results
- Google Maps directions
- Optional scroll-wheel map zoom

The layout is responsive across desktop, tablet, and mobile.

---

### 🏙️ Optional nearby city amenities

The main experience stays focused on restroom access.

Users can optionally add nearby public-service layers:

| Amenity | Purpose |
|---|---|
| 🚰 **Water fountains** | Public drinking-water fountains |
| 📶 **Free Wi-Fi** | Public Wi-Fi hotspot locations |
| 🚲 **Bike shelters** | Covered bicycle parking structures |
| 🏠 **Drop-in centers** | Walk-in NYC service centers |

These layers are secondary by design so the restroom experience remains fast and uncluttered.

---

### 🌐 Language access

New York City is one of the most linguistically diverse cities in the world.

Find Relief NYC includes a visible language control and can suggest translation when a user's browser is set to a supported non-English language.

The goal is to make public information easier to use regardless of a person's preferred language.

---

### 📡 Data-source status

The interface shows whether each city data source is:

- **Live**
- **Cached**
- **Loading**
- **Offline**

If a live endpoint is temporarily unavailable, the app can fall back to a previously cached successful response when one exists.

That keeps the prototype more resilient during real-world outages and public-data maintenance windows.

---

## 🧭 User experience philosophy

Find Relief NYC was designed around a simple question:

> **What does someone need to know when they need a restroom right now?**

That led to a few product principles:

- Put the closest restroom first
- Prioritize today's information
- Make "Open now" the default
- Keep secondary city services optional
- Never invent missing government data
- Use plain language instead of dataset terminology
- Make accessibility and language inclusion part of the product, not an afterthought

---

## 🗂️ NYC data sources

Find Relief NYC uses public NYC datasets and city services including:

- 🚻 **NYC Public Restrooms**
- 🚰 **NYC Parks Drinking Fountains**
- 📶 **NYC public Wi-Fi hotspot data**
- 🚲 **NYC DOT Bicycle Parking Shelters**
- 🏠 **NYC DHS Directory of Homeless Drop-In Centers**
- 🗺️ **NYC ZIP Code Tabulation Areas**
- 🏙️ **NYC Borough Boundaries**
- 🔎 **NYC Planning GeoSearch**
- 🧭 **OpenStreetMap** map tiles

> Data availability and completeness depend on the underlying public records. Find Relief NYC clearly labels missing information instead of inventing values.

---

## 🧰 Tech stack

| Technology | Use |
|---|---|
| **React** | Front-end application |
| **Vite** | Development and build tooling |
| **JavaScript** | Application logic |
| **Leaflet** | Interactive maps |
| **React Leaflet** | React map components |
| **NYC Open Data / Socrata APIs** | Public city datasets |
| **NYC Planning GeoSearch** | Address lookup |
| **OpenStreetMap** | Map tiles |
| **Browser Geolocation API** | Current-location search |
| **Google Maps URLs** | Directions |
| **Google Translate integration** | Language access |
| **LocalStorage** | Cached dataset fallback |

---

## 📁 Project structure

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

## 🚀 Run locally

### 1. Clone the repository

```bash
git clone https://github.com/Projectigo/Find-Relief-NYC.git
```

### 2. Enter the project folder

```bash
cd Find-Relief-NYC
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Vite will typically provide:

```text
http://localhost:5173/
```

---

## 📦 Required map dependencies

If needed:

```bash
npm install leaflet react-leaflet
```

---

## 🧪 Current project status

**Hackathon prototype / active development**

The application currently supports:

- ✅ Public restroom search
- ✅ Address search
- ✅ ZIP search
- ✅ Current-location search
- ✅ Open-now filtering
- ✅ Accessibility filtering
- ✅ Changing-station filtering
- ✅ Today's hours
- ✅ Weekly schedules
- ✅ Borough filtering
- ✅ Interactive map
- ✅ Water fountains
- ✅ Public Wi-Fi
- ✅ Bike shelters
- ✅ Drop-in centers
- ✅ Language control
- ✅ Live/cached source status
- ✅ Responsive layouts
- ✅ Creator page

---

## 👥 Creators

### Randy Diaz
**Co-Creator — Find Relief NYC**  
**The Diaz Brothers · RedTail Digital Group**

🔗 LinkedIn:  
https://www.linkedin.com/in/randy-diaz-99a231242/

✉️ Email:  
`redtaildigitalgroup@gmail.com`

---

### Ryan Diaz
**Co-Creator — Find Relief NYC**  
**The Diaz Brothers · RedTail Digital Group**

🔗 LinkedIn:  
https://www.linkedin.com/in/ryan-diaz-35ba92429/

✉️ Email:  
`redtaildigitalgroup@gmail.com`

---

## 🔒 Privacy

Creator contact cards intentionally contain **no phone numbers**.

Public creator contact options are limited to:

- RedTail Digital Group email
- Individual LinkedIn profiles
- Phone-free vCard contact downloads

---

## 🏆 Hackathon

Find Relief NYC was created for the **Built for NYC: AI Hackathon at NYPL**, organized by the **New York Public Library** and **Major League Hacking**, with support from **Google.org**.

The project explores how public data can be transformed from raw government records into a fast, inclusive, human-centered city utility.

---

## ❤️ Mission

<div align="center">

### **Make NYC public data useful at the exact moment someone needs it.**

**One search. One map. One less barrier to experiencing New York City.**

</div>

---

## ⚠️ Disclaimer

Find Relief NYC is a **hackathon civic-tech prototype** and is **not an official New York City government service**.

Operating hours, accessibility information, changing-station details, amenity availability, and other public records may change.

Users should verify critical information when necessary.

---

<div align="center">

### 🚻 **Find Relief NYC**

Built by **The Diaz Brothers**  
**RedTail Digital Group**

</div>
