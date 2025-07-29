# Hassan Civic Issue Reporter 📍

A full-stack web application that allows the citizens of Hassan to report, view, and track local civic issues. Users can pinpoint problems on an interactive map, upload photos for context, and upvote existing reports to highlight critical issues. The app also includes fun gamification elements to encourage community participation.

## ✨ Features

* **Interactive Map:** Displays all reported issues using Leaflet.js.
* **Clustered Markers:** Automatically groups nearby reports to keep the map clean.
* **Hassan-Specific:** Map view, panning, and search are all restricted to the Hassan district.
* **Flexible Reporting:** Users can report an issue by either clicking a location on the map or using their device's current GPS location.
* **Photo Uploads:** Attach a photo to any report for visual proof and better context.
* **Upvoting System:** Allows users to upvote existing reports, helping to prioritize the most pressing issues.
* **Gamification:**
    * **Points System:** Earn points for reporting and upvoting.
    * **Badges:** Unlock achievements for reaching certain milestones (e.g., "First Report," "Pothole Patrol").
* **Modern UI:**
    * Clean, responsive design that works on both desktop and mobile.
    * Toast notifications for a smooth user experience.
    * Loading indicators and subtle animations.

## 🛠️ Tech Stack

* **Backend:** Python, Flask
* **Database:** SQLite
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Key Libraries:** Leaflet.js, Leaflet-GeoSearch, Leaflet.markercluster, Toastify.js, canvas-confetti

## 🚀 Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Sinchana731/Hassan-Civic-Reporter.git](https://github.com/Sinchana731/Hassan-Civic-Reporter.git)
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd Hassan-Civic-Reporter
    ```
3.  **Create and activate a virtual environment:**
    ```bash
    # Create the environment
    python -m venv venv

    # Activate on Windows
    venv\Scripts\activate

    # Activate on macOS/Linux
    source venv/bin/activate
    ```
4.  **Install the necessary packages:**
    ```bash
    pip install Flask
    ```
5.  **Run the application:**
    ```bash
    python app.py
    ```
6.  Open your web browser and go to `http://127.0.0.1:5000`.
