package com.smartcampus.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.sql.Date;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api")
public class PortalController {
 private final JdbcTemplate db;
 private final PasswordEncoder encoder;
 public PortalController(JdbcTemplate db, PasswordEncoder encoder){ this.db=db; this.encoder=encoder; }

 private Map<String,Object> current(HttpSession s){
  Object u=s.getAttribute("user");
  if(u instanceof Map) return (Map<String,Object>)u;
  return null;
 }
 private Map<String,Object> require(HttpSession s, String... roles){
  Map<String,Object> u=current(s);
  if(u==null) throw new ApiError(HttpStatus.UNAUTHORIZED,"Please login first.");
  String role=String.valueOf(u.get("role"));
  if(roles.length>0 && Arrays.stream(roles).noneMatch(role::equals))
   throw new ApiError(HttpStatus.FORBIDDEN,"You do not have permission for this action.");
  return u;
 }
 @ExceptionHandler(ApiError.class) ResponseEntity<?> apiError(ApiError e){ return ResponseEntity.status(e.status).body(Map.of("message",e.getMessage())); }
 static class ApiError extends RuntimeException { final HttpStatus status; ApiError(HttpStatus s,String m){super(m);status=s;} }
 @GetMapping("/health") Map<String,Object> health(){ return Map.of("status","UP","application","Smart Campus Management & Student Service Portal"); }

 @PostMapping("/auth/login") Map<String,Object> login(@RequestBody Map<String,String> body,HttpSession session){
  String email=body.getOrDefault("email","").trim().toLowerCase(), password=body.getOrDefault("password","");
  List<Map<String,Object>> rows=db.queryForList("SELECT id,name,email,password_hash,role,roll_no,department,semester,active FROM app_users WHERE email=?",email);
  if(rows.isEmpty()) throw new ApiError(HttpStatus.UNAUTHORIZED,"Invalid email or password.");
  Map<String,Object> row=rows.get(0);
  if(!Boolean.TRUE.equals(row.get("active")) || !encoder.matches(password,String.valueOf(row.get("password_hash"))))
   throw new ApiError(HttpStatus.UNAUTHORIZED,"Invalid credentials or inactive account.");
  row.remove("password_hash"); session.setAttribute("user",row);
  return Map.of("user",row,"message","Login successful");
 }
 @PostMapping("/auth/logout") Map<String,String> logout(HttpSession s){ s.invalidate(); return Map.of("message","Logged out"); }
 @GetMapping("/auth/me") Map<String,Object> me(HttpSession s){ Map<String,Object> u=current(s); if(u==null) throw new ApiError(HttpStatus.UNAUTHORIZED,"Not logged in"); return u; }

 @GetMapping("/dashboard")
 Map<String,Object> dashboard(HttpSession s){
  Map<String,Object> u=require(s); String role=String.valueOf(u.get("role"));
  if("ADMIN".equals(role)){
   return Map.of("students",count("SELECT COUNT(*) FROM app_users WHERE role='STUDENT'"),
    "faculty",count("SELECT COUNT(*) FROM app_users WHERE role='FACULTY'"),
    "complaints",count("SELECT COUNT(*) FROM complaints WHERE status<>'Resolved'"),
    "notices",count("SELECT COUNT(*) FROM notices"));
  }
  if("FACULTY".equals(role)) return Map.of("students",count("SELECT COUNT(*) FROM app_users WHERE role='STUDENT'"),
    "subjects","Assigned subjects","attendanceEntries",count("SELECT COUNT(*) FROM attendance"));
  long id=((Number)u.get("id")).longValue();
  Map<String,Object> stats=db.queryForMap("SELECT COUNT(*) total, COALESCE(SUM(status='Present'),0) present FROM attendance WHERE student_id=?",id);
  double pct=((Number)stats.get("total")).intValue()==0?0:100.0*((Number)stats.get("present")).intValue()/((Number)stats.get("total")).intValue();
  return Map.of("attendance",Math.round(pct*10.0)/10.0,"publishedMarks",count("SELECT COUNT(*) FROM marks WHERE student_id="+id+" AND published=TRUE"),
   "openComplaints",count("SELECT COUNT(*) FROM complaints WHERE student_id="+id+" AND status<>'Resolved'"));
 }
 private long count(String sql){ Long n=db.queryForObject(sql,Long.class); return n==null?0:n; }

 @GetMapping("/students") List<Map<String,Object>> students(HttpSession s){
  require(s,"ADMIN","FACULTY");
  return db.queryForList("SELECT id,name,email,roll_no,department,semester,active FROM app_users WHERE role='STUDENT' ORDER BY name");
 }
 @PostMapping("/students") Map<String,Object> addStudent(@RequestBody Map<String,Object> b,HttpSession s){
  require(s,"ADMIN");
  String name=String.valueOf(b.getOrDefault("name","")).trim(), email=String.valueOf(b.getOrDefault("email","")).trim().toLowerCase();
  if(name.isBlank()||email.isBlank()) throw new ApiError(HttpStatus.BAD_REQUEST,"Name and email are required.");
  String pass=String.valueOf(b.getOrDefault("password","Student@123"));
  db.update("INSERT INTO app_users(name,email,password_hash,role,roll_no,department,semester) VALUES(?,?,?,?,?,?,?)",
   name,email,encoder.encode(pass),"STUDENT",b.getOrDefault("rollNo",""),b.getOrDefault("department","MCA"),b.getOrDefault("semester",1));
  return Map.of("message","Student added successfully.");
 }
 @GetMapping("/faculty") List<Map<String,Object>> faculty(HttpSession s){ require(s,"ADMIN"); return db.queryForList("SELECT id,name,email,department,active FROM app_users WHERE role='FACULTY' ORDER BY name"); }
 @PostMapping("/faculty") Map<String,Object> addFaculty(@RequestBody Map<String,Object> b,HttpSession s){
  require(s,"ADMIN");
  db.update("INSERT INTO app_users(name,email,password_hash,role,department) VALUES(?,?,?,?,?)",
   b.get("name"),String.valueOf(b.get("email")).toLowerCase(),encoder.encode(String.valueOf(b.getOrDefault("password","Faculty@123"))),"FACULTY",b.getOrDefault("department","Computer Applications"));
  return Map.of("message","Faculty added.");
 }
 @GetMapping("/attendance") List<Map<String,Object>> attendance(HttpSession s){
  Map<String,Object> u=require(s); if("STUDENT".equals(u.get("role")))
   return db.queryForList("SELECT a.id,a.subject,a.class_date,a.status FROM attendance a WHERE a.student_id=? ORDER BY a.class_date DESC",u.get("id"));
  require(s,"ADMIN","FACULTY");
  return db.queryForList("SELECT a.id,u.name,u.roll_no,a.subject,a.class_date,a.status FROM attendance a JOIN app_users u ON u.id=a.student_id ORDER BY a.class_date DESC LIMIT 300");
 }
 @PostMapping("/attendance") Map<String,Object> markAttendance(@RequestBody Map<String,Object> b,HttpSession s){
  Map<String,Object> u=require(s,"ADMIN","FACULTY");
  long studentId=Long.parseLong(String.valueOf(b.get("studentId")));
  String status=String.valueOf(b.getOrDefault("status","Present"));
  if(!List.of("Present","Absent","Leave").contains(status)) throw new ApiError(HttpStatus.BAD_REQUEST,"Invalid attendance status.");
  db.update("INSERT INTO attendance(student_id,subject,class_date,status,marked_by) VALUES(?,?,?,?,?)",
   studentId,b.getOrDefault("subject","General"),Date.valueOf(String.valueOf(b.getOrDefault("date",LocalDate.now().toString()))),status,u.get("id"));
  return Map.of("message","Attendance saved.");
 }
 @GetMapping("/marks") List<Map<String,Object>> marks(HttpSession s){
  Map<String,Object> u=require(s);
  if("STUDENT".equals(u.get("role"))) return db.queryForList("SELECT subject,exam_type,obtained,max_marks,semester FROM marks WHERE student_id=? AND published=TRUE ORDER BY semester,subject",u.get("id"));
  require(s,"ADMIN","FACULTY");
  return db.queryForList("SELECT m.id,u.name,u.roll_no,m.subject,m.exam_type,m.obtained,m.max_marks,m.semester,m.published FROM marks m JOIN app_users u ON u.id=m.student_id ORDER BY m.updated_at DESC LIMIT 300");
 }
 @PostMapping("/marks") Map<String,Object> addMarks(@RequestBody Map<String,Object> b,HttpSession s){
  require(s,"ADMIN","FACULTY");
  double obtained=Double.parseDouble(String.valueOf(b.get("obtained"))), max=Double.parseDouble(String.valueOf(b.get("maxMarks")));
  if(max<=0||obtained<0||obtained>max) throw new ApiError(HttpStatus.BAD_REQUEST,"Marks must be between 0 and maximum marks.");
  String type=String.valueOf(b.get("examType"));
  if(!List.of("INTERNAL","PRACTICAL","EXTERNAL").contains(type)) throw new ApiError(HttpStatus.BAD_REQUEST,"Exam type must be INTERNAL, PRACTICAL or EXTERNAL.");
  db.update("INSERT INTO marks(student_id,subject,exam_type,obtained,max_marks,semester,published) VALUES(?,?,?,?,?,?,?)",
   b.get("studentId"),b.get("subject"),type,obtained,max,b.getOrDefault("semester",1),false);
  return Map.of("message","Marks saved as unpublished. Admin can publish them after verification.");
 }
 @PutMapping("/marks/{id}/publish") Map<String,String> publish(@PathVariable long id,HttpSession s){
  require(s,"ADMIN"); db.update("UPDATE marks SET published=TRUE WHERE id=?",id); return Map.of("message","Marks published.");
 }
 @GetMapping("/notices") List<Map<String,Object>> notices(){ return db.queryForList("SELECT id,title,body,category,created_at FROM notices ORDER BY created_at DESC"); }
 @PostMapping("/notices") Map<String,String> addNotice(@RequestBody Map<String,Object> b,HttpSession s){
  Map<String,Object> u=require(s,"ADMIN");
  db.update("INSERT INTO notices(title,body,category,created_by) VALUES(?,?,?,?)",b.get("title"),b.get("body"),b.getOrDefault("category","General"),u.get("id"));
  return Map.of("message","Notice published.");
 }
 @GetMapping("/complaints") List<Map<String,Object>> complaints(HttpSession s){
  Map<String,Object> u=require(s);
  if("STUDENT".equals(u.get("role"))) return db.queryForList("SELECT id,subject,description,category,status,admin_reply,created_at FROM complaints WHERE student_id=? ORDER BY created_at DESC",u.get("id"));
  require(s,"ADMIN"); return db.queryForList("SELECT c.id,u.name,u.roll_no,c.subject,c.description,c.category,c.status,c.admin_reply,c.created_at FROM complaints c JOIN app_users u ON u.id=c.student_id ORDER BY c.created_at DESC");
 }
 @PostMapping("/complaints") Map<String,String> complaint(@RequestBody Map<String,Object> b,HttpSession s){
  Map<String,Object> u=require(s,"STUDENT");
  db.update("INSERT INTO complaints(student_id,subject,description,category) VALUES(?,?,?,?)",u.get("id"),b.get("subject"),b.get("description"),b.getOrDefault("category","General"));
  return Map.of("message","Complaint submitted.");
 }
 @PutMapping("/complaints/{id}") Map<String,String> updateComplaint(@PathVariable long id,@RequestBody Map<String,String> b,HttpSession s){
  require(s,"ADMIN"); String status=b.getOrDefault("status","In Progress");
  if(!List.of("Submitted","In Progress","Resolved","Rejected").contains(status)) throw new ApiError(HttpStatus.BAD_REQUEST,"Invalid status.");
  db.update("UPDATE complaints SET status=?,admin_reply=? WHERE id=?",status,b.getOrDefault("reply",""),id);
  return Map.of("message","Complaint updated.");
 }
 @GetMapping("/lost-found") List<Map<String,Object>> lostFound(HttpSession s){ require(s); return db.queryForList("SELECT l.id,u.name,l.item_name,l.description,l.item_type,l.location,l.status,l.created_at FROM lost_found l JOIN app_users u ON u.id=l.user_id ORDER BY l.created_at DESC"); }
 @PostMapping("/lost-found") Map<String,String> reportItem(@RequestBody Map<String,Object> b,HttpSession s){
  Map<String,Object> u=require(s);
  String type=String.valueOf(b.getOrDefault("itemType","LOST"));
  if(!List.of("LOST","FOUND").contains(type)) throw new ApiError(HttpStatus.BAD_REQUEST,"Item type must be LOST or FOUND.");
  db.update("INSERT INTO lost_found(user_id,item_name,description,item_type,location) VALUES(?,?,?,?,?)",u.get("id"),b.get("itemName"),b.get("description"),type,b.get("location"));
  return Map.of("message","Item report submitted.");
 }
 @GetMapping("/queue") List<Map<String,Object>> queue(HttpSession s){
  Map<String,Object> u=require(s);
  if("STUDENT".equals(u.get("role"))) return db.queryForList("SELECT id,department,token_no,status,visit_date FROM queue_tokens WHERE student_id=? ORDER BY id DESC",u.get("id"));
  require(s,"ADMIN"); return db.queryForList("SELECT q.id,u.name,q.department,q.token_no,q.status,q.visit_date FROM queue_tokens q JOIN app_users u ON u.id=q.student_id WHERE q.visit_date=? ORDER BY q.token_no",LocalDate.now());
 }
 @PostMapping("/queue") Map<String,Object> bookToken(@RequestBody Map<String,String> b,HttpSession s){
  Map<String,Object> u=require(s,"STUDENT"); String dept=b.getOrDefault("department","Administration");
  Integer token=db.queryForObject("SELECT COALESCE(MAX(token_no),0)+1 FROM queue_tokens WHERE department=? AND visit_date=?",Integer.class,dept,LocalDate.now());
  db.update("INSERT INTO queue_tokens(student_id,department,token_no,visit_date) VALUES(?,?,?,?)",u.get("id"),dept,token,LocalDate.now());
  return Map.of("message","Token booked.","token",token);
 }
 @GetMapping("/opportunities") List<Map<String,Object>> opportunities(HttpSession s){ require(s); return db.queryForList("SELECT id,title,organization,description,opportunity_type,deadline FROM opportunities ORDER BY deadline"); }
 @PostMapping("/opportunities") Map<String,String> addOpportunity(@RequestBody Map<String,Object> b,HttpSession s){
  require(s,"ADMIN"); db.update("INSERT INTO opportunities(title,organization,description,opportunity_type,deadline) VALUES(?,?,?,?,?)",
   b.get("title"),b.get("organization"),b.get("description"),b.getOrDefault("type","Placement"),b.get("deadline"));
  return Map.of("message","Opportunity added.");
 }
 @PostMapping("/assistant") Map<String,String> assistant(@RequestBody Map<String,String> b,HttpSession s){
  Map<String,Object> u=require(s); String q=b.getOrDefault("question","").toLowerCase();
  String answer;
  if(q.contains("attendance")) answer="You can open My Attendance to view subject-wise records. Attendance below 75% is flagged for attention.";
  else if(q.contains("internal")||q.contains("marks")||q.contains("result")) answer="Open Examination & Results to view published Internal, Practical and External marks. Unpublished marks are visible only to authorized staff.";
  else if(q.contains("library")) answer="Library timings and rules are shared through the Notices section. Please check the latest library notice.";
  else if(q.contains("complaint")) answer="Use Student Services → Complaints to submit an issue and track its status.";
  else if(q.contains("exam")||q.contains("timetable")) answer="Please check Notices and your academic timetable. The portal displays official information entered by college staff.";
  else answer="I am Smart Campus Assistant. Ask me about attendance, marks, results, exams, library notices or complaints. I answer using the portal's built-in campus help topics.";
  return Map.of("answer",answer,"assistant","Smart Campus Assistant");
 }
}
