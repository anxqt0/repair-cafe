# Repair Café — Community Repair Booking

A standalone booking app for a community repair café. Visitors can book a volunteer for an item repair, describe the issue, and review or cancel appointments.

## Stack

- React + Vite frontend
- Node.js 22 + Express API
- Azure SQL Database
- Azure App Service for the API and Azure Static Web Apps for the frontend

## Project layout

```text
repair-cafe/
├── db/
│   ├── schema.sql
│   └── seed-data.sql
├── server/
│   ├── .env.example
│   ├── db.js
│   ├── index.js
│   └── package.json
└── web/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

## Run locally

1. Use Node.js 22 LTS, then install dependencies in `server` and `web` with `npm install`.
2. Copy `server/.env.example` to `server/.env`. For passwordless Azure SQL sign-in, set `AZURE_SQL_SERVER` and `AZURE_SQL_DATABASE`, then sign in with `az login` and grant your account a database user. Alternatively, set `AZURE_SQL_CONNECTION_STRING`.
3. Set `AZURE_API_IDENTITY_NAME` and `AZURE_API_IDENTITY_OBJECT_ID` to the API managed identity values, then run `npm run db:setup` from `server`. The signed-in Entra account must be the SQL server's Entra administrator. The script creates the schema and sample volunteers, then gives the API identity read/write access.
4. Start the API with `npm run dev` from `server` (port 8081).
5. Start the web app with `npm run dev` from `web` (port 5174).

The Vite dev server forwards `/api/*` requests to the local API. Passwordless setup uses the signed-in Azure CLI identity locally and the App Service managed identity in Azure; database passwords are not needed.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | API health check |
| GET | `/volunteers` | List repair volunteers and their specialties |
| GET | `/appointments` | List repair bookings |
| POST | `/appointments` | Book a repair session |
| DELETE | `/appointments/:id` | Cancel a booking |

Bookings are 60-minute sessions. A unique database index prevents the same volunteer from being booked twice for the same start time, including simultaneous requests.

## Deploy to Azure

- Create an Azure SQL database, then run the schema and seed scripts. The API supports passwordless Microsoft Entra authentication with a managed identity.
- Deploy `server/` to an Azure App Service running Node.js 22. Set `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE`, `AZURE_SQL_AUTHENTICATIONTYPE=azure-active-directory-default`, and `CORS_ALLOWED_ORIGINS` in Configuration, then grant the App Service identity access to the database.
- Deploy `web/` to Azure Static Web Apps with app location `web` and output location `dist`.
- Build the frontend with `VITE_API_BASE=https://<api-name>.azurewebsites.net` and allow the Static Web App origin in `CORS_ALLOWED_ORIGINS`.

This starter keeps the same simple Azure PaaS shape as the clinic project and can be extended with Entra ID sign-in, notifications, and event-driven reminders.

## Deployed instance

- Website: <https://thankful-smoke-016e0fb00.2.azurestaticapps.net>
- API: <https://app-repair-cafe-api-66024918.azurewebsites.net>
- Azure resource group: `rg-repair-cafe-dev`
- SQL database: `repaircafe` on `sql-repair-cafe-66024918`
- Hosting: Static Web Apps Free; API on the existing Free App Service plan; Azure SQL General Purpose serverless, one vCore max, auto-pauses after 60 minutes idle

The app uses an App Service managed identity and passwordless Microsoft Entra authentication for SQL. Public appointment listings omit visitor names, item names, and issue descriptions. A private cancellation key is saved in the booking browser so only that browser can cancel its booking.
