const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let user=null, page="overview";
const api=async(path,opts={})=>{
 const res=await fetch("/api"+path,{credentials:"same-origin",headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});
 const data=await res.json().catch(()=>({}));
 if(!res.ok) throw new Error(data.message||"Something went wrong");
 return data;
};
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
function initials(n){return (n||"SC").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}
function dateLabel(){return new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
$("#todayLabel").textContent=dateLabel().toUpperCase();
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();$("#loginError").textContent="";
 try{const r=await api("/auth/login",{method:"POST",body:JSON.stringify({email:$("#email").value,password:$("#password").value})});user=r.user;showApp();}
 catch(err){$("#loginError").textContent=err.message;}
});
$("#logoutBtn").addEventListener("click",async()=>{try{await api("/auth/logout",{method:"POST"})}catch{}user=null;$("#appView").classList.add("hidden");$("#loginView").classList.remove("hidden")});
function showApp(){
 $("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden");
 $("#sideName").textContent=user.name;$("#sideRole").textContent=user.role;$("#sideAvatar").textContent=initials(user.name);$("#topAvatar").textContent=initials(user.name);
 $$("[data-roles]").forEach(el=>el.classList.toggle("hidden",!el.dataset.roles.split(",").includes(user.role)));
 navigate("overview");
}
$("#navigation").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b)navigate(b.dataset.page)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-goto]");if(b)navigate(b.dataset.goto)});
function navigate(p){page=p;$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===p));const labels={overview:"Overview",attendance:"Attendance",marks:"Marks & Results",students:"Student Management",faculty:"Faculty Management",notices:"Notices & Announcements",complaints:"Complaints",lost:"Lost & Found",queue:"Smart Queue",opportunities:"Opportunity Hub",assistant:"Campus Assistant"};$("#pageTitle").textContent=labels[p]||"Overview";render();}
const stat=(label,value,icon,foot="Updated just now")=>`<div class="stat-card"><div class="stat-head"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`;
const panel=(title,body,sub="")=>`<div class="panel"><div class="panel-head"><div><h3>${title}</h3>${sub?`<div class="panel-sub">${sub}</div>`:""}</div></div>${body}</div>`;
const btn=(label,action="submit",cls="primary")=>`<button class="btn btn-sm ${cls}" type="${action}">${label}</button>`;
async function render(){const c=$("#content");c.innerHTML='<div class="empty">Loading workspace…</div>';try{
 if(page==="overview") await overview(c);
 else if(page==="attendance") await attendance(c);
 else if(page==="marks") await marks(c);
 else if(page==="students") await students(c);
 else if(page==="faculty") await faculty(c);
 else if(page==="notices") await notices(c);
 else if(page==="complaints") await complaints(c);
 else if(page==="lost") await lost(c);
 else if(page==="queue") await queue(c);
 else if(page==="opportunities") await opportunities(c);
 else if(page==="assistant") assistant(c);
 }catch(e){c.innerHTML=`<div class="panel empty">${e.message}</div>`;}}
async function overview(c){
 const d=await api("/dashboard"), admin=user.role==="ADMIN", faculty=user.role==="FACULTY";
 let cards=admin?[stat("Total students",d.students,"♙"),stat("Faculty members",d.faculty,"♧"),stat("Open complaints",d.complaints,"✉"),stat("Published notices",d.notices,"▧")]:
 faculty?[stat("Total students",d.students,"♙"),stat("Attendance entries",d.attendanceEntries,"◷"),stat("Role","Faculty","♧"),stat("Workspace","Active","✓")]:
 [stat("My attendance",d.attendance+"%","◷","Based on recorded classes"),stat("Published mark entries",d.publishedMarks,"▤"),stat("Open complaints",d.openComplaints,"✉"),stat("Portal status","Active","✓")];
 c.innerHTML=`<div class="welcome"><div><div class="eyebrow">SMART CAMPUS · ${user.role} WORKSPACE</div><h2>Welcome back, ${esc(user.name.split(" ")[0])} 👋</h2><p>Your campus, academics and student services — all in one place.</p></div><div class="welcome-icon">✦</div></div>
 <div class="stats-grid">${cards.join("")}</div>
 <div class="dashboard-grid"><div>${panel("Quick access",`<div class="quick-grid">
 ${quick("◷","Attendance","View attendance","attendance")}${quick("▤","Marks & Results","Exam performance","marks")}${quick("▧","Notices","Campus updates","notices")}${quick("✉","Complaints","Track service requests","complaints")}${quick("✳","Campus Assistant","Get quick help","assistant")}${quick("⌕","Lost & Found","Report an item","lost")}
 </div>`)}
 ${panel("Your campus at a glance",`<p class="muted" style="font-size:12px;line-height:1.8">Smart Campus 360 brings academic records, examinations and everyday student services into one connected digital workspace. Use the navigation to explore the modules available to your role.</p>`)}</div>
 <div>${await noticesPreview()}${panel("Portal access",`<div class="notice-item"><b>${user.role} access enabled</b><p>Your account can access the modules assigned to your role. Contact the administrator if access needs to be changed.</p></div>`)}</div></div>`;
 c.querySelectorAll("[data-quick]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.quick)));
}
function quick(icon,title,sub,p){return `<button class="quick" data-quick="${p}"><span>${icon}</span><b>${title}</b><small>${sub}</small></button>`}
async function noticesPreview(){const rows=await api("/notices");return panel("Latest notices",rows.slice(0,3).map(n=>`<div class="notice-item"><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${esc(n.category||"General")}</small></div>`).join("")||'<div class="empty">No notices published yet.</div>')}
function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="empty">No records found.</td></tr>`}</tbody></table></div>`}
async function attendance(c){
 const rows=await api("/attendance"), canEdit=["ADMIN","FACULTY"].includes(user.role);
 c.innerHTML=`${canEdit?panel("Mark attendance",`<form id="attForm" class="form-grid">
 <div><label>Student ID</label><input name="studentId" type="number" min="1" required placeholder="Student database ID"></div>
 <div><label>Subject</label><input name="subject" required placeholder="e.g. Java Programming"></div>
 <div><label>Date</label><input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></div>
 <div><label>Status</label><select name="status"><option>Present</option><option>Absent</option><option>Leave</option></select></div><div class="wide form-actions">${btn("Save attendance")}</div></form>`):""}
 ${panel("Attendance records",table(canEdit?["Student","Roll no.","Subject","Date","Status"]:["Subject","Date","Status"],rows.map(r=>`<tr>${canEdit?`<td><strong>${esc(r.name)}</strong></td><td>${esc(r.roll_no)}</td>`:""}<td>${esc(r.subject)}</td><td>${esc(r.class_date)}</td><td><span class="badge ${r.status==="Present"?"green":r.status==="Absent"?"red":"amber"}">${esc(r.status)}</span></td></tr>`).join("")),"Daily and subject-wise attendance history")}`;
 const f=$("#attForm");if(f)f.onsubmit=async e=>{e.preventDefault();const b=Object.fromEntries(new FormData(f));try{await api("/attendance",{method:"POST",body:JSON.stringify(b)});toast("Attendance saved");render()}catch(x){toast(x.message)}};
}
async function marks(c){
 const rows=await api("/marks"),canEdit=["ADMIN","FACULTY"].includes(user.role);
 c.innerHTML=`${canEdit?panel("Enter examination marks",`<form id="marksForm" class="form-grid">
 <div><label>Student ID</label><input name="studentId" type="number" min="1" required placeholder="Student database ID"></div>
 <div><label>Subject</label><input name="subject" required placeholder="e.g. Database Management"></div>
 <div><label>Examination type</label><select name="examType"><option>INTERNAL</option><option>PRACTICAL</option><option>EXTERNAL</option></select></div>
 <div><label>Semester</label><input name="semester" type="number" min="1" max="12" value="1"></div>
 <div><label>Obtained marks</label><input name="obtained" type="number" min="0" step=".5" required></div>
 <div><label>Maximum marks</label><input name="maxMarks" type="number" min="1" step=".5" value="20" required></div>
 <div class="wide form-actions">${btn("Save marks")}</div></form>`):""}
 ${panel("Examination records",table(canEdit?["Student","Roll no.","Subject","Exam type","Marks","Semester","Status","Action"]:["Subject","Exam type","Marks","Semester"],rows.map(r=>`<tr>${canEdit?`<td><strong>${esc(r.name)}</strong></td><td>${esc(r.roll_no)}</td>`:""}<td>${esc(r.subject)}</td><td><span class="badge">${esc(r.exam_type)}</span></td><td><b>${r.obtained}/${r.max_marks}</b></td><td>${r.semester}</td>${canEdit?`<td><span class="badge ${r.published?"green":"amber"}">${r.published?"Published":"Pending"}</span></td><td>${r.published?"—":`<button class="text-link publish" data-id="${r.id}">Publish</button>`}</td>`:""}</tr>`).join("")),"Internal · Practical · External")}`;
 const f=$("#marksForm");if(f)f.onsubmit=async e=>{e.preventDefault();try{await api("/marks",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(f)))});toast("Marks saved for verification");render()}catch(x){toast(x.message)}};
 c.querySelectorAll(".publish").forEach(b=>b.onclick=async()=>{try{await api(`/marks/${b.dataset.id}/publish`,{method:"PUT"});toast("Marks published");render()}catch(x){toast(x.message)}});
}
async function students(c){
 const rows=await api("/students");
 c.innerHTML=`${panel("Add student",`<form id="studentForm" class="form-grid"><div><label>Full name</label><input name="name" required></div><div><label>Email</label><input name="email" type="email" required></div><div><label>Roll number</label><input name="rollNo" required></div><div><label>Department</label><input name="department" value="MCA"></div><div><label>Semester</label><input name="semester" type="number" value="1" min="1"></div><div><label>Initial password</label><input name="password" value="Student@123"></div><div class="wide form-actions">${btn("Create student account")}</div></form>`)}
 ${panel("Student directory",table(["Name","Roll number","Email","Department","Semester","Status"],rows.map(r=>`<tr><td><strong>${esc(r.name)}</strong></td><td>${esc(r.roll_no||"—")}</td><td>${esc(r.email)}</td><td>${esc(r.department||"—")}</td><td>${r.semester||"—"}</td><td><span class="badge green">${r.active?"Active":"Inactive"}</span></td></tr>`).join("")))}`;
 $("#studentForm").onsubmit=async e=>{e.preventDefault();try{await api("/students",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast("Student created");render()}catch(x){toast(x.message)}};
}
async function faculty(c){
 const rows=await api("/faculty");
 c.innerHTML=`${panel("Add faculty member",`<form id="facultyForm" class="form-grid"><div><label>Full name</label><input name="name" required></div><div><label>Email</label><input name="email" type="email" required></div><div><label>Department</label><input name="department" value="Computer Applications"></div><div><label>Initial password</label><input name="password" value="Faculty@123"></div><div class="wide form-actions">${btn("Create faculty account")}</div></form>`)}
 ${panel("Faculty directory",table(["Name","Email","Department","Status"],rows.map(r=>`<tr><td><strong>${esc(r.name)}</strong></td><td>${esc(r.email)}</td><td>${esc(r.department||"—")}</td><td><span class="badge green">Active</span></td></tr>`).join("")))}`;
 $("#facultyForm").onsubmit=async e=>{e.preventDefault();try{await api("/faculty",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast("Faculty account created");render()}catch(x){toast(x.message)}};
}
async function notices(c){
 const rows=await api("/notices"),admin=user.role==="ADMIN";
 c.innerHTML=`${admin?panel("Publish a notice",`<form id="noticeForm" class="form-grid"><div><label>Notice title</label><input name="title" required></div><div><label>Category</label><select name="category"><option>General</option><option>Examination</option><option>Event</option><option>Placement</option><option>Urgent</option></select></div><div class="wide"><label>Notice details</label><textarea name="body" required></textarea></div><div class="wide form-actions">${btn("Publish notice")}</div></form>`):""}
 ${panel("Campus announcements",rows.map(n=>`<div class="notice-item"><span class="badge">${esc(n.category)}</span><b style="display:block;margin-top:8px">${esc(n.title)}</b><p>${esc(n.body)}</p><small>${esc(n.created_at||"")}</small></div>`).join("")||'<div class="empty">No notices available.</div>')}`;
 const f=$("#noticeForm");if(f)f.onsubmit=async e=>{e.preventDefault();try{await api("/notices",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(f)))});toast("Notice published");render()}catch(x){toast(x.message)}};
}
async function complaints(c){
 const rows=await api("/complaints"),admin=user.role==="ADMIN";
 c.innerHTML=`${user.role==="STUDENT"?panel("Submit a complaint",`<form id="complaintForm" class="form-grid"><div><label>Issue title</label><input name="subject" required></div><div><label>Category</label><select name="category"><option>Classroom</option><option>IT / Wi-Fi</option><option>Library</option><option>Facilities</option><option>Other</option></select></div><div class="wide"><label>Description</label><textarea name="description" required></textarea></div><div class="wide form-actions">${btn("Submit complaint")}</div></form>`):""}
 ${panel("Complaint tracker",table(admin?["Student","Issue","Category","Status","Update"]:["Issue","Category","Status","Admin reply"],rows.map(r=>`<tr>${admin?`<td>${esc(r.name)}<br><small>${esc(r.roll_no||"")}</small></td>`:""}<td><strong>${esc(r.subject)}</strong><br><small>${esc(r.description)}</small></td><td>${esc(r.category)}</td><td><span class="badge ${r.status==="Resolved"?"green":r.status==="Rejected"?"red":"amber"}">${esc(r.status)}</span></td>${admin?`<td><select class="status-select" data-id="${r.id}"><option ${r.status==="Submitted"?"selected":""}>Submitted</option><option ${r.status==="In Progress"?"selected":""}>In Progress</option><option ${r.status==="Resolved"?"selected":""}>Resolved</option><option ${r.status==="Rejected"?"selected":""}>Rejected</option></select><button class="text-link update-complaint" data-id="${r.id}">Save</button></td>`:`<td>${esc(r.admin_reply||"Awaiting response")}</td>`}</tr>`).join("")))}`;
 const f=$("#complaintForm");if(f)f.onsubmit=async e=>{e.preventDefault();try{await api("/complaints",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(f)))});toast("Complaint submitted");render()}catch(x){toast(x.message)}};
 c.querySelectorAll(".update-complaint").forEach(b=>b.onclick=async()=>{const sel=c.querySelector(`.status-select[data-id="${b.dataset.id}"]`);try{await api(`/complaints/${b.dataset.id}`,{method:"PUT",body:JSON.stringify({status:sel.value})});toast("Complaint updated");render()}catch(x){toast(x.message)}});
}
async function lost(c){
 const rows=await api("/lost-found");
 c.innerHTML=`${panel("Report a lost or found item",`<form id="lostForm" class="form-grid"><div><label>Item name</label><input name="itemName" required placeholder="e.g. Blue water bottle"></div><div><label>Report type</label><select name="itemType"><option>LOST</option><option>FOUND</option></select></div><div><label>Location</label><input name="location" placeholder="Where was it seen?"></div><div class="wide"><label>Description</label><textarea name="description"></textarea></div><div class="wide form-actions">${btn("Submit item report")}</div></form>`)}
 ${panel("Community Lost & Found",table(["Item","Type","Reported by","Location","Status"],rows.map(r=>`<tr><td><strong>${esc(r.item_name)}</strong><br><small>${esc(r.description||"")}</small></td><td><span class="badge">${esc(r.item_type)}</span></td><td>${esc(r.name)}</td><td>${esc(r.location||"—")}</td><td>${esc(r.status)}</td></tr>`).join("")))}`;
 $("#lostForm").onsubmit=async e=>{e.preventDefault();try{await api("/lost-found",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});toast("Item report submitted");render()}catch(x){toast(x.message)}};
}
async function queue(c){
 const rows=await api("/queue"),admin=user.role==="ADMIN";
 c.innerHTML=`${!admin?panel("Book an office token",`<form id="queueForm" class="form-grid"><div><label>Office / Department</label><select name="department"><option>Administration</option><option>Accounts</option><option>Examination Cell</option><option>Student Support</option><option>Library</option></select></div><div class="wide form-actions">${btn("Get queue token")}</div></form>`):""}
 ${panel(admin?"Today's queue":"My queue tokens",table(admin?["Token","Student","Department","Visit date","Status"]:["Token","Department","Status","Visit date"],rows.map(r=>`<tr><td><strong>#${r.token_no}</strong></td>${admin?`<td>${esc(r.name)}</td>`:""}<td>${esc(r.department)}</td><td><span class="badge amber">${esc(r.status)}</span></td><td>${esc(r.visit_date)}</td></tr>`).join("")))}`;
 const f=$("#queueForm");if(f)f.onsubmit=async e=>{e.preventDefault();try{const r=await api("/queue",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(f)))});toast("Your token number is #"+r.token);render()}catch(x){toast(x.message)}};
}
async function opportunities(c){
 const rows=await api("/opportunities"),admin=user.role==="ADMIN";
 c.innerHTML=`${admin?panel("Add opportunity",`<form id="oppForm" class="form-grid"><div><label>Title</label><input name="title" required></div><div><label>Organization</label><input name="organization"></div><div><label>Type</label><select name="type"><option>Placement</option><option>Internship</option><option>Workshop</option><option>Hackathon</option></select></div><div><label>Deadline</label><input name="deadline" type="date"></div><div class="wide"><label>Description</label><textarea name="description"></textarea></div><div class="wide form-actions">${btn("Add opportunity")}</div></form>`):""}
 <div class="dashboard-grid">${rows.map(r=>`<div class="panel"><span class="badge">${esc(r.opportunity_type||"Opportunity")}</span><h3 style="margin-top:12px">${esc(r.title)}</h3><div class="panel-sub">${esc(r.organization||"Campus opportunity")}</div><p style="font-size:11px;color:#7e8a9e;line-height:1.7">${esc(r.description||"Details will be shared by the administrator.")}</p><small style="color:#9aa5b5">Deadline: ${esc(r.deadline||"Not specified")}</small></div>`).join("")||panel("Opportunity Hub",'<div class="empty">No opportunities posted yet.</div>')}</div>`;
 const f=$("#oppForm");if(f)f.onsubmit=async e=>{e.preventDefault();try{await api("/opportunities",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(f)))});toast("Opportunity added");render()}catch(x){toast(x.message)}};
}
function assistant(c){
 c.innerHTML=`<div class="panel"><div class="panel-head"><div><h3>✳ Smart Campus Assistant</h3><div class="panel-sub">Campus help, academic guidance and portal navigation</div></div><span class="badge green">Online</span></div>
 <div class="chat-box" id="chatBox"><div class="bubble">Hello ${esc(user.name.split(" ")[0])}! I'm your Smart Campus Assistant. Ask me about attendance, marks, exams, library notices or complaints.</div></div>
 <form id="chatForm" class="chat-input"><input name="question" placeholder="Ask something about your campus…" required><button class="btn primary">Send</button></form>
 <div class="panel-sub" style="margin-top:12px">This demo assistant uses built-in campus help topics; it does not invent official dates or personal records.</div></div>`;
 $("#chatForm").onsubmit=async e=>{e.preventDefault();const f=e.target,q=f.question.value.trim();if(!q)return;const box=$("#chatBox");box.insertAdjacentHTML("beforeend",`<div class="bubble user">${esc(q)}</div>`);f.reset();try{const r=await api("/assistant",{method:"POST",body:JSON.stringify({question:q})});box.insertAdjacentHTML("beforeend",`<div class="bubble">${esc(r.answer)}</div>`)}catch(x){box.insertAdjacentHTML("beforeend",`<div class="bubble">${esc(x.message)}</div>`)}box.scrollTop=box.scrollHeight;};
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
