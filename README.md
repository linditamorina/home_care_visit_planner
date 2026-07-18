# Development of a Home Care Visit Planning and Digital Field Notes Management System

## Problem Statement
Traditional home care visit organization suffers from a lack of real-time synchronization, inefficient schedule management, and difficulties in maintaining accurate field data. The lack of a centralized system complicates the auditing of staff actions, supervisor task reviews, and the management of emergency cases or scheduling conflicts.

## User Roles
* **Administrator:** Manages visit schedules, assigns field workers, and monitors the reporting and auditing dashboard.
* **Field Worker:** Uses the mobile application to view the calendar, perform check-in/check-out, and complete digital field notes.
* **Supervisor:** Reviews field notes and validates the completion of assigned tasks.

## Core Modules
* Authentication and Role-Based Access Control (RBAC) Module.
* Visit Scheduling and Calendar Module.
* Mobile Field Workflow Module (Check-in, Check-out, Tasks).
* Field Notes Review Module.
* System Auditing Module (Audit Log for all critical database actions).

## Privacy and Data Security
* The system implements strict Role-Based Access Control (RBAC) to ensure patient data is only accessible to authorized personnel.
* Row-Level Security (RLS) is applied directly at the database level to prevent unauthorized data access or manipulation.
* All sensitive information is securely managed, and system actions are meticulously logged in an immutable Audit Trail for compliance and security auditing purposes.

## Technologies Used
* **Mobile App:** React Native with TypeScript.
* **Admin Dashboard (Web):** Next.js with TypeScript.
* **Backend & Database:** Supabase (PostgreSQL).
* **Automated Testing:** Playwright for End-to-End (E2E) testing flows.

---

## Use Cases

* **UC-01: Visit Creation and Assignment (Administrator)**
  The Administrator accesses the web dashboard, selects a patient, and creates a new visit by assigning a date, time, and specific tasks. The system verifies staff availability. If there is a scheduling conflict, the system displays a warning; otherwise, the visit is saved and assigned to the field worker.

* **UC-02: Field Visit Execution (Field Worker)**
  The Field Worker opens the mobile app, views the upcoming visit, and taps "Check-in" upon arriving at the location. During the visit, the worker marks tasks as completed, writes digital notes, and finally taps "Check-out". The system records the exact duration of the visit.

* **UC-03: Notes Review (Supervisor)**
  The Supervisor logs into the system and filters visits by the "Completed" status. They open the specific visit report, read the field worker's notes, and leave their comments, updating the review status to either "Approved" or "Requires Correction".

* **UC-04: System Auditing (Security)**
  Whenever a user modifies a visit or adds a note, the database system automatically generates a row in the `AUDIT_LOGS` table containing the user's ID, the action performed, and a JSON comparison between the old and new data.

---

## Functional and Non-Functional Requirements

### Functional Requirements
* The system must authenticate users and strictly separate them into three roles: Admin, Field Worker, Supervisor.
* The system must allow the creation, reading, updating, and deletion (CRUD) of visits only by authorized roles.
* The mobile application must provide Check-in and Check-out functionality to accurately record the start and end times of fieldwork.
* The system must log every change to visit data and notes in an immutable Audit Log.
* The system must provide UI alerts in case of scheduling overlaps for field workers.

### Non-Functional Requirements
* **Security:** All endpoints and database tables must be protected via Row-Level Security (RLS) policies. Passwords must not be stored in plain text.
* **Performance:** The system's response time for loading the daily calendar should not exceed 2 seconds under normal network conditions.
* **Usability:** The mobile interface must be intuitive and accessible with one hand (Mobile-First Design), as field workers are constantly on the move.
* **Reliability:** All user inputs must undergo rigorous validation testing to prevent the injection of corrupted data.
* **Auditability:** The architecture must guarantee that a clear, untampered historical record of data access and modification is maintained at all times.
