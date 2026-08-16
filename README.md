<div align="center">

# 🚻 Find Relief NYC

### **Public restrooms and essential city amenities — when you need them most.**

A fast, accessible, multilingual civic-tech tool built with NYC public data.

<br>

### 🌐 **[Launch the Live Demo →](https://projectigo.github.io/Find-Relief-NYC/)**

<br>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-103FEF?style=for-the-badge&logo=github)](https://projectigo.github.io/Find-Relief-NYC/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![NYC Open Data](https://img.shields.io/badge/NYC-Open%20Data-111827?style=for-the-badge)](https://opendata.cityofnewyork.us/)

<br>

> **One search. One map. One less barrier to experiencing New York City.**

</div>

---

## 🌆 About Find Relief NYC

**Find Relief NYC** turns fragmented New York City public data into one simple, practical experience for finding nearby public restrooms and essential city amenities.

Users can search by **address, ZIP code, or current location** to quickly see:

- 🚻 Nearby public restrooms
- 🟢 Open-now status
- 🕐 Today's operating hours
- ♿ Accessibility information
- 👶 Changing-station availability
- 🚰 Public drinking-water fountains
- 📶 Free public Wi-Fi
- 🚲 Bike shelters
- 🏠 NYC drop-in centers
- 🌐 Language access

Instead of forcing people to search through multiple agency pages, datasets, or raw government records, Find Relief NYC organizes the information around one real-world question:

> **What do I need to know if I need a restroom right now?**

---

## 💡 Why we built it

Find Relief NYC began with a problem that is both deeply personal and remarkably common.

For co-creator **Randy Diaz**, living with Crohn's disease means restroom access is not simply a matter of convenience. It can determine whether navigating New York City feels manageable at all.

When restroom access is uncertain, planning a normal day can come with the anxiety of not knowing whether a usable bathroom will be nearby when the need becomes urgent.

For people with Crohn's disease, IBS, disabilities, pregnancy-related urgency, older adults, or families with young children, the time between realizing a restroom is needed and actually finding one can be very short.

**Most people do not plan their day around bathrooms. They start searching after the need has already arrived.**

That led to one of the central ideas behind the project:

> **When the need happens, searching cannot become another problem.**

For Randy, having this information available ahead of time also provides something equally important: **peace of mind** — the confidence to plan a day outside instead of avoiding plans because of uncertainty around restroom access.

Randy and **Ryan Diaz** built Find Relief NYC to turn that personal challenge into a practical civic tool designed to help **all New Yorkers**.

---

## ✨ Core features

### 🔎 Fast restroom search

Search by:

- NYC street address
- 5-digit ZIP code
- Current device location

Results are ranked by proximity so the closest options are immediately visible.

---

### 🟢 Open now

Find Relief NYC prioritizes restrooms that appear to be open according to:

- NYC's posted operating hours
- Current New York City time
- Parsed daily schedules

Users can switch between:

**Open now** · **Show all**

If the city's schedule cannot be interpreted confidently, the app avoids falsely labeling the restroom as open.

---

### 🕐 Today's hours first

Raw schedule data can be difficult to read.

Find Relief NYC highlights **today's hours first**, with an expandable full weekly schedule for users who need more detail.

---

### ♿ Accessibility

Users can filter for restrooms with accessibility information and combine that requirement with other needs.

Missing data is clearly labeled instead of being treated as a positive match.

---

### 👶 Changing stations

Users can filter changing-station information by:

- **Any**
- **Men's**
- **Women's**

When NYC confirms that a changing station exists but does not specify its exact restroom location, Find Relief NYC keeps the result available under **Any** rather than making an unsupported assumption.

---

### 🗺️ Interactive NYC map

Explore locations using:

- Split view
- Map-only view
- List-only view
- Borough filtering
- ZIP boundary visualization
- Search-location markers
- Clickable restroom results
- Google Maps directions
- Optional scroll-wheel map zoom

The interface is responsive across desktop, tablet, and mobile.

---

### 🏙️ Optional nearby city amenities

The restroom experience remains the primary focus, while users can optionally display:

| Amenity | Purpose |
|---|---|
| 🚰 **Water fountains** | Find nearby public drinking water |
| 📶 **Free Wi-Fi** | Locate public Wi-Fi hotspots |
| 🚲 **Bike shelters** | Find covered bicycle parking |
| 🏠 **Drop-in centers** | Locate walk-in NYC service centers |

This makes the project useful beyond restroom emergencies without cluttering the core experience.

---

## ☀️ Everyday city use

Find Relief NYC is designed for both urgent needs and everyday planning.

A parent can plan a day at a park, museum, or event knowing where nearby restrooms and changing stations are located.

A person with an urgent medical condition can identify nearby options before leaving home and quickly find the closest usable restroom if plans change.

And during a hot New York summer day or heat wave, users can turn on the **Water fountains** layer to answer a much more useful question than simply knowing fountains exist:

> **Where is the closest public drinking water to me right now?**

---

## 🌐 Built for a multilingual city

New York City is one of the most linguistically diverse cities in the world.

Find Relief NYC includes language access so more people can use public information without language becoming another barrier.

For us, accessibility means more than physical accessibility — it also means making public information easier to understand and act on.

---

## 📡 Designed for imperfect real-world data

Public data is valuable, but it is not always clean or complete.

Find Relief NYC was designed to handle:

- Different dataset structures
- Missing fields
- Inconsistent operating-hour formats
- Records with addresses but no coordinates
- Temporary public-data outages

The app can normalize data, geocode certain records, parse schedules, label missing information clearly, and fall back to cached responses when available.

> **We would rather show uncertainty than invent certainty.**

---

## 🗂️ NYC data sources

Find Relief NYC uses public NYC datasets and city services including:

- 🚻 NYC Public Restrooms
- 🚰 NYC Parks Drinking Fountains
- 📶 NYC public Wi-Fi hotspot data
- 🚲 NYC DOT Bicycle Parking Shelters
- 🏠 NYC DHS Directory of Homeless Drop-In Centers
- 🗺️ NYC ZIP Code Tabulation Areas
- 🏙️ NYC Borough Boundaries
- 🔎 NYC Planning GeoSearch
- 🧭 OpenStreetMap

> Data availability and completeness depend on the underlying public records. Find Relief NYC clearly labels missing information instead of inventing values.

---

## 🧰 Tech stack

| Technology | Use |
|---|---|
| **React** | Front-end application |
| **Vite** | Development and production build tooling |
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
| **GitHub Pages** | Live deployment |

---

## 🚀 Live demo

### **[Open Find Relief NYC →](https://projectigo.github.io/Find-Relief-NYC/)**

No installation is required to try the live version.

---

## 💻 Run locally

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

## 📦 Map dependencies

If needed:

```bash
npm install leaflet react-leaflet
```

---

## ✅ Project status

**Live hackathon prototype**

- ✅ Public restroom search
- ✅ Address search
- ✅ ZIP search
- ✅ Current-location search
- ✅ Open-now filtering
- ✅ Today's hours
- ✅ Full weekly schedules
- ✅ Accessibility filtering
- ✅ Changing-station filtering
- ✅ Borough filtering
- ✅ Interactive NYC map
- ✅ Drinking-water fountains
- ✅ Public Wi-Fi
- ✅ Bike shelters
- ✅ Drop-in centers
- ✅ Language control
- ✅ Live/cached data-source status
- ✅ Responsive layouts
- ✅ Creator story
- ✅ Live GitHub Pages deployment

---

## 👥 Creators

### Randy Diaz
**Co-Creator — Find Relief NYC**  
**The Diaz Brothers · RedTail Digital Group**

🔗 [LinkedIn](https://www.linkedin.com/in/randy-diaz-99a231242/)  
✉️ `redtaildigitalgroup@gmail.com`

### Ryan Diaz
**Co-Creator — Find Relief NYC**  
**The Diaz Brothers · RedTail Digital Group**

🔗 [LinkedIn](https://www.linkedin.com/in/ryan-diaz-35ba92429/)  
✉️ `redtaildigitalgroup@gmail.com`

---

## 🔒 Privacy

Public creator contact cards intentionally contain **no phone numbers**.

Contact options are limited to:

- RedTail Digital Group email
- Individual LinkedIn profiles
- Phone-free vCard downloads

---

## 🏆 Hackathon

Find Relief NYC was created for the **Built for NYC: AI Hackathon at NYPL**, organized by the **New York Public Library** and **Major League Hacking**, with support from **Google.org**.

The project explores how public city data can be transformed from raw government records into a fast, inclusive, human-centered utility.

---

## ❤️ Mission

<div align="center">

### **Make NYC public data useful at the exact moment someone needs it.**

### **One search. One map. One less barrier to experiencing New York City.**

</div>

---

## ⚠️ Disclaimer

Find Relief NYC is a **hackathon civic-tech prototype** and is **not an official New York City government service**.

Operating hours, accessibility information, changing-station details, amenity availability, and other public records may change. Users should verify critical information when necessary.

---

<div align="center">

## 🚻 Find Relief NYC

**Built by The Diaz Brothers**  
**RedTail Digital Group**

### **[Launch Live Demo →](https://projectigo.github.io/Find-Relief-NYC/)**

</div>
