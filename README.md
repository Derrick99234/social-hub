# 🚀 Unified Social Content Hub & Multi-Platform Scheduler

> A production-ready web dashboard enabling founders and digital marketers to **write once and publish/schedule to multiple channels in 1 click (X/Twitter, LinkedIn, Instagram, Threads)** via **Typefully** and **Buffer** APIs, backed by **Supabase PostgreSQL & Storage**.

---

## 🌟 Key Value Proposition & Features

1. **⚡ 1-Click Multi-Channel Distribution:**
   - Post simultaneously across **X (Twitter)**, **Threads**, **LinkedIn**, and **Instagram**.
   - Channels can be toggled individually or selected all at once.
   - Per-channel limits and status tracking (X 280, Threads 500, LinkedIn 3000, Instagram 2200).

2. **👀 Real-Time Live Mockup Previews:**
   - **X / Twitter**: Real feed mockup with verified badge, engagement mockups, and automatic **thread break previews** (`1/2`, `2/2`) when copy exceeds 280 characters.
   - **LinkedIn**: Professional feed card with author headline, connection degree, and clickable **"...see more"** truncation toggle.
   - **Instagram**: Mobile frame card with 1:1 media container, story ring, action bar, and bold caption preview.
   - **Threads**: Minimalist modern Threads card with vertical thread loop avatar.

3. **⏰ Forward Scheduling Engine:**
   - Date & Time pickers with local timezone support.
   - Quick one-click presets: *Tomorrow 9:00 AM*, *Tomorrow 2:00 PM*, *In 3 Days 10:00 AM*.
   - Platform queue management without exceeding free-tier limits.
   - Dual actions: **"🚀 Post to Selected Channels Now"** or **"⏰ Schedule Ahead"**.

4. **💡 Zero-Friction Founder-Marketer Workflow:**
   - **Founder Mode (Idea Inbox):** Rapidly dump raw thoughts, bullet points, client quotes, or simulated voice memos on mobile or desktop.
   - **Marketer Mode (Polisher & Scheduler):** Marketer reviews raw thoughts, clicks **"✨ Move to Composer"**, refines with **"Polish with AI"**, attaches media, selects channels, and publishes/schedules.

5. **🖼️ Supabase Storage Asset Piping:**
   - Drag & drop images (PNG, JPG, WebP) and short video clips directly to Supabase Storage bucket (`media`).
   - Automatically attaches public media URLs to Buffer and Typefully payloads.
   - Built-in local preview fallback when testing offline.

6. **🔐 Simple Passkey / PIN Authentication:**
   - Minimalist glassmorphic access screen.
   - Mobile-friendly passkey authentication (Default: `marketer123` or custom in `.env.local`).

7. **📊 Platform Audit Logs Inspector:**
   - Inspect the exact HTTP payloads and responses sent to Typefully API and Buffer API.
   - Records external IDs, status (`published`, `scheduled`, `simulated`, `failed`), and error messages.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 14+ (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS, Lucide Icons, Custom Glassmorphic Dark Design System
- **Database & Media Storage:** Supabase (PostgreSQL + Supabase Storage Bucket `media`)
- **APIs Integrated:**
  - **Typefully API:** `https://api.typefully.com/v1/drafts/` (for X/Twitter & Threads)
  - **Buffer API:** `https://api.bufferapp.com/1/updates/create.json` (for LinkedIn & Instagram)
- **Zero-Config Sandbox Mode:** If API keys or Supabase credentials are not set, the app seamlessly runs in **Simulated Sandbox Mode** with zero runtime crashes or blank screens.

---

## 🚀 Quick Start Guide

### 1. Installation & Local Development
```bash
# Navigate to the project directory
cd c:\Users\User\Desktop\personal\social-content-hub

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Login Credentials
Enter the default passkey:
```
Passkey: marketer123
Role: Digital Marketer or Founder
```
*(You can customize this passkey in `.env.local` using `DASHBOARD_PASSKEY`)*

---

## ⚙️ Environment Variables Configuration (`.env.local`)

Copy `.env.example` to `.env.local` and add your real keys:

```env
# 🔐 Access Passkey
DASHBOARD_PASSKEY=marketer123

# 🐦 Typefully API (X / Twitter & Threads)
TYPEFULLY_API_KEY=your_typefully_api_key_here

# 💼 Buffer API (LinkedIn & Instagram)
BUFFER_ACCESS_TOKEN=your_buffer_access_token_here
BUFFER_LINKEDIN_PROFILE_ID=your_linkedin_profile_id
BUFFER_INSTAGRAM_PROFILE_ID=your_instagram_profile_id

# ⚡ Supabase (Database & Storage All-In-One)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=media
```

---

## 🗄️ Supabase Setup (1-Click SQL Script)

1. Open your Supabase Project: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to the **SQL Editor** in the left sidebar.
3. Open `supabase/schema.sql` from this repository and paste its contents into the editor.
4. Click **Run**.

This script sets up:
- `posts` table (stores campaigns, copy, channels, status, scheduled times, media URLs)
- `dispatch_logs` table (stores per-channel external API IDs and audit payloads)
- `ideas` table (stores Founder raw thought drops and voice memos)
- `media` storage bucket with public read access and service-role uploads.
- Auto-updating `updated_at` triggers and sample seed data.

---

## 🔌 API Integration Details

### A. Typefully API (X / Twitter & Threads)
- **Endpoint:** `POST https://api.typefully.com/v1/drafts/`
- **Headers:** `X-API-KEY: process.env.TYPEFULLY_API_KEY`, `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "content": "Your post content...",
    "schedule_date": "2026-10-06T09:00:00.000Z",
    "threadify": true,
    "share": true
  }
  ```

### B. Buffer API (LinkedIn & Instagram)
- **Endpoint:** `POST https://api.bufferapp.com/1/updates/create.json`
- **Headers:** `Authorization: Bearer process.env.BUFFER_ACCESS_TOKEN`
- **Payload:**
  ```json
  {
    "profile_ids": ["LINKEDIN_PROFILE_ID", "INSTAGRAM_PROFILE_ID"],
    "text": "Your post content...",
    "scheduled_at": 1759586400,
    "now": false,
    "media": {
      "photo": "https://[your-project].supabase.co/storage/v1/object/public/media/image.jpg"
    }
  }
  ```

---

## 🧪 Testing the API Suite
A test suite is included to verify all routes anytime:
```bash
node ./scripts/test-api.mjs
```
Runs automated checks for authentication, status health, ideas inbox, 1-click publishing, and forward scheduling!
