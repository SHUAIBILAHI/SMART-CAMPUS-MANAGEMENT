# SMART CAMPUS MANAGEMENT & STUDENT SERVICE PORTAL
## MCA Minor Project Report

### 1. Abstract
Smart Campus Management & Student Service Portal is a Java Full Stack web application designed to bring academic information and common student services into one digital workspace. It provides separate Admin, Student and Faculty access. The academic area supports attendance recording, Internal/Practical/External marks entry and controlled result publishing. The service area supports notices, complaints, Lost & Found reports, queue tokens and campus opportunities.

### 2. Problem Statement
In many institutions, academic information and student services are spread across registers, notice boards and disconnected applications. Students may need to visit multiple offices to obtain updates, while staff spend time maintaining repetitive records. The proposed portal centralizes these workflows and provides role-appropriate access.

### 3. Objectives
- Centralize student, faculty and academic information.
- Digitize attendance and examination mark records.
- Allow students to view published academic information.
- Provide online complaint submission and tracking.
- Improve communication through notices and opportunities.
- Demonstrate role-based access and database-backed full-stack development.

### 4. Scope
The prototype includes Admin, Student and Faculty workspaces; student/faculty records; attendance; examination marks; result publishing; notices; complaints; Lost & Found; queue booking; opportunities; and a rule-based FAQ assistant. Real-time biometric attendance, payment processing, production AI and institution-wide integrations are outside the current minor-project scope.

### 5. Technology Stack
Frontend: HTML, CSS, JavaScript. Backend: Java 17 and Spring Boot. Database: MySQL. API style: REST/JSON. Password storage: BCrypt.

### 6. User Roles
**Admin:** creates student/faculty accounts, publishes notices, views records, publishes marks and updates complaints.
**Faculty:** records attendance and examination marks.
**Student:** views own attendance and published marks, reads notices, submits complaints, reports lost/found items and books queue tokens.

### 7. Functional Modules
1. Authentication and role-based navigation.
2. Student and faculty management.
3. Attendance management.
4. Internal, Practical and External examination marks.
5. Result publication.
6. Notices and announcements.
7. Complaint management.
8. Lost & Found.
9. Smart queue tokens.
10. Opportunity Hub.
11. Rule-based Campus Assistant.

### 8. Database Design
- app_users: user identity, login hash, role and academic profile.
- attendance: student, subject, date and status.
- marks: student, subject, exam type, obtained/max marks, semester and publish flag.
- notices: title, body, category and author.
- complaints: student, issue, status and admin response.
- lost_found: reporter, item details, type and location.
- queue_tokens: student, department, token number and date.
- opportunities: title, organization, type, description and deadline.

### 9. System Workflow
1. User signs in with institutional credentials.
2. Server verifies the password hash and stores the session.
3. The role controls which modules are shown and which API actions are allowed.
4. Faculty/Admin records attendance and marks.
5. Admin verifies and publishes marks.
6. Student views published records and uses student services.

### 10. Security and Validation
Passwords are stored using BCrypt hashes. Server-side role checks protect staff-only actions. Marks are validated against maximum marks. Attendance statuses and exam types are validated. Student views are restricted to their own attendance and published marks. For real deployment, add CSRF protection, HTTPS, stronger session controls, audit logs, account recovery, backups and a formal security review.

### 11. Future Enhancements
- Institution-specific timetable and course registration.
- CSV/PDF report export.
- QR-based attendance with faculty verification.
- Email/SMS notifications.
- Image upload and assisted Lost & Found matching.
- Map-based campus navigation.
- AI integration using an approved institutional knowledge base.
- Mobile application and analytics.

### 12. Conclusion
The project demonstrates how a Java Full Stack application can centralize academic records and student services. It is suitable as an educational MCA minor-project prototype and can be extended according to institutional requirements.
