package com.smartcampus.config;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
@Configuration
public class DataSeeder {
 @Bean CommandLineRunner seed(JdbcTemplate jdbc, PasswordEncoder encoder) {
  return args -> {
   Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM app_users WHERE email=?", Integer.class, "admin@smartcampus.edu");
   if (count != null && count == 0) {
    jdbc.update("INSERT INTO app_users(name,email,password_hash,role,department) VALUES(?,?,?,?,?)",
      "Campus Administrator","admin@smartcampus.edu",encoder.encode("Admin@123"),"ADMIN","Administration");
    jdbc.update("INSERT INTO app_users(name,email,password_hash,role,roll_no,department,semester) VALUES(?,?,?,?,?,?,?)",
      "Aarav Sharma","student@smartcampus.edu",encoder.encode("Student@123"),"STUDENT","MCA2026001","MCA",1);
    jdbc.update("INSERT INTO app_users(name,email,password_hash,role,department) VALUES(?,?,?,?,?)",
      "Faculty Demo","faculty@smartcampus.edu",encoder.encode("Faculty@123"),"FACULTY","Computer Applications");
    jdbc.update("INSERT INTO notices(title,body,category) VALUES(?,?,?)",
      "Welcome to Smart Campus 360","Your digital campus portal is now ready. Check notices and academic updates here.","General");
   }
  };
 }
}
