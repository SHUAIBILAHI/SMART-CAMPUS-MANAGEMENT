# API quick reference

All routes are prefixed with `/api`. Login establishes a server session; browser requests use same-origin cookies.

| Method | Route | Access |
|---|---|---|
| GET | /health | Public |
| POST | /auth/login | Public |
| POST | /auth/logout | Logged in |
| GET | /auth/me | Logged in |
| GET | /dashboard | All roles |
| GET/POST | /students | Admin (GET also Faculty) |
| GET/POST | /faculty | Admin |
| GET/POST | /attendance | GET all roles; POST Admin/Faculty |
| GET/POST | /marks | GET all roles; POST Admin/Faculty |
| PUT | /marks/{id}/publish | Admin |
| GET | /notices | Public |
| POST | /notices | Admin |
| GET/POST | /complaints | GET role-scoped; POST Student |
| PUT | /complaints/{id} | Admin |
| GET/POST | /lost-found | Logged in |
| GET/POST | /queue | Student/Admin |
| GET/POST | /opportunities | GET logged in; POST Admin |
| POST | /assistant | Logged in |

### Example attendance request
```json
{
  "studentId": 2,
  "subject": "Java Programming",
  "date": "2026-11-13",
  "status": "Present"
}
```

### Example marks request
```json
{
  "studentId": 2,
  "subject": "Java Programming",
  "examType": "INTERNAL",
  "obtained": 17,
  "maxMarks": 20,
  "semester": 1
}
```
