# Whitehouse CRM – Master Integrated Enterprise System
### Whitehouse Skill Development Institute, Madurai, Tamil Nadu

---

## 1. Project Overview & Objective

**Whitehouse CRM** is an integrated, production-ready enterprise application engineered specifically for **Whitehouse Skill Development Institute, Madurai**. 

It unifies the entire student and business lifecycle into **one single system**—eliminating disconnected LMS, ERP, or spreadsheet silos. All lead tracking, counselling, admissions, course progress, batch attendance, MCQ testing, fee receipts, QR-verified certificates, and corporate placements run from the same shared MongoDB database.

---

## 2. Technology Stack

- **Frontend:**
  - React 18, Vite 6, Tailwind CSS 3
  - Lucide React (feather-style icons)
  - Recharts (responsive executive dashboards & trend analytics)
  - Axios with automated JWT interceptors & token refresh
  - Socket.IO Client for real-time CRM event notifications
  - Inter Typography & Navy / Slate / Teal professional theme
- **Backend:**
  - Node.js (v20+ LTS), Express.js REST APIs
  - JWT Authentication & bcrypt password hashing
  - Socket.IO server engine for live push notifications
  - ExcelJS for dynamic multi-sheet Excel generation and bulk import
  - PDFKit & QRCode for official fee receipts and tamper-proof graduation certificates
  - Axios for Meta Graph API v21.0 Leadgen synchronization
- **Database:**
  - MongoDB 8.0 / MongoDB Atlas with schema indexing, compound unique constraints, and atomic aggregations
  - 29 normalized Mongoose models
- **DevOps & Production:**
  - PM2 Cluster Process Manager
  - Nginx Reverse Proxy with HTTP/2 and gzip
  - Hostinger VPS (Ubuntu 22.04 / 24.04 LTS)
  - SSL / TLS via Let's Encrypt Certbot

---

## 3. Seed User Accounts & Scoped Roles

The database is pre-seeded with complete sample data and accounts:

| Role | Name | Email | Password | Assigned Scope / Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Administrator | `admin@whitehouse.com` | `admin123` | **Full CRM Access:** Users, settings, all leads, batch management, certificate approvals, executive reports. |
| **Staff 1** | Priya Sharma | `staff1@whitehouse.com` | `staff123` | **Creative Media Courses:** VFX & Animation, Video Editing, AI Video Editing, Drone Photography. |
| **Staff 2** | Ramesh Kumar | `staff2@whitehouse.com` | `staff123` | **Tech & Design Courses:** Coding, Graphic Design, Digital Marketing. |
| **Trainer** | Alex Pandian | `alex.trainer@whitehouse.com` | `trainer123` | **Assigned Batches & Students:** Mark attendance, update weekly syllabus progress, evaluate assignments, create MCQ exams, recommend certificates. |
| **Student** | Arun Sundaram | `arun.student@whitehouse.com` | `student123` | **Personal Portal:** View enrolled batch, syllabus progress, submit assignments, take timed MCQ exams, view fee ledger & download receipts, verify certificates. |

*Quick Role Switcher: The login screen at `/login` provides 1-click test credential buttons for instantaneous role switching.*

---

## 4. Course-Wise Staff Lead Allocation

Incoming leads are automatically routed upon creation:

- **Staff 1 Scope:**
  - VFX & Animation
  - Video Editing
  - AI Video Editing
  - Drone Photography
- **Staff 2 Scope:**
  - Coding
  - Graphic Design
  - Digital Marketing
- **Admin Queue:**
  - Any unspecified or new course is automatically placed into the unassigned queue for Admin re-allocation.
  - All assignment transfers maintain complete historical audit logs (`LeadAssignment` collection).

---

## 5. Master Acceptance Test Results (15/15 PASSED)

Run the automated test runner:
```bash
npm run test:acceptance
```

All 15 master acceptance tests verified:

1. **TEST 1 (PASS):** Manual lead entry → Course identification → Staff assignment → Follow-up reminder.
2. **TEST 2 (PASS):** Meta Ads form submission → Webhook verification → Duplicate check → CRM storage → Staff routing.
3. **TEST 3 (PASS):** Website enquiry webhook → CRM storage → Assignment → Admin notification.
4. **TEST 4 (PASS):** Lead → Counselling → Admission → Student registration → Batch allocation.
5. **TEST 5 (PASS):** Student → Weekly syllabus → Lesson completion → Progress tracking & delay alerts.
6. **TEST 6 (PASS):** Student → Daily class attendance → Duplicate prevention → Attendance percentage.
7. **TEST 7 (PASS):** Trainer → Assignment creation → Student submission → Trainer evaluation.
8. **TEST 8 (PASS):** Trainer → MCQ examination → Student attempt with timer → Automatic grading & result storage.
9. **TEST 9 (PASS):** Student fee entry → Installment payment → Automatic balance calculation → PDF receipt generation.
10. **TEST 10 (PASS):** Course completion → Trainer recommendation → Admin approval → Branded QR certificate generation.
11. **TEST 11 (PASS):** Student → Career placement record → Automatic transition to Alumni status.
12. **TEST 12 (PASS):** Admin → Executive dashboards & reports aggregation.
13. **TEST 13 (PASS):** Staff 1 → Strict scoping to assigned courses (VFX, Video Editing, AI Video Editing, Drone).
14. **TEST 14 (PASS):** Staff 2 → Strict scoping to assigned courses (Coding, Graphic Design, Digital Marketing).
15. **TEST 15 (PASS):** Student → Strict scoping to own academic, fee, and examination records.

---

## 6. Exactly 29 MongoDB Collections

All models located in `backend/src/models/`:
1. `users` (`User.js`)
2. `courses` (`Course.js`)
3. `leads` (`Lead.js`)
4. `lead_activities` (`LeadActivity.js`)
5. `lead_assignments` (`LeadAssignment.js`)
6. `counselling_records` (`CounsellingRecord.js`)
7. `admissions` (`Admission.js`)
8. `students` (`Student.js`)
9. `batches` (`Batch.js`)
10. `batch_students` (`BatchStudent.js`)
11. `trainers` (`Trainer.js`)
12. `syllabus_weeks` (`SyllabusWeek.js`)
13. `lessons` (`Lesson.js`)
14. `student_progress` (`StudentProgress.js`)
15. `attendance` (`Attendance.js`)
16. `assignments` (`Assignment.js`)
17. `assignment_submissions` (`AssignmentSubmission.js`)
18. `examinations` (`Examination.js`)
19. `questions` (`Question.js`)
20. `exam_attempts` (`ExamAttempt.js`)
21. `exam_results` (`ExamResult.js`)
22. `student_fees` (`StudentFee.js`)
23. `payments` (`Payment.js`)
24. `certificates` (`Certificate.js`)
25. `placements` (`Placement.js`)
26. `notifications` (`Notification.js`)
27. `meta_integrations` (`MetaIntegration.js`)
28. `webhook_events` (`WebhookEvent.js`)
29. `audit_logs` (`AuditLog.js`)
*(Bonus: `institute_settings` for dynamic assignment and threshold rules)*

---

## 7. 26 REST API Endpoint Groups

Mounted under `/api/*` in `backend/src/app.js`:

1. `/api/auth` – Login, Profile, Password changes, Role verification
2. `/api/users` – Admin User Management & course allocations
3. `/api/leads` – Full CRUD, Search, WhatsApp click-to-chat, Activity logging, Excel import/export
4. `/api/lead-assignments` – Course-wise allocation rules, re-assignment history
5. `/api/counselling` – Counselling sessions, quotations, decisions
6. `/api/admissions` – Convert Lead to Student, roll number generation
7. `/api/students` – 15-section Student Profile, Batch transfers, Document attachments
8. `/api/courses` – 7 Courses, durations, pricing, weekly syllabus
9. `/api/batches` – Batch scheduling, student capacity, ongoing status
10. `/api/trainers` – Trainer directories & batch assignments
11. `/api/syllabus` – 12-week syllabus management & lessons
12. `/api/progress` – Student weekly progress, learning delay alerts
13. `/api/attendance` – Daily session marking, duplicate checks, percentages
14. `/api/assignments` – Practical assignment briefs & student file submissions
15. `/api/examinations` – MCQ exams, questions, timers, auto-grading
16. `/api/exam-results` – Student exam attempts, percentages, pass/fail status
17. `/api/fees` – Course fees, discounts, outstanding balances
18. `/api/payments` – Cash/UPI/Bank payments, PDF receipts with branded layout
19. `/api/certificates` – Trainer recommendation, Admin approval, PDF generation
20. `/api/placements` – Placement tracking, salary packages, Alumni updates
21. `/api/reports` – 16 reports with live JSON and ExcelJS `.xlsx` export
22. `/api/notifications` – Real-time Socket.IO and in-app bell notifications
23. `/api/meta` – Meta Graph API settings, Page token management, retry logs
24. `/api/webhooks` – Meta Webhook challenge verification, leadgen ingestion, website enquiries
25. `/api/settings` – Institute legal details, assignment rules, certificate criteria
26. `/api/audit-logs` – Tamper-evident admin audit trail

---

## 8. Hostinger VPS Production Deployment Guide

Follow these steps to deploy on a clean Hostinger VPS running **Ubuntu 22.04 LTS / 24.04 LTS**:

### Step 1: Server Preparation & Node.js 20+ Installation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx certbot python3-certbot-nginx

# Verify versions
node -v
npm -v
```

### Step 2: Install MongoDB Community Server
```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod
```

### Step 3: Clone Repository & Install Dependencies
```bash
# Create application directory
sudo mkdir -p /var/www/whitehouse-crm
sudo chown -R $USER:$USER /var/www/whitehouse-crm

# Clone project or copy files
git clone https://github.com/your-repo/whitehouse-crm.git /var/www/whitehouse-crm
cd /var/www/whitehouse-crm

# Install dependencies
npm run install:all

# Seed database with initial courses, batches, syllabus, and staff accounts
npm run seed

# Run automated acceptance tests to verify 15/15 pass on your server
npm run test:acceptance
```

### Step 4: Configure Environment Variables
```bash
# Copy and edit production environment file
cp backend/.env.example backend/.env
nano backend/.env
```
Ensure `NODE_ENV=production`, `PORT=5000`, and `MONGODB_URI=mongodb://127.0.0.1:27017/whitehouse_crm` are configured.

### Step 5: Build Frontend SPA
```bash
npm run build:frontend
# Generates production distribution in /var/www/whitehouse-crm/frontend/dist
```

### Step 6: Start Backend with PM2 Cluster
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend using ecosystem configuration
pm2 start ecosystem.config.js

# Save process list and enable start on server reboot
pm2 save
pm2 startup
```

### Step 7: Configure Nginx & SSL
```bash
# Copy nginx configuration
sudo cp /var/www/whitehouse-crm/nginx.conf /etc/nginx/sites-available/whitehouse-crm

# Enable site
sudo ln -s /etc/nginx/sites-available/whitehouse-crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Obtain Let's Encrypt SSL certificate
sudo certbot --nginx -d crm.whitehouseinstitute.in

# Reload Nginx
sudo systemctl reload nginx
```

---

## 9. Meta Lead Ads Webhook Setup

1. In **Meta Developer App** (`developers.facebook.com`):
   - Add **Webhooks** product → select **Page** object.
   - Callback URL: `https://crm.whitehouseinstitute.in/api/webhooks/meta`
   - Verify Token: Enter your configured `META_WEBHOOK_VERIFY_TOKEN` (default: `WHITEHOUSE_CRM_META_VERIFY_TOKEN_2026`).
   - Subscribe to the **leadgen** field.
2. In **Facebook Page Settings**:
   - Subscribe your Facebook Page to the Meta App.
   - Generate a non-expiring Page Access Token with `leads_retrieval` and `pages_manage_ads` permissions.
3. In **Whitehouse CRM Admin Portal**:
   - Navigate to `/meta-integration`.
   - Paste Page ID, Page Access Token, and verify connection.
   - Use the **Meta Webhook Simulator** to test real-time lead capture, course matching, and staff assignment.

---

## 10. Public Verification & Enquiry Portals

- **Public Certificate Verification:** `/verify-certificate` (or `/verify-certificate/:certificateId`)
  - Validates credentials without exposing private student contact info.
- **Public Student Enquiry Form:** `/enquiry`
  - Allows website visitors to submit admission enquiries which instantly flow into the CRM.

---

© 2026 Whitehouse Skill Development Institute, Madurai. Built with the MERN Stack.
#   w h i t e h o u s e _ C R M  
 