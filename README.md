---

# Keiretsu

A proximity-based network for students and engineers to discover, connect, and collaborate with builders nearby.

https://keiretsu.vercel.app/

---

## Overview

Keiretsu helps you find technically strong people around you—on campus or within your locality—based on what they’re actually building and the skills they have. Instead of random networking, it enables targeted collaboration.

---

## Features

* Proximity-based discovery of developers
* Skill and tech-stack filtering
* Live map interface for exploring nearby builders
* Profile-based collaboration with availability signals

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-Frontend-black)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Styling-38B2AC)
![Render](https://img.shields.io/badge/Render-Deployment-purple)

---

## Project Structure

```
keiretsu/
├── public/
├── src/
├── supabase/
├── package.json
└── README.md
```

---

## Setup

Clone the repository:

```
git clone https://github.com/your-username/keiretsu.git
cd keiretsu
```

Install dependencies:

```
npm install
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run the development server:

```
npm run dev
```

---

## Database

Schema and policies are managed using Supabase migrations:

```
supabase/migrations/
```

---

## Notes

* Environment variables are not committed
* Only schema is tracked, no real user data
* Designed for campus-scale and local tech communities

---

## Author

Bharadwaj

---

