# DevFolio Frontend

React + Vite frontend for Shanjid Ahmed Jimmy's portfolio and blog. All portfolio content is loaded from the Django API; the React source contains no hard-coded portfolio data.

## Run

```powershell
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend API base URL, such as `http://127.0.0.1:8000/api`.

## Design direction

The interface follows a soft modern editorial direction: warm neutral surfaces, moss-green text, a coral accent, rounded cards, generous spacing, and a dark theme with deep-green surfaces. Design tokens live in `src/App.css`, with an 8px spacing rhythm applied across public and owner views.

Backend repository: https://github.com/GME000/shanjid-ahmed-jimmy-portfolio-backend
Frontend repository: https://github.com/GME000/shanjid-ahmed-jimmy-portfolio-frontend
