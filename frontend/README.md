# EventFlow

> A modern, configurable event management and participant engagement platform.

EventFlow is a full-stack web application designed to simplify event management, participant onboarding, communication, document collection, and event coordination.

The platform is designed to support different types of events — from conferences and workshops to weddings and corporate events — without requiring a completely different application for each event.

## ✨ Features

### 👨‍💼 Admin Dashboard
- Manage events and participants
- View participant information and registration status
- Send invitations
- Track invitation and registration progress
- Request and manage participant documents
- Download uploaded documents
- Communicate privately with individual participants
- Send announcements to multiple participants
- Monitor event activity

### 👤 Participant Dashboard
- View personalized event information
- Complete registration
- Upload required documents
- Track registration/document status
- Receive event announcements
- Communicate directly with the admin
- Manage personal profile

### 💬 Communication
- One-to-one admin ↔ participant messaging
- Real-time communication
- Event-wide announcements
- Notifications for important updates

### 📁 Document Management
- Admin can request documents
- Participants can securely upload files
- Admin can review and download submitted documents
- Document status tracking

### 📩 Invitation System
- Add or import participants
- Generate unique invitation links
- Send invitations through email
- Track invitation status:
  - Invited
  - Opened
  - Accepted
  - Registered

### ⚙️ Configurable Events

EventFlow is designed to be event-independent.

Possible event types include:

- Conferences
- Weddings
- Workshops
- Seminars
- Corporate Events
- Networking Events
- Custom Events

Different modules can be enabled depending on the event.

## 🏗️ Architecture

```text
                    EventFlow
                       │
          ┌────────────┴────────────┐
          │                         │
     Admin Portal            Participant Portal
          │                         │
          └────────────┬────────────┘
                       │
                 REST API / WebSocket
                       │
                  Node.js Backend
                       │
          ┌────────────┴────────────┐
          │                         │
       MongoDB                  File Storage
                                (S3/Cloudinary)
