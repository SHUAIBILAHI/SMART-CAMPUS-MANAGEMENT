# SMART CAMPUS MANAGEMENT & STUDENT SERVICE PORTAL

MCA Minor Project | Java Full Stack

A web-based campus portal with separate Admin, Student and Faculty roles. The project includes academic management (attendance, internal/practical/external marks and result publishing) plus student services (notices, complaints, Lost & Found, queue tokens, opportunities and a campus FAQ assistant).

## Technology
- Frontend: HTML5, CSS3, JavaScript
- Backend: Java 17, Spring Boot 3.4.5, REST APIs
- Database: MySQL 8+
- Persistence: Spring JDBC
- Password hashing: BCrypt

## Requirements
1. JDK 17 or later
2. Maven 3.9+
3. MySQL 8+
4. Browser (Chrome/Edge/Firefox)

## Run the project
1. Create a MySQL user/database. The JDBC URL creates `smart_campus` automatically if the MySQL account has permission.
2. Open `src/main/resources/application.properties` and set `spring.datasource.username` and `spring.datasource.password`.
3. From the project root, run:
   ```bash
   mvn spring-boot:run
   ```
4. Open http://localhost:8080

Spring Boot initializes the tables from `schema.sql` and inserts demo accounts on first startup.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@smartcampus.edu | Admin@123 |
| Student | student@smartcampus.edu | Student@123 |
| Faculty | faculty@smartcampus.edu | Faculty@123 |

Change demo passwords and database credentials before any real deployment. This project is an educational prototype, not production-ready software.

## Main modules
- Role-based Admin, Student and Faculty workspaces
- Student and faculty account creation (Admin)
- Daily attendance entry and student attendance view
- Internal, Practical and External marks entry
- Marks remain unpublished until Admin publishes them
- Notices and announcements
- Complaint submission and status updates
- Lost & Found reports
- Office queue token booking
- Internship / placement / event opportunities
- Campus FAQ assistant

## Notes
- Student ID fields in staff entry forms refer to the numeric database ID shown in the Student table only indirectly. Admin can use the Students directory; the first demo student is normally ID 2 on a fresh database.
- Configure the actual institution's grading scheme, semester rules, attendance policy and roles before using real data.
- The assistant is a rule-based FAQ demo, not a generative AI system.
- Image upload, email/SMS, live campus GPS and AI visual matching are future extensions.
