import {useState,useEffect,useRef,useContext,createContext,useReducer,useCallback} from "react";
import React from "react";

/* ─── PALETTE ─────────────────────────────────────────── */
const P="#5B3DF5",PL="#EDEBFF",PD="#4527D9",T="#0D9488",TL="#CCFBF1",A="#D97706",AL="#FEF3C7",R="#DC2626",RL="#FEE2E2",B="#2563EB",BL="#DBEAFE",G="#64748B",DARK="#0F172A";

/* ─── UTILS ─────────────────────────────────────────── */
const san=s=>String(s||"").replace(/<[^>]*>/g,"").trim().slice(0,500);
const okUrl=s=>{try{return["http:","https:"].includes(new URL(s).protocol);}catch{return false;}};
const db={
  async get(k){try{const v=localStorage.getItem(k);return v?{value:v}:null;}catch{return null;}},
  async set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){console.warn(e);}},
};
const AI_DAILY=20;
const checkAiLimit=async uid=>{const k=`ai-${uid}-${new Date().toDateString().replace(/ /g,"-")}`;try{const r=await db.get(k);const n=r?JSON.parse(r.value):0;if(n>=AI_DAILY)return{ok:false,rem:0};await db.set(k,n+1);return{ok:true,rem:AI_DAILY-n-1};}catch{return{ok:true,rem:AI_DAILY};}};
const aiProxy=async(messages,sys)=>{try{const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages,system:sys})});if(!res.ok)throw new Error();const d=await res.json();return d.reply||"Keep pushing!";}catch{return"Stay consistent!";}};

/* ─── SEED COURSES ─────────────────────────────────── */
const SEED=[
  {id:1,title:"AI Product Management Masterclass",tag:"AI",mrp:8999,offerPrice:4999,free:false,enrolled:1240,rating:4.9,weeks:8,img:"🤖",color:P,status:"active",maxSeats:8,launch:"2025-03-01",start:"2025-03-01T19:00",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"Master the art of AI product management with real-world case studies, proven frameworks, and live mentorship from India's top AI PM practitioner.",highlights:["8 live weekend sessions","3 real-world capstone projects","Industry-recognised certificate","Lifetime community access","1:1 mentorship"],curriculum:[{ch:1,title:"Introduction to AI & Product Thinking",duration:"60 min",assignment:{title:"Write your AI product vision statement",submitted:false}},{ch:2,title:"Roadmapping AI Products",duration:"75 min",assignment:{title:"Build a 6-month AI product roadmap",submitted:false}},{ch:3,title:"Stakeholder Management",duration:"60 min",assignment:null},{ch:4,title:"Metrics, KPIs & OKRs for AI",duration:"90 min",assignment:{title:"Design a complete OKR framework",submitted:false}},{ch:5,title:"AI Product Capstone Project",duration:"120 min",assignment:{title:"Full AI PM case study presentation",submitted:false}}]},
  {id:2,title:"TPM Bootcamp: Systems Thinking",tag:"TPM",mrp:6999,offerPrice:2499,free:false,enrolled:890,rating:4.8,weeks:6,img:"⚙️",color:T,status:"active",maxSeats:5,launch:"2025-02-10",start:"2025-02-10T18:30",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"Become a world-class Technical Program Manager with systems thinking, cross-functional leadership, and interview preparation.",highlights:["6 live sessions","Systems design deep dives","TPM interview prep","Certificate included"],curriculum:[{ch:1,title:"Systems Thinking Fundamentals",duration:"75 min",assignment:{title:"Map a complex system of your choice",submitted:false}},{ch:2,title:"Cross-functional Leadership",duration:"60 min",assignment:null},{ch:3,title:"Risk Management & Mitigation",duration:"90 min",assignment:{title:"Risk register for a real project",submitted:false}},{ch:4,title:"Execution Excellence",duration:"75 min",assignment:null},{ch:5,title:"TPM Interview Masterclass",duration:"90 min",assignment:{title:"Mock interview self-recording",submitted:false}}]},
  {id:3,title:"Build with Claude API",tag:"AI",mrp:2999,offerPrice:null,free:true,enrolled:3400,rating:4.7,weeks:4,img:"🧠",color:A,status:"active",maxSeats:100,launch:"2025-01-15",start:"2025-01-15T20:00",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"Build production-ready AI apps using Claude API. No prior AI experience needed — just curiosity and a laptop.",highlights:["4 hands-on modules","Build 3 real AI apps","Community support","Free forever"],curriculum:[{ch:1,title:"API Basics & Setup",duration:"45 min",assignment:{title:"Build your first Claude API call",submitted:false}},{ch:2,title:"Prompt Engineering Mastery",duration:"60 min",assignment:{title:"Design 5 production prompts",submitted:false}},{ch:3,title:"RAG Systems & Knowledge Bases",duration:"75 min",assignment:null},{ch:4,title:"Deploy to Production",duration:"60 min",assignment:{title:"Deploy your AI app live",submitted:false}}]},
  {id:4,title:"Data Storytelling for PMs",tag:"Analytics",mrp:4999,offerPrice:2499,free:false,enrolled:560,rating:4.8,weeks:5,img:"📊",color:B,status:"upcoming",maxSeats:12,launch:"2025-09-01",start:"2025-09-01T19:00",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"Turn data into decisions. Learn SQL, dashboards, A/B testing and compelling data stories that drive product strategy.",highlights:["5 live sessions","SQL for PMs","Dashboard creation","A/B test design"],curriculum:[{ch:1,title:"SQL for Product Managers",duration:"90 min",assignment:{title:"Write 10 product SQL queries",submitted:false}},{ch:2,title:"Metrics that Matter",duration:"60 min",assignment:null},{ch:3,title:"Dashboard Design Principles",duration:"75 min",assignment:{title:"Build a product metrics dashboard",submitted:false}},{ch:4,title:"A/B Testing Framework",duration:"90 min",assignment:{title:"Design an A/B test for a feature",submitted:false}}]},
  {id:5,title:"Career Acceleration: Tier-2 to Tech",tag:"Career",mrp:1999,offerPrice:null,free:true,enrolled:5200,rating:4.9,weeks:3,img:"🚀",color:R,status:"active",maxSeats:200,launch:"2025-01-01",start:"2025-01-01T18:00",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"The complete playbook to break into top tech companies from Tier-2 cities. Resume, LinkedIn, interviews and negotiation.",highlights:["3 modules","Resume & LinkedIn templates","Interview playbook","Free forever"],curriculum:[{ch:1,title:"Resume Reboot for Tech",duration:"45 min",assignment:{title:"Rewrite your resume using the template",submitted:false}},{ch:2,title:"LinkedIn Strategy & Personal Brand",duration:"60 min",assignment:{title:"Optimise your LinkedIn profile",submitted:false}},{ch:3,title:"Interview Playbook & Negotiation",duration:"75 min",assignment:null}]},
  {id:6,title:"GenAI for Non-Technical Founders",tag:"AI",mrp:3999,offerPrice:1999,free:false,enrolled:720,rating:4.7,weeks:4,img:"💡",color:P,status:"upcoming",maxSeats:15,launch:"2025-10-01",start:"2025-10-01T19:00",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"Leverage AI without writing code. Evaluate, implement and scale AI solutions for your business as a non-technical founder.",highlights:["4 live sessions","No coding required","AI vendor evaluation","ROI calculation tools"],curriculum:[{ch:1,title:"The AI Landscape 2025",duration:"60 min",assignment:null},{ch:2,title:"Use-Case Mapping for Your Business",duration:"75 min",assignment:{title:"Map 3 AI use cases for your company",submitted:false}},{ch:3,title:"Vendor Selection & Evaluation",duration:"60 min",assignment:{title:"Create an AI vendor scorecard",submitted:false}},{ch:4,title:"ROI Calculation & Governance",duration:"60 min",assignment:null}]},
  {id:7,title:"Personal Branding for Tech Professionals",tag:"Career",mrp:1499,offerPrice:null,free:true,enrolled:2800,rating:4.8,weeks:2,img:"⭐",color:T,status:"active",maxSeats:500,launch:"2025-01-01",start:"2025-01-01T18:00",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"Build a powerful personal brand on LinkedIn and Twitter that attracts opportunities. Used by 2,800+ tech professionals.",highlights:["2 modules","Content templates","Profile audit checklist","Free forever"],curriculum:[{ch:1,title:"Personal Brand Foundations",duration:"45 min",assignment:{title:"Define your personal brand statement",submitted:false}},{ch:2,title:"Content Strategy & Consistency",duration:"60 min",assignment:{title:"Create a 30-day content calendar",submitted:false}}]},
  {id:8,title:"AI Fundamentals for Everyone",tag:"AI",mrp:999,offerPrice:null,free:true,enrolled:4100,rating:4.6,weeks:2,img:"🌟",color:A,status:"active",maxSeats:1000,launch:"2025-01-01",start:"2025-01-01T18:00",speaker:"Shobhit Shubham Saxena",speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",desc:"Your first step into the world of AI. Understand how AI works, where it's used, and how to leverage it in your daily work.",highlights:["2 beginner modules","No prerequisites","Certificate included","Free forever"],curriculum:[{ch:1,title:"What is AI & How Does it Work?",duration:"45 min",assignment:{title:"Identify 5 AI tools you can use today",submitted:false}},{ch:2,title:"AI in Your Industry",duration:"60 min",assignment:null}]},
];
const FREE_IDS=SEED.filter(c=>c.free).map(c=>c.id);
const BLOGS=[
  {title:"Why Tier-2 India is the next EdTech frontier",tag:"EdTech",date:"Mar 28, 2025",read:"5 min"},
  {title:"AI won't replace PMs — it will amplify them",tag:"AI + Product",date:"Mar 15, 2025",read:"7 min"},
  {title:"From Meerut to Meta: the TPM playbook",tag:"Career",date:"Feb 28, 2025",read:"6 min"}
];
const TESTIMONIALS=[
  {name:"Priya Sharma",role:"PM @ Flipkart",text:"Shobhit's AI PM course changed how I think about roadmaps. Got promoted within 3 months.",av:"PS"},
  {name:"Rahul Verma",role:"TPM @ Meesho",text:"Best TPM content in India, period. The systems thinking module alone is worth 10x the price.",av:"RV"},
  {name:"Anjali Singh",role:"SDE-2 → PM @ Swiggy",text:"Transitioned from engineering to PM in 6 months. The community support is incredible.",av:"AS"},
  {name:"Vikram Nair",role:"Founder @ TechStartup",text:"The GenAI course helped me identify 3 use-cases that saved my company ₹40L/year.",av:"VN"},
];
const INIT_CHAT=[
  {user:"Priya S",msg:"This makes so much sense!",time:"10:32",av:"PS",isMe:false},
  {user:"Rahul V",msg:"Can you elaborate on RICE?",time:"10:33",av:"RV",isMe:false},
];
const LB=[
  {rank:1,name:"Priya Sharma",pts:1840,badge:"🥇",isMe:false},
  {rank:2,name:"Rahul Verma",pts:1620,badge:"🥈",isMe:false},
  {rank:3,name:"You",pts:1540,badge:"🥉",isMe:true},
  {rank:4,name:"Anjali Singh",pts:1290,badge:"",isMe:false},
  {rank:5,name:"Amit Kumar",pts:1100,badge:"",isMe:false},
];
const AI_EXTENSIONS=[
  {id:1,name:"AI Notes Taker",desc:"Auto-capture & summarise anything you read online",icon:"📝",url:"https://chromewebstore.google.com"},
  {id:2,name:"AI Research Assistant",desc:"Deep-dive any topic with one click",icon:"🔍",url:"https://chromewebstore.google.com"},
  {id:3,name:"AI Writing Coach",desc:"Real-time suggestions as you write anywhere",icon:"✍️",url:"https://chromewebstore.google.com"},
];

/* ─── GLOBAL STATE ──────────────────────────────────── */
const Ctx=createContext(null);
const useApp=()=>useContext(Ctx);
const INIT_STATE={user:null,courses:SEED,enrollments:[],waitlist:[],toasts:[],pdp:null,payment:null,hydrated:false};

function reducer(s,a){
  switch(a.type){
    case "HYDRATE":return{...s,...a.p,hydrated:true};
    case "SET_USER":return{...s,user:a.v};
    case "LOGOUT":return{...s,user:null,enrollments:[],waitlist:[]};
    case "ADD_COURSE":return{...s,courses:[...s.courses,a.v]};
    case "REMOVE_COURSE":return{...s,courses:s.courses.filter(c=>c.id!==a.id)};
    case "UPDATE_COURSE":return{...s,courses:s.courses.map(c=>c.id===a.id?{...c,...a.v}:c)};
    case "ADD_ENROLLMENT":return{...s,enrollments:[...s.enrollments,a.v]};
    case "ADD_WAITLIST":return{...s,waitlist:[...s.waitlist,a.v]};
    case "REMOVE_WAITLIST":return{...s,waitlist:s.waitlist.filter(w=>!(w.userId===a.userId&&w.courseId===a.courseId))};
    case "UPDATE_PROGRESS":return{...s,enrollments:s.enrollments.map(e=>e.userId===a.userId&&e.courseId===a.courseId?{...e,progress:Math.max(e.progress,a.pct),completed:a.pct>=100}:e)};
    case "COMPLETE_CHAPTER":return{...s,enrollments:s.enrollments.map(e=>e.userId===a.userId&&e.courseId===a.courseId?{...e,chapters:{...(e.chapters||{}),[a.chIdx]:true}}:e)};
    case "SUBMIT_ASSIGNMENT":return{...s,enrollments:s.enrollments.map(e=>e.userId===a.userId&&e.courseId===a.courseId?{...e,assignments:{...(e.assignments||{}),[a.chIdx]:a.text}}:e)};
    case "TOAST":return{...s,toasts:[...s.toasts,{id:Date.now(),...a.v}]};
    case "DISMISS_TOAST":return{...s,toasts:s.toasts.filter(t=>t.id!==a.id)};
    case "SET_PDP":return{...s,pdp:a.v};
    case "SET_PAYMENT":return{...s,payment:a.v};
    default:return s;
  }
}
function getRecs(state){
  if(!state.user)return[];
  const me=state.enrollments.filter(e=>e.userId===state.user.id);
  const ids=new Set(me.map(e=>e.courseId));
  const tags=new Set(me.map(e=>state.courses.find(c=>c.id===e.courseId)?.tag).filter(Boolean));
  return state.courses.filter(c=>!ids.has(c.id)&&c.status!=="draft").map(c=>({...c,_s:(tags.has(c.tag)?3:0)+c.rating+(c.free?.5:0)})).sort((a,b)=>b._s-a._s).slice(0,4);
}
function AppProvider({children}){
  const[state,dispatch]=useReducer(reducer,INIT_STATE);
  useEffect(()=>{(async()=>{const saved=await db.get("vstig-v5");let p=null;try{if(saved)p=JSON.parse(saved.value);}catch{}dispatch({type:"HYDRATE",p:{courses:p?.courses||SEED,enrollments:p?.enrollments||[],waitlist:p?.waitlist||[],user:p?.user||null}});})();},[]);
  useEffect(()=>{if(!state.hydrated)return;db.set("vstig-v5",{courses:state.courses,enrollments:state.enrollments,waitlist:state.waitlist,user:state.user});},[state.courses,state.enrollments,state.waitlist,state.user,state.hydrated]);
  return<Ctx.Provider value={{state,dispatch}}>{children}</Ctx.Provider>;
}

/* ─── UI PRIMITIVES ─────────────────────────────────── */
const Btn=({children,variant="primary",onClick,small,disabled,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{padding:small?"6px 14px":"11px 24px",borderRadius:10,border:`1.5px solid ${variant==="primary"?P:variant==="outline"?P:"transparent"}`,background:variant==="primary"?P:"transparent",color:variant==="primary"?"#fff":P,fontSize:small?12:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.6:1,whiteSpace:"nowrap",...style}}>{children}</button>
);
const Tag=({c=P,bg=PL,children,small})=><span style={{background:bg,color:c,fontSize:small?10:11,fontWeight:500,padding:small?"2px 7px":"4px 12px",borderRadius:20}}>{children}</span>;
const Card=({children,style={}})=><div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:16,padding:"20px 22px",...style}}>{children}</div>;
const Avatar=({initials,size=36,color=P,src})=>(
  <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",color,fontSize:size*0.36,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
    {src?<img src={src} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>{e.target.style.display="none";}}/>:initials}
  </div>
);
const Star=()=><span style={{color:"#F59E0B",fontSize:12}}>★</span>;
const ProgressBar=({pct,color=P})=>(
  <div style={{background:"#f1f5f9",borderRadius:99,height:6,overflow:"hidden"}}>
    <div style={{width:`${pct||0}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.6s"}}/>
  </div>
);
const Skeleton=({w="100%",h=14,r=6})=><div style={{width:w,height:h,borderRadius:r,background:"#f1f5f9",animation:"pulse 1.4s ease-in-out infinite"}}/>;
const batchStatus=c=>{const now=new Date(),ld=new Date(c.launch),sd=new Date(c.start);if(ld.toDateString()===now.toDateString()||sd.toDateString()===now.toDateString())return"live";if(ld>now)return"upcoming";return"active";};
const PriceDisplay=({c,large})=>{const fs=large?20:15,sm=large?13:11;if(c.free)return<span style={{fontSize:fs,fontWeight:700,color:T}}>Free</span>;if(c.offerPrice)return<span style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}><span style={{fontSize:fs,fontWeight:700,color:T}}>₹{Number(c.offerPrice).toLocaleString()}</span><span style={{fontSize:sm,color:G,textDecoration:"line-through"}}>₹{Number(c.mrp).toLocaleString()}</span><Tag c={T} bg={TL} small>Save ₹{(Number(c.mrp)-Number(c.offerPrice)).toLocaleString()}</Tag></span>;return<span style={{fontSize:fs,fontWeight:700,color:c.color}}>₹{Number(c.mrp).toLocaleString()}</span>;};
const StatusBadge=({status})=>{const m={live:[R,RL,"🔴 Live"],active:[T,TL,"Active"],upcoming:[A,AL,"Upcoming"],draft:[G,"#f1f5f9","Draft"]};const[co,bg,l]=m[status]||m.active;return<Tag c={co} bg={bg} small>{l}</Tag>;};
const TOAST_C={success:{bg:TL,c:"#065f46"},error:{bg:RL,c:"#7f1d1d"},info:{bg:BL,c:"#1e3a5f"}};
function ToastItem({t}){
  const{dispatch}=useApp();
  useEffect(()=>{const id=setTimeout(()=>dispatch({type:"DISMISS_TOAST",id:t.id}),3500);return()=>clearTimeout(id);},[t.id]);
  const col=TOAST_C[t.kind]||TOAST_C.info;
  return<div style={{background:col.bg,color:col.c,padding:"12px 18px",borderRadius:12,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:10,minWidth:260,maxWidth:360,boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}><span style={{flex:1}}>{t.msg}</span><button onClick={()=>dispatch({type:"DISMISS_TOAST",id:t.id})} style={{background:"none",border:"none",cursor:"pointer",color:col.c,fontSize:18}}>×</button></div>;
}
function CountdownBadge({target}){
  const calc=useCallback(()=>{const d=new Date(target)-new Date();if(d<=0)return null;return{d:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)};},[target]);
  const[t,setT]=useState(calc);
  useEffect(()=>{setT(calc());const id=setInterval(()=>setT(calc()),1000);return()=>clearInterval(id);},[calc]);
  if(!t)return<div style={{padding:"8px 14px",borderRadius:8,background:RL,color:R,fontSize:12,marginBottom:12}}>Scheduled time has passed</div>;
  return<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:AL,marginBottom:12}}><span style={{fontSize:12,color:A,fontWeight:500}}>Launches in:</span><div style={{display:"flex",gap:6}}>{[["Days",t.d],["Hrs",t.h],["Min",t.m],["Sec",t.s]].map(([l,v])=><div key={l} style={{textAlign:"center",background:"#fff",borderRadius:8,padding:"4px 10px",minWidth:44}}><div style={{fontSize:16,fontWeight:700,color:A,lineHeight:1}}>{String(v).padStart(2,"0")}</div><div style={{fontSize:9,color:G,marginTop:2}}>{l}</div></div>)}</div></div>;
}
function requireRole(user,role){return user?.role===role;}

/* ─── PDP MODAL ─────────────────────────────────────── */
function PDPModal(){
  const{state,dispatch}=useApp();
  const c=state.pdp;if(!c)return null;
  const close=()=>dispatch({type:"SET_PDP",v:null});
  const{user,enrollments,waitlist}=state;
  const status=batchStatus(c);
  const isEnrolled=enrollments.some(e=>e.userId===user?.id&&e.courseId===c.id);
  const seatsUsed=enrollments.filter(e=>e.courseId===c.id).length;
  const maxSeats=c.maxSeats??null;
  const isFull=maxSeats!==null&&seatsUsed>=maxSeats;
  const wlQueue=waitlist.filter(w=>w.courseId===c.id);
  const myWaitIdx=waitlist.findIndex(w=>w.userId===user?.id&&w.courseId===c.id);
  const isOnWaitlist=myWaitIdx!==-1;
  const handleEnroll=()=>{
    if(!user){dispatch({type:"SET_PDP",v:null});return;}
    if(isFull&&!isEnrolled){if(isOnWaitlist){dispatch({type:"TOAST",v:{kind:"info",msg:`You're #${myWaitIdx+1} on the waitlist.`}});return;}dispatch({type:"ADD_WAITLIST",v:{id:Date.now(),userId:user.id,courseId:c.id,name:user.name,joinedAt:new Date().toISOString()}});dispatch({type:"TOAST",v:{kind:"info",msg:`You're #${wlQueue.length+1} on the waitlist!`}});close();return;}
    if(c.free||!c.offerPrice){dispatch({type:"ADD_ENROLLMENT",v:{id:Date.now(),userId:user.id,courseId:c.id,enrolledAt:new Date().toISOString(),progress:0,completed:false,paymentRef:null,chapters:{},assignments:{}}});dispatch({type:"TOAST",v:{kind:"success",msg:`Enrolled in "${c.title}"!`}});close();}else{close();dispatch({type:"SET_PAYMENT",v:c});}
  };
  return<div onClick={e=>e.target===e.currentTarget&&close()} style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"60px 16px 40px",background:"rgba(0,0,0,0.5)",overflowY:"auto"}}>
    <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",maxWidth:580,width:"100%",position:"relative"}}>
      <button onClick={close} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:22,cursor:"pointer",color:G}}>×</button>
      <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:20}}>
        <div style={{width:68,height:68,borderRadius:16,background:`${c.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,flexShrink:0}}>{c.img}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}><Tag c={c.color} bg={c.color+"22"}>{c.tag}</Tag>{c.free&&<Tag c={T} bg={TL}>Free</Tag>}<StatusBadge status={status}/></div>
          <div style={{fontSize:18,fontWeight:600,marginBottom:4,lineHeight:1.3}}>{c.title}</div>
          <div style={{fontSize:13,color:G}}>{c.weeks} weeks · {seatsUsed.toLocaleString()} enrolled{c.rating&&` · ★ ${c.rating}`}</div>
        </div>
      </div>
      {status==="upcoming"&&c.start&&<CountdownBadge target={c.start}/>}
      <p style={{fontSize:14,color:"#475569",lineHeight:1.7,marginBottom:16}}>{c.desc}</p>
      {c.highlights?.length>0&&<div style={{marginBottom:16,background:"#f8fafc",borderRadius:10,padding:"12px 16px"}}><div style={{fontSize:12,fontWeight:600,color:DARK,marginBottom:8}}>What you'll get</div>{c.highlights.map(h=><div key={h} style={{fontSize:13,color:"#475569",marginBottom:4,display:"flex",gap:8}}><span style={{color:T}}>✓</span>{h}</div>)}</div>}
      {c.curriculum?.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:600,color:DARK,marginBottom:8}}>Curriculum ({c.curriculum.length} chapters)</div>{c.curriculum.map(ch=><div key={ch.ch} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"0.5px solid #f1f5f9",fontSize:13}}><span>{ch.ch}. {ch.title}</span><span style={{color:G,flexShrink:0}}>{ch.duration}</span></div>)}</div>}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}><PriceDisplay c={c} large/>{isEnrolled?<Tag c={T} bg={TL}>✓ Already enrolled</Tag>:!user?<Btn onClick={()=>{close();}}>Login to Enroll</Btn>:isFull?<Btn onClick={handleEnroll}>{isOnWaitlist?`Waitlisted — #${myWaitIdx+1}`:`Join Waitlist`}</Btn>:<Btn onClick={handleEnroll}>{c.free?"Enroll Free →":"Buy Now →"}</Btn>}</div>
      {c.speaker&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#f8fafc",borderRadius:12}}><Avatar initials={c.speaker[0]} size={44} color={P} src={c.speakerPic||null}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{c.speaker}</div><div style={{fontSize:11,color:G}}>{c.speakerRole}</div></div>{c.linkedin&&okUrl(c.linkedin)&&<a href={c.linkedin} target="_blank" rel="noreferrer" style={{padding:"7px 14px",borderRadius:8,background:"#0A66C2",color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none"}}>LinkedIn</a>}</div>}
    </div>
  </div>;
}

/* ─── PAYMENT MODAL ─────────────────────────────────── */
function PaymentModal(){
  const{state,dispatch}=useApp();
  const c=state.payment;
  const[step,setStep]=useState("checkout");
  const[method,setMethod]=useState("card");
  const[processing,setProcessing]=useState(false);
  if(!c)return null;
  const close=()=>{dispatch({type:"SET_PAYMENT",v:null});setStep("checkout");};
  const price=c.offerPrice||c.mrp;
  const pay=async()=>{
    setProcessing(true);await new Promise(r=>setTimeout(r,2000));
    const ref="pay_"+Math.random().toString(36).slice(2,10);
    dispatch({type:"ADD_ENROLLMENT",v:{id:Date.now(),userId:state.user.id,courseId:c.id,enrolledAt:new Date().toISOString(),progress:0,completed:false,paymentRef:ref,chapters:{},assignments:{}}});
    dispatch({type:"TOAST",v:{kind:"success",msg:`Payment successful! Enrolled in "${c.title}".`}});
    setStep("success");setProcessing(false);
  };
  const IS={padding:"11px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:13,width:"100%",boxSizing:"border-box"};
  return<div onClick={e=>e.target===e.currentTarget&&close()} style={{position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.55)"}}>
    <div style={{background:"#fff",borderRadius:24,padding:"28px 26px",maxWidth:440,width:"100%"}}>
      {step==="checkout"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}><div><div style={{fontSize:16,fontWeight:600,marginBottom:2}}>{c.title}</div><div style={{fontSize:12,color:G}}>{c.weeks} weeks · {c.tag}</div></div><button onClick={close} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:G}}>×</button></div>
        <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span>Course MRP</span><span>₹{Number(c.mrp).toLocaleString()}</span></div>
          {c.offerPrice&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6,color:T}}><span>Discount</span><span>-₹{(Number(c.mrp)-Number(c.offerPrice)).toLocaleString()}</span></div>}
          <div style={{borderTop:"0.5px solid #e2e8f0",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:600}}><span>Total</span><span style={{color:T}}>₹{Number(price).toLocaleString()}</span></div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["card","💳 Card"],["upi","⚡ UPI"]].map(([k,l])=><button key={k} onClick={()=>setMethod(k)} style={{flex:1,padding:"10px",borderRadius:10,border:`2px solid ${method===k?P:"#e2e8f0"}`,background:method===k?PL:"#fff",color:method===k?P:G,fontSize:13,fontWeight:method===k?600:400,cursor:"pointer"}}>{l}</button>)}
        </div>
        {method==="card"&&<div style={{display:"grid",gap:10,marginBottom:16}}>
          <input placeholder="Card number: 4111 1111 1111 1111" style={IS}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><input placeholder="MM / YY" style={IS}/><input placeholder="CVV" style={IS}/></div>
          <input placeholder="Name on card" style={IS}/>
        </div>}
        {method==="upi"&&<div style={{marginBottom:16}}><input placeholder="Enter UPI ID (e.g. name@upi)" style={IS}/></div>}
        <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:12,color:"#166534"}}>🔒 Test mode — no real charge</div>
        <button onClick={pay} disabled={processing} style={{width:"100%",padding:"14px",borderRadius:12,background:processing?"#9ca3af":P,border:"none",color:"#fff",fontSize:15,fontWeight:600,cursor:processing?"not-allowed":"pointer"}}>{processing?"Processing...":"Pay ₹"+Number(price).toLocaleString()}</button>
      </>}
      {step==="success"&&<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:56,marginBottom:12}}>🎉</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:6}}>Payment Successful!</div>
        <div style={{fontSize:14,color:G,marginBottom:20}}>You're enrolled in <strong>{c.title}</strong></div>
        <Btn onClick={close}>Go to Dashboard →</Btn>
      </div>}
    </div>
  </div>;
}

/* ─── AUTH MODAL ─────────────────────────────────────── */
function AuthModal({onClose,onLogin}){
  const{dispatch}=useApp();
  const[step,setStep]=useState("start");
  const[cc,setCc]=useState("+91");
  const[mobile,setMobile]=useState("");
  const[otp,setOtp]=useState(["","","","",""]);
  const[name,setName]=useState("");
  const[avatar,setAvatar]=useState("🧑‍💻");
  const[sending,setSending]=useState(false);
  const r0=useRef(),r1=useRef(),r2=useRef(),r3=useRef(),r4=useRef();
  const refs=[r0,r1,r2,r3,r4];
  const CCS=["+91","+1","+44","+61","+971","+65","+60","+880"];
  const handleOtp=(i,v)=>{if(!/^\d?$/.test(v))return;const n=[...otp];n[i]=v;setOtp(n);if(v&&i<4)refs[i+1].current?.focus();};
  const login=(role="student")=>{
    const user={id:"u-"+Date.now(),name:san(name)||"Learner",avatar,role,mobile:cc+mobile,profileComplete:false};
    dispatch({type:"SET_USER",v:user});
    dispatch({type:"TOAST",v:{kind:"success",msg:`Welcome, ${user.name}! Complete your profile.`}});
    onClose();onLogin?.(role);
  };
  const sendOtp=async()=>{if(mobile.length<7)return;setSending(true);await new Promise(r=>setTimeout(r,900));setSending(false);setStep("otp");};
  const verifyOtp=()=>{if(otp.join("").length===5)setStep("profile");};
  const isDev=true;
  const steps=["start","otp","profile"];const idx=steps.indexOf(step);
  const inp={width:"100%",padding:"13px 14px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#f9f9f9",fontSize:14,color:DARK,outline:"none",boxSizing:"border-box"};
  return<div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(10,5,40,0.7)",backdropFilter:"blur(8px)"}}>
    <div style={{width:"100%",maxWidth:440,background:"#fff",borderRadius:28,overflow:"hidden",boxShadow:"0 30px 100px rgba(91,61,245,0.25)"}}>
      <div style={{background:`linear-gradient(135deg,${DARK} 0%,#2d1a6e 100%)`,padding:"32px 32px 26px",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.12)",border:"none",color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
          <img src="/logo.png" alt="V" style={{height:46,width:46,objectFit:"contain",borderRadius:12}} onError={e=>{e.target.style.display="none";}}/>
          <div><div style={{color:"#fff",fontWeight:700,fontSize:19}}>Vestigia Technologies</div><div style={{color:"#a78bfa",fontSize:12,marginTop:2}}>India's AI-first learning platform</div></div>
        </div>
        <div style={{display:"flex",gap:5}}>{steps.map((s,i)=><div key={s} style={{height:3,borderRadius:99,background:i<=idx?"#a78bfa":"rgba(255,255,255,0.15)",flex:i===idx?2:1,transition:"all 0.4s"}}/>)}</div>
      </div>
      <div style={{padding:"30px 32px 34px"}}>
        {step==="start"&&<>
          <div style={{fontSize:24,fontWeight:700,color:DARK,marginBottom:4}}>Get started free</div>
          <div style={{fontSize:13,color:G,marginBottom:26}}>Join 12,000+ learners mastering AI & Product</div>
          <button onClick={()=>setStep("profile")} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid #e2e8f0",background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",marginBottom:18,fontSize:14,color:DARK,fontWeight:500}}>
            <svg width="20" height="20" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><div style={{flex:1,height:1,background:"#e9ecef"}}/><span style={{fontSize:12,color:G,fontWeight:500}}>or sign in with mobile</span><div style={{flex:1,height:1,background:"#e9ecef"}}/></div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <select value={cc} onChange={e=>setCc(e.target.value)} style={{padding:"13px 10px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#f9f9f9",color:DARK,fontSize:14,width:90,flexShrink:0,cursor:"pointer"}}>
              {CCS.map(c=><option key={c}>{c}</option>)}
            </select>
            <input value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,""))} placeholder="Mobile number" maxLength={12} style={{...inp,marginBottom:0}}/>
          </div>
          <button onClick={sendOtp} disabled={sending||mobile.length<7} style={{width:"100%",padding:"14px",borderRadius:14,background:mobile.length>=7?P:"#c7bcff",border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:mobile.length>=7?"pointer":"not-allowed"}}>
            {sending?"Sending OTP...":"Send OTP →"}
          </button>
          {isDev&&<button onClick={()=>login("admin")} style={{width:"100%",padding:"8px",marginTop:10,background:"none",border:"none",color:"#94a3b8",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Dev: Admin login</button>}
        </>}
        {step==="otp"&&<>
          <div style={{fontSize:24,fontWeight:700,color:DARK,marginBottom:4}}>Verify your number</div>
          <div style={{fontSize:13,color:G,marginBottom:6}}>5-digit OTP sent to</div>
          <div style={{fontSize:16,fontWeight:700,color:P,marginBottom:26}}>{cc} {mobile} <button onClick={()=>setStep("start")} style={{background:"none",border:"none",color:G,fontSize:12,cursor:"pointer",fontWeight:400,textDecoration:"underline"}}>Change</button></div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:8}}>
            {otp.map((v,i)=><input key={i} ref={refs[i]} maxLength={1} value={v} onChange={e=>handleOtp(i,e.target.value)} onKeyDown={e=>{if(e.key==="Backspace"&&!v&&i>0)refs[i-1].current?.focus();}} style={{width:52,height:60,textAlign:"center",fontSize:26,fontWeight:700,borderRadius:14,border:`2.5px solid ${v?P:"#e2e8f0"}`,background:v?PL:"#f9f9f9",color:DARK,outline:"none"}}/>)}
          </div>
          <div style={{textAlign:"center",marginBottom:22}}><button onClick={sendOtp} style={{background:"none",border:"none",color:P,cursor:"pointer",fontSize:12,fontWeight:500}}>Resend OTP</button></div>
          <button onClick={verifyOtp} disabled={otp.join("").length<5} style={{width:"100%",padding:"14px",borderRadius:14,background:otp.join("").length===5?P:"#c7bcff",border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:otp.join("").length===5?"pointer":"not-allowed"}}>Verify & Continue →</button>
        </>}
        {step==="profile"&&<>
          <div style={{fontSize:24,fontWeight:700,color:DARK,marginBottom:4}}>Set up your profile</div>
          <div style={{fontSize:13,color:G,marginBottom:20}}>You can update everything later in Profile settings</div>
          <div style={{background:"#f8f7ff",border:"1.5px solid #e2d9f3",borderRadius:14,padding:14,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:P,textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Choose your avatar</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["🧑‍💻","👩‍💻","🧑‍🎓","👩‍🎓","🦊","🚀","🧠","⚡","🎯","🏆"].map(a=><button key={a} onClick={()=>setAvatar(a)} style={{width:44,height:44,fontSize:22,borderRadius:12,border:`2px solid ${avatar===a?P:"#e2d9f3"}`,background:avatar===a?PL:"#fff",cursor:"pointer"}}>{a}</button>)}</div>
          </div>
          <input placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)} style={{...inp,marginBottom:16}}/>
          <button onClick={()=>login("student")} style={{width:"100%",padding:"14px",borderRadius:14,background:P,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>{avatar} Start Learning →</button>
          <div style={{textAlign:"center",fontSize:11,color:G,marginTop:12}}>By joining you agree to our <span style={{color:P,cursor:"pointer"}}>Terms</span> & <span style={{color:P,cursor:"pointer"}}>Privacy Policy</span></div>
        </>}
      </div>
    </div>
  </div>;
}

/* ─── PROFILE PAGE ───────────────────────────────────── */
function ProfilePage({setPage}){
  const{state,dispatch}=useApp();
  const{user}=state;
  const[tab,setTab]=useState("profile");
  const[name,setName]=useState(user?.name||"");
  const[avatar,setAvatar]=useState(user?.avatar||"🧑‍💻");
  const[picUrl,setPicUrl]=useState(user?.picUrl||"");
  const[interests,setInterests]=useState(user?.interests||[]);
  const[cc,setCc]=useState("+91");
  const[mobile,setMobile]=useState("");
  const[otpSent,setOtpSent]=useState(false);
  const[otp,setOtp]=useState(["","","","",""]);
  const[address,setAddress]=useState(user?.address||{line1:"",line2:"",city:"",state:"",pin:""});
  const r0=useRef(),r1=useRef(),r2=useRef(),r3=useRef(),r4=useRef();
  const refs=[r0,r1,r2,r3,r4];
  const INTERESTS=["AI & Machine Learning","Product Management","Technical Program Management","System Design","Data Science","Career Growth","Entrepreneurship","Web Development","Cloud & DevOps","UI/UX Design","Business Strategy","Personal Branding"];
  const STATES_IN=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu & Kashmir","Ladakh","Puducherry"];
  const CCS=["+91","+1","+44","+61","+971","+65","+60"];
  const handleOtp=(i,v)=>{if(!/^\d?$/.test(v))return;const n=[...otp];n[i]=v;setOtp(n);if(v&&i<4)refs[i+1].current?.focus();};
  const toggleInterest=i=>setInterests(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i]);
  const completion=Math.min(100,[picUrl||avatar!=="🧑‍💻",name.length>2,interests.length>0,address.pin.length===6,user?.mobile?.length>8].filter(Boolean).length*20);
  const IS2={width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:14,background:"#f8fafc",color:DARK,outline:"none",boxSizing:"border-box"};
  const TABS=[["profile","👤","Profile"],["contact","📱","Contact"],["interests","🎯","Interests"],["address","📍","Address"],["kyc","🔐","KYC"]];
  if(!user)return null;
  const saveProfile=()=>{
    dispatch({type:"SET_USER",v:{...user,name:san(name)||user.name,avatar,picUrl,interests,address,profileComplete:true}});
    dispatch({type:"TOAST",v:{kind:"success",msg:"Profile saved! Redirecting to dashboard..."}});
    setTimeout(()=>setPage("dashboard"),1200);
  };
  return<div style={{maxWidth:820,margin:"0 auto",padding:"32px 24px"}}>
    <div style={{display:"flex",alignItems:"center",gap:18,marginBottom:28,padding:"24px 28px",background:`linear-gradient(135deg,${PL},#f0fdf4)`,borderRadius:20,flexWrap:"wrap"}}>
      <div style={{position:"relative",flexShrink:0}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${P},${PD})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,border:`3px solid ${P}44`,overflow:"hidden"}}>
          {picUrl?<img src={picUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>{e.target.style.display="none";}}/>:avatar}
        </div>
        <div style={{position:"absolute",bottom:2,right:2,width:24,height:24,borderRadius:"50%",background:P,border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",cursor:"pointer"}} onClick={()=>setTab("profile")}>✏</div>
      </div>
      <div style={{flex:1,minWidth:180}}>
        <div style={{fontSize:20,fontWeight:700,color:DARK}}>{user.name}</div>
        <div style={{fontSize:13,color:G,marginTop:2}}>Vestigia Learner · {user.role==="admin"?"Admin 🔑":"Student"}</div>
        <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>{interests.slice(0,3).map(i=><Tag key={i} c={P} bg={PL} small>{i}</Tag>)}{interests.length===0&&<span style={{fontSize:11,color:P,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setTab("interests")}>Add interests →</span>}</div>
      </div>
      <div style={{textAlign:"center",minWidth:100}}>
        <div style={{fontSize:11,color:G,marginBottom:4}}>Profile complete</div>
        <div style={{fontSize:30,fontWeight:800,color:P}}>{completion}%</div>
        <div style={{width:80,marginTop:6}}><ProgressBar pct={completion} color={P}/></div>
      </div>
    </div>
    <div style={{display:"flex",gap:4,marginBottom:24,background:"#f8fafc",borderRadius:14,padding:6,flexWrap:"wrap"}}>
      {TABS.map(([k,icon,l])=><button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"10px 6px",borderRadius:10,border:"none",background:tab===k?"#fff":"transparent",color:tab===k?P:G,fontSize:12,fontWeight:tab===k?700:400,cursor:"pointer",boxShadow:tab===k?"0 1px 6px rgba(0,0,0,0.08)":"none",minWidth:60,transition:"all 0.2s"}}>{icon} {l}</button>)}
    </div>
    {tab==="profile"&&<div style={{display:"grid",gap:16}}>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:16}}>Profile Picture</div>
        <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{width:90,height:90,borderRadius:"50%",background:P+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,overflow:"hidden",flexShrink:0,border:`2px dashed ${P}44`}}>{picUrl?<img src={picUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>{e.target.style.display="none";}}/>:avatar}</div>
          <div style={{flex:1,minWidth:200}}><div style={{fontSize:13,color:G,marginBottom:10}}>Paste a public image URL (JPG/PNG)</div><input value={picUrl} onChange={e=>setPicUrl(e.target.value)} placeholder="https://your-photo.com/pic.jpg" style={{...IS2,marginBottom:6}}/><div style={{fontSize:11,color:G}}>Square image · min 200×200px recommended</div></div>
        </div>
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:4}}>Avatar</div>
        <div style={{fontSize:12,color:G,marginBottom:14}}>Shown when no profile picture is uploaded</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{["🧑‍💻","👩‍💻","🧑‍🎓","👩‍🎓","🦊","🚀","🧠","⚡","🎯","🏆","💡","🌟"].map(a=><button key={a} onClick={()=>setAvatar(a)} style={{width:50,height:50,fontSize:26,borderRadius:14,border:`2.5px solid ${avatar===a?P:"#e2e8f0"}`,background:avatar===a?PL:"#f8fafc",cursor:"pointer"}}>{a}</button>)}</div>
      </Card>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:4}}>Full Name</div>
        <div style={{fontSize:12,color:G,marginBottom:14}}>As per government record — used on certificates</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your full legal name" style={IS2}/>
      </Card>
    </div>}
    {tab==="contact"&&<div style={{display:"grid",gap:16}}>
      <Card style={{background:"#f8fafc"}}><div style={{fontSize:12,color:G,marginBottom:4}}>Currently registered mobile</div><div style={{fontSize:16,fontWeight:600,color:DARK}}>{user.mobile||"No mobile on file"}</div></Card>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:4}}>Update Mobile Number</div>
        <div style={{fontSize:12,color:G,marginBottom:20}}>Verified via OTP before saving</div>
        {!otpSent?<><div style={{fontSize:12,fontWeight:600,color:G,marginBottom:8}}>New mobile number</div><div style={{display:"flex",gap:8,marginBottom:16}}><select value={cc} onChange={e=>setCc(e.target.value)} style={{padding:"12px 10px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:DARK,fontSize:14,width:90,flexShrink:0}}>{CCS.map(c=><option key={c}>{c}</option>)}</select><input value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,""))} placeholder="Mobile number" maxLength={12} style={{...IS2,marginBottom:0}}/></div><Btn disabled={mobile.length<7} onClick={async()=>{await new Promise(r=>setTimeout(r,700));setOtpSent(true);dispatch({type:"TOAST",v:{kind:"info",msg:`OTP sent to ${cc} ${mobile}`}});}}>Send OTP</Btn></>:<>
        <div style={{padding:"10px 14px",borderRadius:10,background:TL,color:"#065f46",fontSize:13,marginBottom:18}}>OTP sent to <strong>{cc} {mobile}</strong></div>
        <div style={{display:"flex",gap:8,marginBottom:18}}>{otp.map((v,i)=><input key={i} ref={refs[i]} maxLength={1} value={v} onChange={e=>handleOtp(i,e.target.value)} style={{width:52,height:58,textAlign:"center",fontSize:22,fontWeight:700,borderRadius:12,border:`2px solid ${v?P:"#e2e8f0"}`,background:v?PL:"#f8fafc",color:DARK,outline:"none"}}/>)}</div>
        <div style={{display:"flex",gap:10}}><Btn onClick={()=>{dispatch({type:"SET_USER",v:{...user,mobile:cc+mobile}});dispatch({type:"TOAST",v:{kind:"success",msg:"Mobile updated!"}});setOtpSent(false);setOtp(["","","","",""]);setMobile("");}}>Verify & Save</Btn><Btn variant="outline" onClick={()=>{setOtpSent(false);setOtp(["","","","",""]);}} >Change</Btn></div></>}
      </Card>
    </div>}
    {tab==="interests"&&<Card>
      <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:4}}>Learning Interests</div>
      <div style={{fontSize:12,color:G,marginBottom:20}}>Select topics to personalise your recommendations</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:24}}>{INTERESTS.map(i=><button key={i} onClick={()=>toggleInterest(i)} style={{padding:"9px 16px",borderRadius:20,border:`1.5px solid ${interests.includes(i)?P:"#e2e8f0"}`,background:interests.includes(i)?PL:"transparent",color:interests.includes(i)?P:G,fontSize:13,cursor:"pointer",fontWeight:interests.includes(i)?600:400}}>{interests.includes(i)?"✓ ":""}{i}</button>)}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:12,color:G}}>{interests.length} selected</div></div>
    </Card>}
    {tab==="address"&&<Card>
      <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:4}}>Correspondence Address</div>
      <div style={{fontSize:12,color:G,marginBottom:20}}>For certificate delivery and refund correspondence</div>
      <div style={{display:"grid",gap:12}}>
        <div><div style={{fontSize:12,fontWeight:600,color:G,marginBottom:6}}>Address Line 1 *</div><input value={address.line1} onChange={e=>setAddress(a=>({...a,line1:e.target.value}))} placeholder="Flat / House No., Building, Street" style={IS2}/></div>
        <div><div style={{fontSize:12,fontWeight:600,color:G,marginBottom:6}}>Address Line 2</div><input value={address.line2} onChange={e=>setAddress(a=>({...a,line2:e.target.value}))} placeholder="Locality, Landmark (optional)" style={IS2}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><div><div style={{fontSize:12,fontWeight:600,color:G,marginBottom:6}}>City *</div><input value={address.city} onChange={e=>setAddress(a=>({...a,city:e.target.value}))} placeholder="City" style={IS2}/></div><div><div style={{fontSize:12,fontWeight:600,color:G,marginBottom:6}}>PIN Code *</div><input value={address.pin} onChange={e=>setAddress(a=>({...a,pin:e.target.value.replace(/\D/g,"").slice(0,6)}))} placeholder="6-digit PIN" maxLength={6} style={{...IS2,letterSpacing:2}}/></div></div>
        <div><div style={{fontSize:12,fontWeight:600,color:G,marginBottom:6}}>State / UT *</div><select value={address.state} onChange={e=>setAddress(a=>({...a,state:e.target.value}))} style={IS2}><option value="">Select State / UT</option>{STATES_IN.map(s=><option key={s}>{s}</option>)}</select></div>
      </div>
    </Card>}
    {tab==="kyc"&&<div style={{display:"grid",gap:16}}>
      <Card style={{background:`linear-gradient(135deg,${P}08,${PD}05)`,border:`1px solid ${P}22`}}><div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:8}}>🔐 KYC Verification</div><div style={{fontSize:13,color:G,lineHeight:1.7}}>Required for refunds above ₹5,000 as per RBI guidelines. Your documents are encrypted with AES-256 and never shared with third parties.</div></Card>
      <Card>
        <div style={{fontSize:14,fontWeight:700,color:DARK,marginBottom:16}}>Verify via DigiLocker</div>
        {[["🪪","Aadhaar Card","12-digit Aadhaar linked to your mobile"],["📋","PAN Card","For tax & refunds above ₹50,000"],["🎓","Voter ID / Passport","Alternative government ID"]].map(([icon,title,desc])=><div key={title} style={{display:"flex",gap:14,alignItems:"center",padding:"14px 16px",background:"#f8fafc",borderRadius:12,border:"1px solid #e2e8f0",marginBottom:10}}><span style={{fontSize:26,flexShrink:0}}>{icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{title}</div><div style={{fontSize:11,color:G}}>{desc}</div></div><button onClick={()=>dispatch({type:"TOAST",v:{kind:"info",msg:"DigiLocker integration coming soon."}})} style={{padding:"8px 16px",borderRadius:10,background:P,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>Verify</button></div>)}
        <div style={{padding:"12px 16px",borderRadius:10,background:"#f0fdf4",border:"1px solid #bbf7d0",fontSize:12,color:"#166534"}}>🔒 Data encrypted · Never shared · Compliant with DPDP Act 2023</div>
      </Card>
    </div>}
    <div style={{marginTop:24,display:"flex",gap:12,justifyContent:"flex-end",padding:"18px 0",borderTop:"0.5px solid #e2e8f0"}}>
      <Btn variant="outline" onClick={()=>setPage("dashboard")}>Skip for now</Btn>
      <Btn onClick={saveProfile}>Save & Go to Dashboard →</Btn>
    </div>
  </div>;
}

/* ─── CERTIFICATE MODAL ──────────────────────────────── */
function CertificateModal({enrollment,course,user,onClose}){
  const date=new Date(enrollment.enrolledAt).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
  return<div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(0,0,0,0.7)"}}>
    <div style={{background:"#fff",borderRadius:20,maxWidth:700,width:"100%",overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,0.3)"}}>
      <div style={{background:`linear-gradient(135deg,${DARK},#1a0a4a)`,padding:"40px 50px",textAlign:"center",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,opacity:0.08,backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",backgroundSize:"20px 20px"}}/>
        <img src="/logo.png" alt="V" style={{height:56,width:56,objectFit:"contain",borderRadius:14,marginBottom:12}} onError={e=>{e.target.style.display="none";}}/>
        <div style={{color:"#a78bfa",fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Vestigia Technologies OPC Pvt. Ltd.</div>
        <div style={{color:"#fff",fontSize:28,fontWeight:800,marginBottom:4}}>Certificate of Completion</div>
        <div style={{color:"#c4b5fd",fontSize:13}}>This is to certify that</div>
      </div>
      <div style={{padding:"36px 50px",textAlign:"center",background:"linear-gradient(180deg,#fdfcff,#fff)"}}>
        <div style={{fontSize:32,fontWeight:800,color:P,marginBottom:8,fontFamily:"Georgia,serif"}}>{user?.name||"Learner"}</div>
        <div style={{fontSize:14,color:G,marginBottom:6}}>has successfully completed</div>
        <div style={{fontSize:20,fontWeight:700,color:DARK,marginBottom:4,lineHeight:1.3}}>{course.title}</div>
        <div style={{fontSize:13,color:G,marginBottom:24}}>{course.weeks} weeks · {course.tag} · Issued on {date}</div>
        <div style={{display:"flex",justifyContent:"center",gap:60,marginBottom:28}}>
          <div style={{textAlign:"center"}}>
            <div style={{width:120,height:1,background:"#c4b5fd",margin:"0 auto 8px"}}/>
            <div style={{fontSize:13,fontWeight:700,color:DARK}}>Shobhit Shubham Saxena</div>
            <div style={{fontSize:11,color:G}}>Founder & CEO, Vestigia Technologies</div>
          </div>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <Btn onClick={()=>window.print?.()}>Download Certificate</Btn>
          <Btn variant="outline" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  </div>;
}

/* ─── NAV ─────────────────────────────────────────────── */
function Nav({page,setPage,setShowAuth}){
  const{state,dispatch}=useApp();
  const{user}=state;
  const[mob,setMob]=useState(false);
  const[aiDrop,setAiDrop]=useState(false);
  const dropRef=useRef();
  useEffect(()=>{const h=e=>{if(dropRef.current&&!dropRef.current.contains(e.target))setAiDrop(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(14px)",borderBottom:"0.5px solid #e2e8f0",padding:"0 24px"}}>
    <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:8,height:62}}>
      <button onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>
        <img src="/logo.png" alt="Vestigia" style={{height:38,width:38,objectFit:"contain",borderRadius:9}} onError={e=>{e.target.style.display="none";}}/>
        <div style={{lineHeight:1.2}}><div style={{fontSize:14,fontWeight:700,color:DARK}}>Vestigia</div><div style={{fontSize:10,color:G}}>Technologies</div></div>
      </button>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:2}} className="desk-nav">
        {[["about","About Us"],["courses","Courses"]].map(([p,l])=><button key={p} onClick={()=>setPage(p)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:page===p?PL:"transparent",color:page===p?P:G,fontSize:13,cursor:"pointer",fontWeight:page===p?600:400}}>{l}</button>)}
        <div ref={dropRef} style={{position:"relative"}}>
          <button onClick={()=>setAiDrop(o=>!o)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:aiDrop?PL:"transparent",color:aiDrop?P:G,fontSize:13,cursor:"pointer",fontWeight:400,display:"flex",alignItems:"center",gap:5}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={P} strokeWidth="1.8"/><circle cx="12" cy="12" r="4" fill={P}/><path d="M12 8c2.2 0 4 1.8 4 4H22M12 8c-2.2 0-4 1.8-4 4l-5.2 9M12 8V2" stroke={P} strokeWidth="1.8" strokeLinecap="round"/></svg>
            Free AI Extension <span style={{fontSize:10,marginLeft:2}}>{aiDrop?"▲":"▼"}</span>
          </button>
          {aiDrop&&<div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:"#fff",borderRadius:16,boxShadow:"0 12px 40px rgba(0,0,0,0.14)",border:"0.5px solid #e2e8f0",minWidth:280,zIndex:200,overflow:"hidden"}}>
            <div style={{padding:"12px 16px 8px",fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:0.5}}>Chrome Extensions</div>
            {AI_EXTENSIONS.map(ext=><a key={ext.id} href={ext.url} target="_blank" rel="noreferrer" style={{display:"flex",gap:12,padding:"10px 16px",textDecoration:"none",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontSize:22,flexShrink:0}}>{ext.icon}</span>
              <div><div style={{fontSize:13,fontWeight:600,color:DARK}}>{ext.name}</div><div style={{fontSize:11,color:G,marginTop:1}}>{ext.desc}</div></div>
            </a>)}
            <div style={{padding:"10px 16px",borderTop:"0.5px solid #e2e8f0",textAlign:"center"}}><a href="https://chromewebstore.google.com" target="_blank" rel="noreferrer" style={{fontSize:12,color:P,fontWeight:600,textDecoration:"none"}}>View all extensions →</a></div>
          </div>}
        </div>
        {user&&<><button onClick={()=>setPage("profile")} style={{padding:"7px 14px",borderRadius:8,border:"none",background:page==="profile"?PL:"transparent",color:page==="profile"?P:G,fontSize:13,cursor:"pointer",fontWeight:page==="profile"?600:400}}>Profile</button><button onClick={()=>setPage("dashboard")} style={{padding:"7px 14px",borderRadius:8,border:"none",background:page==="dashboard"?PL:"transparent",color:page==="dashboard"?P:G,fontSize:13,cursor:"pointer",fontWeight:page==="dashboard"?600:400}}>Dashboard</button></>}
        {requireRole(user,"admin")&&<button onClick={()=>setPage("admin")} style={{padding:"7px 12px",borderRadius:8,border:"none",background:page==="admin"?RL:"transparent",color:page==="admin"?R:G,fontSize:12,cursor:"pointer"}}>Admin</button>}
        <div style={{width:1,height:20,background:"#e2e8f0",flexShrink:0,margin:"0 4px"}}/>
        {user?<div style={{display:"flex",alignItems:"center",gap:8}}><Avatar initials={user.avatar||user.name?.[0]||"U"} size={32} color={P} src={user.picUrl||null}/><button onClick={()=>{dispatch({type:"LOGOUT"});dispatch({type:"TOAST",v:{kind:"info",msg:"Logged out."}});setPage("home");}} style={{fontSize:12,color:G,background:"none",border:"none",cursor:"pointer"}}>Logout</button></div>:<button onClick={()=>setShowAuth(true)} style={{padding:"9px 22px",borderRadius:10,background:P,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Start Free</button>}
      </div>
      <button onClick={()=>setMob(o=>!o)} className="ham" style={{display:"none",background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}>
        <div style={{width:22,height:2,background:DARK,marginBottom:5,borderRadius:2}}/><div style={{width:22,height:2,background:DARK,marginBottom:5,borderRadius:2}}/><div style={{width:22,height:2,background:DARK,borderRadius:2}}/>
      </button>
    </div>
    {mob&&<div style={{padding:"12px 24px 20px",borderTop:"0.5px solid #e2e8f0",display:"flex",flexDirection:"column",gap:4}}>
      {[["about","About Us"],["courses","Courses"]].map(([p,l])=><button key={p} onClick={()=>{setPage(p);setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>{l}</button>)}
      <button onClick={()=>{setAiDrop(o=>!o);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>Free AI Extension</button>
      {aiDrop&&AI_EXTENSIONS.map(e=><a key={e.id} href={e.url} target="_blank" rel="noreferrer" style={{padding:"8px 24px",fontSize:13,color:P,textDecoration:"none"}}>{e.icon} {e.name}</a>)}
      {user&&<><button onClick={()=>{setPage("profile");setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>Profile</button><button onClick={()=>{setPage("dashboard");setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>Dashboard</button></>}
      {requireRole(user,"admin")&&<button onClick={()=>{setPage("admin");setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:R,fontSize:14,cursor:"pointer",textAlign:"left"}}>Admin</button>}
      {user?<button onClick={()=>{dispatch({type:"LOGOUT"});setPage("home");setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>Logout</button>:<button onClick={()=>{setShowAuth(true);setMob(false);}} style={{padding:"10px",borderRadius:10,background:P,border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4}}>Start Free</button>}
    </div>}
    <style>{`.ham{display:none!important}@media(max-width:768px){.ham{display:block!important}.desk-nav{display:none!important}}`}</style>
  </nav>;
}

/* ─── COURSE CARD ────────────────────────────────────── */
function CourseCard({c,dashboard,setPage}){
  const{state,dispatch}=useApp();
  const{enrollments}=state;
  const status=batchStatus(c);
  const seatsUsed=enrollments.filter(e=>e.courseId===c.id).length;
  const maxSeats=c.maxSeats??null;
  const isFull=maxSeats!==null&&seatsUsed>=maxSeats;
  const seatsLeft=maxSeats!==null?Math.max(0,maxSeats-seatsUsed):null;
  const myE=enrollments.find(e=>e.userId===state.user?.id&&e.courseId===c.id);
  const click=()=>{if(setPage)setPage("course-"+c.id);else dispatch({type:"SET_PDP",v:c});};
  return<div onClick={click} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&click()} style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:16,padding:"18px 20px",cursor:"pointer",display:"flex",flexDirection:"column",transition:"transform 0.15s,box-shadow 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(91,61,245,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
    <div style={{height:90,borderRadius:12,background:`${c.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,marginBottom:14,position:"relative"}}>
      {c.img}
      {status==="live"&&<span style={{position:"absolute",top:8,right:8,background:R,color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99}}>🔴 LIVE</span>}
      {isFull&&<span style={{position:"absolute",bottom:8,right:8,background:DARK,color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99}}>Full</span>}
    </div>
    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}><Tag c={c.color} bg={c.color+"18"} small>{c.tag}</Tag>{c.free&&<Tag c={T} bg={TL} small>Free</Tag>}<StatusBadge status={status}/></div>
    <div style={{fontSize:14,fontWeight:600,marginBottom:4,lineHeight:1.4}}>{c.title}</div>
    <div style={{fontSize:12,color:G,marginBottom:10}}>{c.speaker} · {c.weeks} weeks</div>
    {dashboard&&myE&&<><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:G}}>Progress</span><span style={{fontSize:11,fontWeight:600,color:myE.progress>=100?T:c.color}}>{myE.progress}%{myE.progress>=100?" ✓":""}</span></div><ProgressBar pct={myE.progress} color={myE.progress>=100?T:c.color}/><div style={{height:8}}/></>}
    <div style={{flex:1}}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}><PriceDisplay c={c}/><div style={{fontSize:11,color:G}}><Star/>{c.rating}{seatsLeft!==null&&seatsLeft<=3&&!isFull&&<span style={{color:R,marginLeft:4}}>·{seatsLeft} left</span>}</div></div>
  </div>;
}

/* ─── COURSE DETAIL PAGE ─────────────────────────────── */
function CourseDetailPage({courseId,setPage,setShowAuth}){
  const{state,dispatch}=useApp();
  const c=state.courses.find(x=>x.id===courseId);
  const[activeTab,setActiveTab]=useState("overview");
  if(!c)return<div style={{textAlign:"center",padding:60}}><Btn onClick={()=>setPage("courses")}>← Back to Courses</Btn></div>;
  const{user,enrollments,waitlist}=state;
  const isEnrolled=enrollments.some(e=>e.userId===user?.id&&e.courseId===c.id);
  const myE=enrollments.find(e=>e.userId===user?.id&&e.courseId===c.id);
  const status=batchStatus(c);
  const seatsUsed=enrollments.filter(e=>e.courseId===c.id).length;
  const isFull=(c.maxSeats??null)!==null&&seatsUsed>=c.maxSeats;
  const wlQueue=waitlist.filter(w=>w.courseId===c.id);
  const handleEnroll=()=>{
    if(!user){setShowAuth(true);return;}
    if(c.free){dispatch({type:"ADD_ENROLLMENT",v:{id:Date.now(),userId:user.id,courseId:c.id,enrolledAt:new Date().toISOString(),progress:0,completed:false,paymentRef:null,chapters:{},assignments:{}}});dispatch({type:"TOAST",v:{kind:"success",msg:`Enrolled in "${c.title}"!`}});setPage("dashboard");}else{dispatch({type:"SET_PAYMENT",v:c});}
  };
  return<div style={{background:"#fff"}}>
    <div style={{background:`linear-gradient(135deg,${DARK},#1a0a4a)`,padding:"48px 24px 40px",color:"#fff"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <button onClick={()=>setPage("courses")} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#c4b5fd",cursor:"pointer",fontSize:13,padding:"6px 14px",borderRadius:8,marginBottom:20}}>← All Courses</button>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:40,alignItems:"start",flexWrap:"wrap"}}>
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}><Tag c={c.color} bg={c.color+"33"}>{c.tag}</Tag>{c.free&&<Tag c={T} bg={TL}>Free</Tag>}<StatusBadge status={status}/></div>
            <h1 style={{fontSize:32,fontWeight:800,margin:"0 0 16px",lineHeight:1.2}}>{c.title}</h1>
            <p style={{fontSize:16,color:"#94a3b8",lineHeight:1.7,margin:"0 0 20px",maxWidth:600}}>{c.desc}</p>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              {[["⏱",c.weeks+" weeks"],["📚",c.curriculum?.length+" chapters"],["👥",c.enrolled.toLocaleString()+" enrolled"],["⭐",c.rating+" rating"]].map(([icon,val])=><div key={val} style={{fontSize:14,color:"#94a3b8"}}>{icon} <strong style={{color:"#fff"}}>{val}</strong></div>)}
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:20,padding:"24px",minWidth:280,border:"1px solid rgba(255,255,255,0.1)"}}>
            <PriceDisplay c={c} large/>
            {c.offerPrice&&<div style={{fontSize:12,color:"#a78bfa",marginTop:6,marginBottom:16}}>🔥 Limited time offer</div>}
            <div style={{marginTop:c.offerPrice?0:16}}>
              {isEnrolled?<div><Tag c={T} bg={TL+"44"}>✓ Already enrolled</Tag><Btn onClick={()=>setPage("dashboard")} style={{marginTop:10,width:"100%",background:T,borderColor:T}}>Go to Dashboard →</Btn></div>:<div>
                <button onClick={handleEnroll} style={{width:"100%",padding:"14px",borderRadius:12,background:P,border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:10}}>{c.free?"Enroll Free →":"Buy Now →"}</button>
                {!c.free&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{["💳 Credit Card","🏦 Debit Card","⚡ UPI","📱 Net Banking"].map(m=><div key={m} style={{fontSize:11,color:"#94a3b8",textAlign:"center",padding:"6px",background:"rgba(255,255,255,0.05)",borderRadius:8}}>{m}</div>)}</div>}
              </div>}
            </div>
            {c.speaker&&<div style={{marginTop:16,paddingTop:16,borderTop:"0.5px solid rgba(255,255,255,0.1)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><Avatar initials={c.speaker[0]} size={40} color={P} src={c.speakerPic||null}/><div><div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{c.speaker}</div><div style={{fontSize:11,color:"#a78bfa"}}>{c.speakerRole}</div></div></div>
              {c.linkedin&&okUrl(c.linkedin)&&<a href={c.linkedin} target="_blank" rel="noreferrer" style={{display:"block",marginTop:10,padding:"8px",borderRadius:8,background:"#0A66C2",color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none",textAlign:"center"}}>Connect on LinkedIn</a>}
            </div>}
          </div>
        </div>
      </div>
    </div>
    <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
      <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:"0.5px solid #e2e8f0",marginBottom:28,width:"fit-content"}}>
        {[["overview","Overview"],["curriculum","Curriculum"],["instructor","Instructor"]].map(([k,l])=><button key={k} onClick={()=>setActiveTab(k)} style={{padding:"10px 24px",border:"none",background:activeTab===k?P:"#f8fafc",color:activeTab===k?"#fff":G,fontSize:13,fontWeight:activeTab===k?600:400,cursor:"pointer"}}>{l}</button>)}
      </div>
      {activeTab==="overview"&&<div>
        {c.highlights?.length>0&&<Card style={{marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:700,color:DARK,marginBottom:16}}>What you'll get</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>{c.highlights.map(h=><div key={h} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",background:"#f8fafc",borderRadius:10}}><span style={{color:T,fontWeight:700,flexShrink:0}}>✓</span><span style={{fontSize:13,color:"#475569"}}>{h}</span></div>)}</div>
        </Card>}
        <Card>
          <div style={{fontSize:16,fontWeight:700,color:DARK,marginBottom:12}}>About this course</div>
          <p style={{fontSize:14,color:"#475569",lineHeight:1.8,margin:0}}>{c.desc}</p>
        </Card>
      </div>}
      {activeTab==="curriculum"&&<Card>
        <div style={{fontSize:16,fontWeight:700,color:DARK,marginBottom:16}}>{c.curriculum?.length} Chapters</div>
        {c.curriculum?.map((ch,i)=>{
          const chDone=myE?.chapters?.[i];
          return<div key={ch.ch} style={{display:"flex",gap:14,padding:"14px 16px",borderRadius:12,marginBottom:8,background:chDone?"#f0fdf4":"#f8fafc",border:`1px solid ${chDone?T+"33":"#e2e8f0"}`}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:chDone?T:P,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{chDone?"✓":ch.ch}</div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{ch.title}</div><div style={{fontSize:12,color:G}}>⏱ {ch.duration}{ch.assignment&&<span style={{color:A,marginLeft:8}}>· 📝 Assignment</span>}</div></div>
            {isEnrolled&&<button onClick={()=>{if(!chDone){dispatch({type:"COMPLETE_CHAPTER",userId:user.id,courseId:c.id,chIdx:i});const total=c.curriculum.length;const done=Object.keys({...myE?.chapters||{},[i]:true}).length;dispatch({type:"UPDATE_PROGRESS",userId:user.id,courseId:c.id,pct:Math.round(done/total*100)});dispatch({type:"TOAST",v:{kind:"success",msg:`Chapter ${ch.ch} completed!`}});}}} style={{padding:"6px 14px",borderRadius:8,background:chDone?TL:P,border:"none",color:chDone?T:"#fff",fontSize:12,fontWeight:600,cursor:chDone?"default":"pointer",flexShrink:0}}>{chDone?"Done ✓":"Start"}</button>}
          </div>;
        })}
      </Card>}
      {activeTab==="instructor"&&<Card>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <Avatar initials={c.speaker?.[0]||"S"} size={80} color={P} src={c.speakerPic||null}/>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>{c.speaker}</div>
            <div style={{fontSize:13,color:G,marginBottom:12}}>{c.speakerRole}</div>
            <p style={{fontSize:14,color:"#475569",lineHeight:1.7,margin:"0 0 16px"}}>Shobhit Shubham Saxena is the Founder & CEO of Vestigia Technologies OPC Pvt. Ltd. With over a decade of experience in AI, Product Management and EdTech, he has trained 12,000+ professionals across India.</p>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {[["12,000+","Students trained"],["4.9★","Average rating"],["10+","Years experience"]].map(([v,l])=><div key={l} style={{textAlign:"center",padding:"12px 16px",background:"#f8fafc",borderRadius:10}}><div style={{fontSize:18,fontWeight:700,color:P}}>{v}</div><div style={{fontSize:11,color:G,marginTop:2}}>{l}</div></div>)}
            </div>
            {c.linkedin&&okUrl(c.linkedin)&&<a href={c.linkedin} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:16,padding:"10px 20px",borderRadius:10,background:"#0A66C2",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>LinkedIn Profile</a>}
          </div>
        </div>
      </Card>}
    </div>
  </div>;
}

/* ─── HOME PAGE ──────────────────────────────────────── */
function HomePage({setPage,setShowAuth}){
  const{state}=useApp();
  const{courses}=state;
  const featured=courses.filter(c=>c.status!=="draft").slice(0,3);
  const live=courses.filter(c=>batchStatus(c)==="live");
  const totalEnrolled=courses.reduce((s,c)=>s+c.enrolled,0);
  return<div>
    {/* Hero */}
    <section style={{background:DARK,padding:"100px 24px 88px",color:"#fff",textAlign:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(ellipse at 20% 50%,rgba(91,61,245,0.3) 0%,transparent 60%),radial-gradient(ellipse at 80% 50%,rgba(69,39,217,0.2) 0%,transparent 60%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:740,margin:"0 auto",position:"relative"}}>
        {live.length>0?<div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(220,38,38,0.15)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:99,padding:"5px 18px",fontSize:12,color:"#fca5a5",marginBottom:28,fontWeight:600}}>🔴 Live now: {live[0].title}</div>:<div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(91,61,245,0.2)",border:"1px solid rgba(139,92,246,0.4)",borderRadius:99,padding:"6px 18px",fontSize:12,color:"#a78bfa",marginBottom:28,fontWeight:600}}>{courses.length} cohorts · {courses.filter(c=>c.free).length} free · AI-first</div>}
        <h1 style={{fontSize:54,fontWeight:800,lineHeight:1.1,margin:"0 0 22px",letterSpacing:"-0.03em",color:"#F8FAFC"}}>Bridge the gap between talent and<br/><span style={{background:"linear-gradient(135deg,#818CF8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>AI-driven opportunities.</span></h1>
        <p style={{fontSize:18,color:"#94A3B8",lineHeight:1.75,margin:"0 auto 40px",maxWidth:540}}>Learn AI, Product, and System Design with real mentorship — built for Tier-2 and Tier-3 India.</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:56}}>
          <button onClick={()=>setShowAuth(true)} style={{padding:"15px 32px",borderRadius:14,background:P,border:"none",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>Start Free Course</button>
          <button onClick={()=>setPage("courses")} style={{padding:"15px 32px",borderRadius:14,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:"#E2E8F0",fontSize:16,fontWeight:500,cursor:"pointer"}}>Explore Cohorts</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:48,flexWrap:"wrap"}}>
          {[[totalEnrolled.toLocaleString()+"+","learners enrolled"],[courses.length+"+","live cohorts"],["4.9★","average rating"],["₹0","to get started"]].map(([v,l])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:"#A78BFA"}}>{v}</div><div style={{fontSize:12,color:"#64748B",marginTop:3}}>{l}</div></div>)}
        </div>
      </div>
    </section>

    {/* Ratan Tata Tribute Quote */}
    <section style={{background:"linear-gradient(135deg,#0f172a,#1e1a2e)",padding:"64px 24px"}}>
      <div style={{maxWidth:900,margin:"0 auto",display:"flex",gap:40,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
        <div style={{width:120,height:120,borderRadius:"50%",background:"linear-gradient(135deg,#334155,#475569)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:56,flexShrink:0,border:"3px solid rgba(167,139,250,0.3)"}}>🕊️</div>
        <div style={{flex:1,minWidth:260}}>
          <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>A Tribute — Ratan Naval Tata (1937–2024)</div>
          <blockquote style={{fontSize:22,fontWeight:600,color:"#e2e8f0",lineHeight:1.55,margin:"0 0 16px",fontStyle:"italic"}}>
            "The future belongs to those who prepare for it today — and AI is a big part of that preparation."
          </blockquote>
          <div style={{fontSize:13,color:"#64748b"}}>Industrialist · Philanthropist · Visionary Leader</div>
        </div>
      </div>
    </section>

    {/* Featured Courses */}
    <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px"}}>
      <section style={{padding:"64px 0 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
          <div><div style={{fontSize:26,fontWeight:700}}>Featured Batches</div><div style={{fontSize:14,color:G,marginTop:4}}>Live cohorts with Shobhit — learn by doing</div></div>
          <Btn variant="outline" small onClick={()=>setPage("courses")}>View all {courses.length}</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>{featured.map(c=><CourseCard key={c.id} c={c} setPage={setPage}/>)}</div>
      </section>

      {/* Founder Quote */}
      <section style={{background:`linear-gradient(135deg,${PL},#f0fdf4)`,borderRadius:24,padding:"44px 40px",marginBottom:56,display:"flex",gap:36,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{width:84,height:84,borderRadius:22,background:`linear-gradient(135deg,${P},${PD})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:32,fontWeight:700,flexShrink:0}}>S</div>
        <div style={{flex:1,minWidth:220}}>
          <div style={{fontSize:11,fontWeight:700,color:P,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>From the Founder</div>
          <blockquote style={{fontSize:19,fontWeight:500,margin:"0 0 10px",lineHeight:1.5}}>"I built Vestigia because I know what it takes to grow from a tier-2 city. Now I'm sharing everything."</blockquote>
          <div style={{fontSize:13,color:G}}>Shobhit Shubham Saxena · Founder & CEO, Vestigia Technologies · Founded 2014</div>
        </div>
        <Btn variant="outline" onClick={()=>setPage("about")}>Read Our Story</Btn>
      </section>

      {/* Testimonials */}
      <section style={{paddingBottom:64}}>
        <div style={{fontSize:26,fontWeight:700,marginBottom:8,textAlign:"center"}}>What our learners say</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16,marginTop:24}}>
          {TESTIMONIALS.map(t=><Card key={t.name}><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}><Avatar initials={t.av} size={40} color={P}/><div><div style={{fontSize:14,fontWeight:600}}>{t.name}</div><div style={{fontSize:12,color:G}}>{t.role}</div></div></div><div style={{fontSize:14,color:"#475569",lineHeight:1.7}}>"{t.text}"</div><div style={{marginTop:10}}>{[1,2,3,4,5].map(i=><Star key={i}/>)}</div></Card>)}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{background:`linear-gradient(135deg,${P},${PD})`,borderRadius:24,padding:"52px 40px",textAlign:"center",marginBottom:64,color:"#fff"}}>
        <div style={{fontSize:30,fontWeight:800,marginBottom:10}}>Ready to stay ahead?</div>
        <div style={{fontSize:15,color:"#c4b5fd",marginBottom:32}}>Join {totalEnrolled.toLocaleString()}+ professionals learning AI, Product & TPM</div>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={()=>setPage("courses")} style={{background:"#fff",color:P,border:"none"}}>Browse Courses</Btn>
          <Btn onClick={()=>setShowAuth(true)} style={{border:"1.5px solid rgba(255,255,255,0.4)",color:"#fff",background:"transparent"}}>Join Free</Btn>
        </div>
      </section>
    </div>
  </div>;
}

/* ─── ABOUT PAGE ─────────────────────────────────────── */
function AboutPage({setPage,setShowAuth}){
  const journey=[
    {year:"2014",icon:"🚀",title:"The Beginning",items:["Founded Vestigia Technologies","Delivered software & web solutions for Tier-2 & Tier-3 cities","Built the foundation of digital empowerment"]},
    {year:"2018",icon:"📈",title:"The Growth Phase",items:["Scaled to 50+ clients","Partnered with SMBs, startups & consulting firms","Strengthened delivery, trust & market presence"]},
    {year:"2024",icon:"🤖",title:"The Rebirth (Vestigia 2.0)",items:["Transitioned into an AI-first company","Launched AI-powered LMS + Personal Branding Platform","Shifted from services to scalable intelligent products"]},
    {year:"2025",icon:"🌍",title:"The Impact Era",items:["Empowered 10,000+ learners","Emerging as India's leading founder-led EdTech platform","Building a nationwide ecosystem for AI-driven careers"]},
  ];
  return<div>
    {/* Hero */}
    <section style={{background:`linear-gradient(135deg,${DARK},#1a0a4a)`,padding:"72px 24px 60px",textAlign:"center",color:"#fff"}}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <img src="/logo.png" alt="Vestigia" style={{height:80,width:80,objectFit:"contain",borderRadius:20,marginBottom:24,display:"block",margin:"0 auto 24px"}} onError={e=>{e.target.style.display="none";}}/>
        <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>🚀 Vestigia Technologies OPC Pvt. Ltd.</div>
        <h1 style={{fontSize:36,fontWeight:800,margin:"0 0 10px",background:"linear-gradient(135deg,#fff,#c4b5fd)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Vestigia Technologies 2.0</h1>
        <div style={{fontSize:18,color:"#a78bfa",fontStyle:"italic",marginBottom:24}}>The Rebirth of Intelligence</div>
        <p style={{fontSize:16,color:"#94a3b8",lineHeight:1.8,margin:"0 0 32px"}}>Talent is everywhere. Opportunity is not.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>{["AI Solutions","EdTech","Product","TPM","Systems Design","Personal Branding"].map(t=><Tag key={t} c="#c4b5fd" bg="rgba(196,181,253,0.1)">{t}</Tag>)}</div>
      </div>
    </section>

    <div style={{maxWidth:860,margin:"0 auto",padding:"48px 24px"}}>
      {/* Story */}
      <Card style={{marginBottom:28}}>
        <div style={{fontSize:12,fontWeight:700,color:P,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Our Story</div>
        <p style={{fontSize:15,lineHeight:1.9,color:"#475569",margin:"0 0 14px"}}>Vestigia Technologies wasn't just founded — it was <strong>ignited in 2014 by Shobhit Shubham Saxena</strong>, with a bold belief: <em>Talent is everywhere. Opportunity is not.</em></p>
        <p style={{fontSize:15,lineHeight:1.9,color:"#475569",margin:"0 0 14px"}}>What began as a mission to digitally empower Tier-2 and Tier-3 cities has now transformed into something far greater. Welcome to <strong>Vestigia Technologies 2.0</strong> — a rebirth powered by Artificial Intelligence, driven by purpose, and engineered for the future of human potential.</p>
        <p style={{fontSize:15,lineHeight:1.9,color:"#475569",margin:0}}>We are no longer just building software. We are engineering intelligence ecosystems. From AI-powered platforms to next-generation EdTech solutions and job-ready learning experiences, Vestigia is redefining how individuals learn, build, and grow in an AI-first world.</p>
      </Card>

      {/* What We Do */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:20,fontWeight:700,marginBottom:20}}>🌍 What We Do</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
          {[["✨","AI-First Products","Build AI-first products that solve real-world problems"],["🎓","Job-Ready Ecosystems","Create learning ecosystems for the next-gen workforce"],["🧠","Future-Proof Skills","Empower individuals with future-proof skills & personal branding"],["🚀","Bridge the Gap","Bridge the gap between talent and opportunity"]].map(([icon,title,desc])=><Card key={title}><div style={{fontSize:28,marginBottom:10}}>{icon}</div><div style={{fontSize:14,fontWeight:700,marginBottom:6}}>{title}</div><div style={{fontSize:13,color:G,lineHeight:1.6}}>{desc}</div></Card>)}
        </div>
      </div>

      {/* Journey */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:20,fontWeight:700,marginBottom:24}}>🔥 Our Journey</div>
        {journey.map((j,i)=><div key={j.year} style={{display:"flex",gap:20,marginBottom:24}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${P},${PD})`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{j.year}</div>
            {i<journey.length-1&&<div style={{width:2,flex:1,background:`linear-gradient(to bottom,${P}44,transparent)`,margin:"4px 0"}}/>}
          </div>
          <div style={{paddingTop:4,paddingBottom:20,flex:1}}>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{j.icon} {j.title}</div>
            {j.items.map(item=><div key={item} style={{fontSize:13,color:"#475569",marginBottom:4,paddingLeft:12,borderLeft:`2px solid ${P}33`}}>→ {item}</div>)}
          </div>
        </div>)}
      </div>

      {/* Vision & Philosophy */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:32}}>
        <Card style={{background:`linear-gradient(135deg,${P}08,${PD}05)`}}>
          <div style={{fontSize:13,fontWeight:700,color:P,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>💡 Our Vision</div>
          <p style={{fontSize:14,lineHeight:1.8,color:DARK,margin:0}}>To build a world where anyone, from anywhere, can leverage AI, technology, and guidance to create extraordinary outcomes.</p>
        </Card>
        <Card style={{background:`linear-gradient(135deg,${T}08,${T}05)`}}>
          <div style={{fontSize:13,fontWeight:700,color:T,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>⚡ Our Philosophy</div>
          <p style={{fontSize:14,lineHeight:1.8,color:DARK,margin:0,fontStyle:"italic"}}>"We don't just teach skills. We build thinkers, creators, and leaders for the AI era."</p>
        </Card>
      </div>

      {/* CTA */}
      <div style={{textAlign:"center",padding:"40px",background:`linear-gradient(135deg,${P},${PD})`,borderRadius:20,color:"#fff"}}>
        <div style={{fontSize:22,fontWeight:800,marginBottom:8}}>This is not an upgrade. This is a transformation.</div>
        <div style={{fontSize:14,opacity:0.85,marginBottom:6}}>Stay ahead. Stay intelligent. Stay Vestigia.</div>
        <div style={{fontSize:13,opacity:0.7,marginBottom:28}}>Where ideas become intelligent systems. Where learning becomes future-proof.</div>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setPage("courses")} style={{padding:"12px 28px",borderRadius:12,background:"#fff",border:"none",color:P,fontSize:14,fontWeight:700,cursor:"pointer"}}>Explore Courses</button>
          <button onClick={()=>setShowAuth(true)} style={{padding:"12px 28px",borderRadius:12,background:"transparent",border:"1.5px solid rgba(255,255,255,0.5)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>Join Free</button>
        </div>
      </div>
    </div>
  </div>;
}

/* ─── COURSES PAGE ───────────────────────────────────── */
function CoursesPage({setPage}){
  const{state}=useApp();
  const[filter,setFilter]=useState("All");
  const[search,setSearch]=useState("");
  const{courses}=state;
  const allTags=["All","Free",...[...new Set(courses.map(c=>c.tag))]];
  const shown=courses.filter(c=>{
    const mf=filter==="All"||(filter==="Free"&&c.free)||c.tag===filter;
    const ms=!search||c.title.toLowerCase().includes(search.toLowerCase())||c.tag.toLowerCase().includes(search.toLowerCase())||(c.speaker||"").toLowerCase().includes(search.toLowerCase());
    return mf&&ms&&c.status!=="draft";
  });
  return<div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{marginBottom:28}}><h1 style={{fontSize:28,fontWeight:700,marginBottom:4}}>Course Marketplace</h1><div style={{fontSize:14,color:G}}>{courses.length} batches · {courses.filter(c=>c.free).length} free · {courses.filter(c=>batchStatus(c)==="live").length} live now</div></div>
    <div style={{position:"relative",marginBottom:16}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses, skills, instructor..." style={{width:"100%",padding:"13px 16px 13px 44px",borderRadius:12,border:"1.5px solid #e2e8f0",fontSize:14,background:"#f8fafc",boxSizing:"border-box"}}/>
      <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:16,color:G}}>⌕</span>
      {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:G,fontSize:18}}>×</button>}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap"}}>{allTags.map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"8px 20px",borderRadius:20,border:`1.5px solid ${filter===f?P:"#e2e8f0"}`,background:filter===f?PL:"transparent",color:filter===f?P:G,fontSize:13,cursor:"pointer",fontWeight:filter===f?600:400}}>{f}</button>)}</div>
    {shown.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:G}}><div style={{fontSize:40,marginBottom:12}}>⌕</div><div style={{fontSize:16,fontWeight:600}}>No courses found</div><button onClick={()=>{setSearch("");setFilter("All");}} style={{color:P,background:"none",border:"none",cursor:"pointer",fontSize:13,marginTop:8}}>Clear filters</button></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>{shown.map(c=><CourseCard key={c.id} c={c} setPage={setPage}/>)}</div>
  </div>;
}

/* ─── DASHBOARD ──────────────────────────────────────── */
function Dashboard({setPage}){
  const{state,dispatch}=useApp();
  const{user,courses,enrollments,waitlist}=state;
  const[tab,setTab]=useState("study");
  const[certModal,setCertModal]=useState(null);
  const[aiOpen,setAiOpen]=useState(false);
  const[aiMsg,setAiMsg]=useState("");
  const[aiChat,setAiChat]=useState([{role:"ai",msg:"Hi! I'm your Vestigia AI. Ask about courses, career paths, or what to study next."}]);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiRem,setAiRem]=useState(AI_DAILY);
  const chatEndRef=useRef();
  const myE=enrollments.filter(e=>e.userId===user?.id);
  const enrolledCourses=courses.filter(c=>myE.some(e=>e.courseId===c.id));
  const freeCourses=courses.filter(c=>c.free&&!myE.some(e=>e.courseId===c.id));
  const paidCourses=courses.filter(c=>!c.free&&!myE.some(e=>e.courseId===c.id));
  const completedEnrollments=myE.filter(e=>e.completed);
  const recs=getRecs(state);
  const liveNow=courses.filter(c=>batchStatus(c)==="live");
  const myWaitlist=waitlist.filter(w=>w.userId===user?.id);
  const inProgress=enrolledCourses.filter(c=>{const e=myE.find(x=>x.courseId===c.id);return e&&e.progress<100&&e.progress>0;})[0];
  const sendAI=async()=>{
    if(!aiMsg.trim()||aiLoading)return;
    const q=san(aiMsg);setAiMsg("");
    const{ok,rem}=await checkAiLimit(user.id);
    if(!ok){dispatch({type:"TOAST",v:{kind:"error",msg:`Daily AI limit reached.`}});return;}
    setAiRem(rem);
    setAiChat(p=>[...p.slice(-49),{role:"user",msg:q}]);
    setAiLoading(true);
    const sys=`You are Vestigia AI. Student: ${user.name}. Enrolled: ${enrolledCourses.map(c=>c.title).join(", ")||"none"}. Give concise personalised advice (2-3 sentences max).`;
    const reply=await aiProxy(aiChat.filter(m=>m.role==="user").slice(-3).map(m=>({role:"user",content:m.msg})),sys);
    setAiChat(p=>[...p.slice(-49),{role:"ai",msg:reply}]);
    setAiLoading(false);
    setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
  };
  const enrollFree=(c)=>{dispatch({type:"ADD_ENROLLMENT",v:{id:Date.now(),userId:user.id,courseId:c.id,enrolledAt:new Date().toISOString(),progress:0,completed:false,paymentRef:null,chapters:{},assignments:{}}});dispatch({type:"TOAST",v:{kind:"success",msg:`Enrolled in "${c.title}"!`}});};
  return<div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
    {certModal&&<CertificateModal enrollment={certModal.e} course={certModal.c} user={user} onClose={()=>setCertModal(null)}/>}
    {/* Welcome Bar */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <Avatar initials={user?.avatar||user?.name?.[0]||"U"} size={48} color={P} src={user?.picUrl||null}/>
        <div><h1 style={{fontSize:22,fontWeight:700,margin:0}}>Welcome back, {user?.name?.split(" ")[0]} 👋</h1><div style={{fontSize:13,color:G}}>Keep your momentum going!</div></div>
      </div>
      <Btn small variant="outline" onClick={()=>setPage("profile")}>Edit Profile</Btn>
    </div>

    {/* Stats */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
      {[["📚","Enrolled",myE.length,T],["🔥","Streak","7 days",A],["🏆","Certificates",completedEnrollments.length,P],["⏱","Study Hours","24h",B]].map(([ic,l,v,c])=><div key={l} style={{background:"#f8fafc",borderRadius:14,padding:"16px 18px",borderLeft:`3px solid ${c}`}}><div style={{fontSize:20,marginBottom:4}}>{ic}</div><div style={{fontSize:11,color:G,marginBottom:2}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div></div>)}
    </div>

    {/* Live alert */}
    {liveNow.length>0&&<div style={{background:`linear-gradient(135deg,${R}11,${R}08)`,border:`1.5px solid ${R}33`,borderRadius:14,padding:"14px 18px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:8,height:8,borderRadius:"50%",background:R,display:"inline-block"}}/><div><div style={{fontSize:14,fontWeight:600}}>{liveNow[0].title}</div><div style={{fontSize:12,color:G}}>Live now · {liveNow[0].speaker}</div></div></div>
      <Btn small onClick={()=>setPage("live")} style={{background:R,borderColor:R,color:"#fff"}}>Join Live</Btn>
    </div>}

    {/* In-progress */}
    {inProgress&&<Card style={{marginBottom:20,border:`1px solid ${P}22`}}>
      <div style={{fontSize:12,fontWeight:700,color:P,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Continue Learning</div>
      <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{fontSize:28}}>{inProgress.img}</div>
        <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>{inProgress.title}</div><ProgressBar pct={myE.find(e=>e.courseId===inProgress.id)?.progress||0} color={inProgress.color}/><div style={{fontSize:11,color:G,marginTop:4}}>{myE.find(e=>e.courseId===inProgress.id)?.progress||0}% complete</div></div>
        <Btn small onClick={()=>setPage("course-"+inProgress.id)}>Resume →</Btn>
      </div>
    </Card>}

    {/* Main Tabs */}
    <div style={{display:"flex",gap:4,background:"#f8fafc",borderRadius:14,padding:6,marginBottom:24}}>
      {[["study","📚 My Study"],["marketplace","🛒 Marketplace"],["certs","🏆 Certificates"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"11px 8px",borderRadius:10,border:"none",background:tab===k?"#fff":"transparent",color:tab===k?P:G,fontSize:13,fontWeight:tab===k?700:400,cursor:"pointer",boxShadow:tab===k?"0 1px 6px rgba(0,0,0,0.08)":"none",transition:"all 0.2s"}}>{l}</button>)}
    </div>

    {tab==="study"&&<div>
      {/* 5 Free Courses to Start */}
      {freeCourses.length>0&&<div style={{marginBottom:28}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>🎁 5 Free Courses — Start Today</div>
        <div style={{fontSize:13,color:G,marginBottom:16}}>No credit card needed. Enroll and start learning immediately.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
          {freeCourses.slice(0,5).map(c=><div key={c.id} style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:14,padding:"16px 18px",display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
              <div style={{width:48,height:48,borderRadius:12,background:c.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{c.img}</div>
              <div><div style={{fontSize:14,fontWeight:600,lineHeight:1.3,marginBottom:3}}>{c.title}</div><div style={{fontSize:12,color:G}}>{c.weeks} weeks · {c.curriculum?.length} chapters</div></div>
            </div>
            <div style={{flex:1}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>enrollFree(c)} style={{flex:1,padding:"9px",borderRadius:10,background:T,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Enroll Free →</button>
              <button onClick={()=>setPage("course-"+c.id)} style={{padding:"9px 12px",borderRadius:10,background:"#f8fafc",border:"1px solid #e2e8f0",color:G,fontSize:13,cursor:"pointer"}}>View</button>
            </div>
          </div>)}
        </div>
      </div>}
      {/* My Courses */}
      {enrolledCourses.length>0&&<div style={{marginBottom:24}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:16}}>My Courses</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {enrolledCourses.map(c=>{
            const e=myE.find(x=>x.courseId===c.id);
            const charsLen=c.curriculum?.length||0;
            const doneChs=Object.keys(e?.chapters||{}).length;
            return<div key={c.id} style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:16,padding:"18px 20px"}}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
                <div style={{width:48,height:48,borderRadius:12,background:c.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{c.img}</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,lineHeight:1.3,marginBottom:3}}>{c.title}</div><div style={{fontSize:12,color:G}}>{doneChs}/{charsLen} chapters</div></div>
              </div>
              <ProgressBar pct={e?.progress||0} color={e?.progress>=100?T:c.color}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6,marginBottom:12}}>
                <span style={{fontSize:11,color:G}}>{e?.progress||0}% complete</span>
                {e?.progress>=100&&<span style={{fontSize:11,color:T,fontWeight:600}}>✓ Completed</span>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setPage("course-"+c.id)} style={{flex:1,padding:"8px",borderRadius:10,background:P,border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>{e?.progress>=100?"Review":"Continue →"}</button>
                {e?.progress>=100&&<button onClick={()=>setCertModal({e,c})} style={{padding:"8px 12px",borderRadius:10,background:TL,border:"none",color:T,fontSize:12,fontWeight:600,cursor:"pointer"}}>🏆 Cert</button>}
              </div>
            </div>;
          })}
          <div onClick={()=>setPage("courses")} role="button" tabIndex={0} style={{background:PL+"44",border:`1.5px dashed ${P}44`,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:180,cursor:"pointer"}}>
            <div style={{fontSize:28,marginBottom:8}}>+</div>
            <div style={{fontSize:13,color:P,fontWeight:600}}>Browse more courses</div>
          </div>
        </div>
      </div>}
      {enrolledCourses.length===0&&freeCourses.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#f8fafc",borderRadius:16}}>
        <div style={{fontSize:40,marginBottom:12}}>📚</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:8}}>You've enrolled in all free courses!</div>
        <div style={{fontSize:13,color:G,marginBottom:16}}>Check the Marketplace tab for premium courses.</div>
        <Btn onClick={()=>setTab("marketplace")}>Browse Marketplace →</Btn>
      </div>}
    </div>}

    {tab==="marketplace"&&<div>
      <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Premium Courses</div>
      <div style={{fontSize:13,color:G,marginBottom:20}}>Invest in your skills — enroll in a paid course and unlock it in My Study</div>
      {paidCourses.length===0?<div style={{textAlign:"center",padding:40,color:G}}>You're enrolled in all available courses! 🎉</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
        {paidCourses.map(c=><CourseCard key={c.id} c={c} setPage={setPage}/>)}
      </div>}
    </div>}

    {tab==="certs"&&<div>
      <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>My Certificates</div>
      <div style={{fontSize:13,color:G,marginBottom:20}}>Issued by Vestigia Technologies OPC Pvt. Ltd. · Signed by Shobhit Shubham Saxena</div>
      {completedEnrollments.length===0?<div style={{textAlign:"center",padding:"60px 20px",background:"#f8fafc",borderRadius:16}}>
        <div style={{fontSize:40,marginBottom:12}}>🏆</div>
        <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>No certificates yet</div>
        <div style={{fontSize:13,color:G,marginBottom:16}}>Complete a course to earn your certificate.</div>
        <Btn onClick={()=>setTab("study")}>Start Learning →</Btn>
      </div>:<div style={{display:"grid",gap:14}}>
        {completedEnrollments.map(e=>{
          const c=courses.find(x=>x.id===e.courseId);
          if(!c)return null;
          return<div key={e.id} style={{display:"flex",gap:16,alignItems:"center",padding:"20px 22px",background:"linear-gradient(135deg,#fffbeb,#f0fdf4)",border:"1px solid #d1fae5",borderRadius:16,flexWrap:"wrap"}}>
            <div style={{width:60,height:60,borderRadius:14,background:`${c.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{c.img}</div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:16,fontWeight:700,marginBottom:3}}>{c.title}</div>
              <div style={{fontSize:12,color:G}}>Completed · Issued by Vestigia Technologies OPC Pvt. Ltd.</div>
              <div style={{fontSize:11,color:G,marginTop:2}}>Signed by Shobhit Shubham Saxena, Founder & CEO</div>
            </div>
            <Btn small onClick={()=>setCertModal({e,c})}>🏆 View Certificate</Btn>
          </div>;
        })}
      </div>}
    </div>}

    {/* AI FAB */}
    <div style={{position:"fixed",bottom:24,right:24,zIndex:50}}>
      {aiOpen&&<div style={{position:"absolute",bottom:64,right:0,width:320,background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:18,overflow:"hidden",boxShadow:"0 12px 40px rgba(0,0,0,0.12)"}}>
        <div style={{background:`linear-gradient(135deg,${P},${PD})`,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:"#fff",fontSize:14,fontWeight:600}}>Vestigia AI</div><div style={{color:"#c4b5fd",fontSize:10}}>{aiRem} messages left today</div></div>
          <button onClick={()=>setAiOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:18}}>×</button>
        </div>
        <div style={{height:240,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
          {aiChat.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"82%",padding:"9px 13px",borderRadius:12,background:m.role==="user"?P:PL,color:m.role==="user"?"#fff":P,fontSize:13,lineHeight:1.5}}>{m.msg}</div></div>)}
          {aiLoading&&<div style={{display:"flex"}}><div style={{background:PL,borderRadius:12,padding:"9px 13px",color:P,fontSize:13}}>Thinking...</div></div>}
          <div ref={chatEndRef}/>
        </div>
        <div style={{padding:"10px 12px",borderTop:"0.5px solid #e2e8f0",display:"flex",gap:8}}>
          <input value={aiMsg} onChange={e=>setAiMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAI()} placeholder="Ask anything..." style={{flex:1,padding:"8px 12px",borderRadius:8,border:"0.5px solid #e2e8f0",fontSize:13,background:"#f8fafc"}}/>
          <button onClick={sendAI} disabled={aiLoading||aiRem<=0} style={{width:34,height:34,borderRadius:8,background:P,border:"none",color:"#fff",cursor:"pointer",fontSize:16,opacity:aiLoading?.6:1}}>↑</button>
        </div>
      </div>}
      <button onClick={()=>setAiOpen(o=>!o)} style={{width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${P},${PD})`,border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 6px 20px rgba(91,61,245,0.4)"}}>AI</button>
    </div>
  </div>;
}

/* ─── LIVE CLASS ──────────────────────────────────────── */
function LiveClass({setPage}){
  const{dispatch}=useApp();
  const[chat,setChat]=useState(INIT_CHAT);
  const[msg,setMsg]=useState("");
  const[pollVote,setPollVote]=useState(null);
  const[tab,setTab]=useState("chat");
  const[started,setStarted]=useState(false);
  const pollOpts=[{l:"RICE",v:52},{l:"MoSCoW",v:28},{l:"Kano Model",v:20}];
  const chatRef=useRef();
  const send=()=>{if(!msg.trim())return;setChat(c=>[...c,{user:"You",msg,time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),av:"ME",isMe:true}]);setMsg("");setTimeout(()=>chatRef.current?.scrollTo(0,chatRef.current.scrollHeight),50);};
  return<div style={{maxWidth:1100,margin:"0 auto",padding:"20px 24px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:started?R:A,display:"inline-block"}}/><span style={{fontSize:11,color:started?R:A,fontWeight:600}}>{started?"LIVE":"STARTING SOON"}</span><span style={{fontSize:14,fontWeight:600,marginLeft:4}}>AI PM Masterclass — Module 4: Metrics & OKRs</span></div><div style={{fontSize:12,color:G,marginTop:2}}>Shobhit Saxena · 347 watching</div></div>
      <Btn variant="outline" small onClick={()=>setPage("dashboard")}>← Dashboard</Btn>
    </div>
    {!started&&<div style={{background:"#f8fafc",borderRadius:16,padding:"48px 24px",textAlign:"center",marginBottom:16}}>
      <div style={{fontSize:40,marginBottom:12}}>⏱</div>
      <div style={{fontSize:20,fontWeight:600,marginBottom:8}}>Class starts in a moment</div>
      <div style={{fontSize:14,color:G,marginBottom:24}}>Shobhit will go live soon.</div>
      <Btn onClick={()=>setStarted(true)}>Enter Classroom</Btn>
    </div>}
    {started&&<div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,alignItems:"start"}}>
      <div>
        <div style={{background:"#0f0a2e",borderRadius:16,aspectRatio:"16/9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",position:"relative",overflow:"hidden",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:500,color:"#c4b5fd",marginBottom:8}}>Zoom SDK embedded here in production</div>
          <div style={{fontSize:13,color:"#8b7cc8"}}>AI PM Masterclass · Module 4</div>
          <div style={{position:"absolute",bottom:14,left:14,display:"flex",gap:8}}>
            {[["MIC"],["CAM"],["SCR"],["HAND"]].map(([l])=><button key={l} style={{width:36,height:36,borderRadius:8,background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",fontSize:9,color:"#fff"}}>{l}</button>)}
          </div>
          <div style={{position:"absolute",top:12,right:12}}><Tag c="#fff" bg="rgba(220,38,38,0.7)">🔴 LIVE · 347</Tag></div>
        </div>
        <Card>
          <div style={{fontSize:13,fontWeight:600,color:P,marginBottom:10}}>Live Poll: Best prioritization framework?</div>
          {pollOpts.map(o=><div key={o.l} onClick={()=>!pollVote&&setPollVote(o.l)} style={{marginBottom:8,cursor:pollVote?"default":"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:pollVote===o.l?600:400,color:pollVote===o.l?P:"#1e293b"}}>{o.l}</span>{pollVote&&<span style={{fontSize:12,color:G}}>{o.v}%</span>}</div>
            <div style={{background:"#f1f5f9",borderRadius:99,height:8,overflow:"hidden"}}>{pollVote&&<div style={{width:`${o.v}%`,height:"100%",background:pollVote===o.l?P:P+"44",borderRadius:99,transition:"width 0.6s"}}/>}</div>
          </div>)}
        </Card>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"0.5px solid #e2e8f0"}}>
          {["chat","leaderboard"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"9px",border:"none",background:tab===t?P:"#f8fafc",color:tab===t?"#fff":G,fontSize:12,cursor:"pointer"}}>{t==="chat"?"Chat":"Leaderboard"}</button>)}
        </div>
        {tab==="chat"&&<Card style={{padding:0,overflow:"hidden"}}>
          <div ref={chatRef} style={{height:260,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
            {chat.map((m,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}><Avatar initials={m.av} size={28} color={m.isMe?P:T}/><div><div style={{fontSize:11,fontWeight:600,color:m.isMe?P:T}}>{m.user} <span style={{color:G,fontWeight:400}}>{m.time}</span></div><div style={{fontSize:13,color:"#475569"}}>{m.msg}</div></div></div>)}
          </div>
          <div style={{padding:"10px 12px",borderTop:"0.5px solid #e2e8f0",display:"flex",gap:8}}>
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Say something..." style={{flex:1,padding:"7px 10px",borderRadius:8,border:"0.5px solid #e2e8f0",fontSize:12,background:"#f8fafc"}}/>
            <button onClick={send} style={{width:32,height:32,borderRadius:8,background:P,border:"none",color:"#fff",cursor:"pointer",fontSize:14}}>↑</button>
          </div>
        </Card>}
        {tab==="leaderboard"&&<Card><div style={{fontSize:12,color:G,marginBottom:12}}>Engagement Score</div>{LB.map(l=><div key={l.rank} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,background:l.isMe?PL:"transparent",marginBottom:4}}><div style={{width:28,fontSize:14,textAlign:"center"}}>{l.badge||l.rank}</div><div style={{flex:1,fontSize:13,fontWeight:l.isMe?600:400,color:l.isMe?P:"#1e293b"}}>{l.name}</div><div style={{fontSize:12,color:G}}>{l.pts.toLocaleString()}</div></div>)}</Card>}
        <Card><div style={{fontSize:12,color:G,marginBottom:8}}>Reactions</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["🔥","👏","💡","❤️","🚀","👍"].map(r=><button key={r} onClick={()=>dispatch({type:"TOAST",v:{kind:"info",msg:`Reacted with ${r}`}})} style={{fontSize:20,background:"#f8fafc",border:"0.5px solid #e2e8f0",borderRadius:8,padding:"6px 8px",cursor:"pointer"}}>{r}</button>)}</div></Card>
      </div>
    </div>}
  </div>;
}

/* ─── ADMIN ───────────────────────────────────────────── */
const EMPTY_FORM={title:"",tag:"",mrp:"",offerPrice:"",launch:"",start:"",speaker:"",linkedin:"",speakerPic:"",free:false,desc:"",weeks:""};
const IS={width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,background:"#f8fafc",color:"#1e293b",boxSizing:"border-box"};
function Lbl({t,req,note}){return<label style={{fontSize:11,fontWeight:600,color:G,display:"block",marginBottom:4}}>{t}{req&&<span style={{color:R}}> *</span>}{note&&<span style={{fontSize:10,color:T,fontWeight:400}}>{" — "}{note}</span>}</label>;}
function AdminPanel(){
  const{state,dispatch}=useApp();
  if(!requireRole(state.user,"admin"))return<div style={{maxWidth:600,margin:"80px auto",textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:16}}>🔒</div><div style={{fontSize:18,fontWeight:600,marginBottom:8}}>Access Denied</div><div style={{fontSize:13,color:G}}>Admin access required.</div></div>;
  const{courses,enrollments}=state;
  const[atab,setAtab]=useState("batches");
  const[form,setForm]=useState(EMPTY_FORM);
  const[errs,setErrs]=useState({});
  const[saved,setSaved]=useState(false);
  const[editId,setEditId]=useState(null);
  const[confirmRemove,setConfirmRemove]=useState(null);
  const fi=(k,v)=>setForm(f=>({...f,[k]:v}));
  const rs=k=>({...IS,border:`1.5px solid ${errs[k]?R:"#e2e8f0"}`});
  const validate=()=>{const e={};if(!san(form.title))e.title=true;if(!san(form.tag))e.tag=true;if(!form.mrp||Number(form.mrp)<=0)e.mrp=true;if(!form.launch)e.launch=true;if(!form.start)e.start=true;if(form.linkedin&&!okUrl(form.linkedin))e.linkedin=true;if(form.speakerPic&&!okUrl(form.speakerPic))e.speakerPic=true;setErrs(e);return Object.keys(e).length===0;};
  const startEdit=c=>{setForm({title:c.title||"",tag:c.tag||"",mrp:String(c.mrp||""),offerPrice:String(c.offerPrice||""),launch:c.launch||"",start:c.start||"",speaker:c.speaker||"",linkedin:c.linkedin||"",speakerPic:c.speakerPic||"",free:!!c.free,desc:c.desc||"",weeks:String(c.weeks||"")});setEditId(c.id);setErrs({});setConfirmRemove(null);document.getElementById("bf")?.scrollIntoView({behavior:"smooth",block:"start"});};
  const cancelEdit=()=>{setEditId(null);setForm(EMPTY_FORM);setErrs({});};
  const saveForm=()=>{if(!validate())return;const fields={title:san(form.title),tag:san(form.tag),mrp:Number(form.mrp),price:Number(form.offerPrice||form.mrp),offerPrice:form.offerPrice?Number(form.offerPrice):null,free:form.free||false,speaker:san(form.speaker),speakerRole:"Founder & CEO, Vestigia Technologies",linkedin:okUrl(form.linkedin)?form.linkedin:"",speakerPic:okUrl(form.speakerPic)?form.speakerPic:"",launch:form.launch,start:form.start,desc:san(form.desc),weeks:Number(form.weeks)||6};if(editId){dispatch({type:"UPDATE_COURSE",id:editId,v:fields});dispatch({type:"TOAST",v:{kind:"success",msg:`"${fields.title}" updated!`}});setEditId(null);}else{const nb={...fields,id:Date.now(),enrolled:0,rating:4.8,img:"📚",color:P,status:"upcoming",maxSeats:50,curriculum:[]};dispatch({type:"ADD_COURSE",v:nb});dispatch({type:"TOAST",v:{kind:"success",msg:`"${nb.title}" created!`}});setSaved(true);setTimeout(()=>setSaved(false),3000);}setForm(EMPTY_FORM);setErrs({});};
  const doRemove=c=>{dispatch({type:"REMOVE_COURSE",id:c.id});dispatch({type:"TOAST",v:{kind:"info",msg:`"${c.title}" removed.`}});setConfirmRemove(null);if(editId===c.id)cancelEdit();};
  const totalEnrolled=courses.reduce((s,c)=>s+c.enrolled,0);
  const paidE=enrollments.filter(e=>{const c=courses.find(x=>x.id===e.courseId);return c&&!c.free;});
  const revenue=paidE.reduce((s,e)=>{const c=courses.find(x=>x.id===e.courseId);return s+(c?.offerPrice||c?.mrp||0);},0);
  return<div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}><div style={{width:38,height:38,borderRadius:10,background:R,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:700}}>A</div><div><div style={{fontSize:18,fontWeight:700}}>Admin Panel</div><div style={{fontSize:12,color:G}}>Vestigia Technologies</div></div><div style={{marginLeft:"auto"}}><Tag c={R} bg={RL}>Admin</Tag></div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
      {[["Total Learners",totalEnrolled.toLocaleString(),P],["Batches",courses.length,T],["Paid Enrollments",paidE.length,A],["Revenue","₹"+revenue.toLocaleString(),B]].map(([l,v,c])=><div key={l} style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",borderLeft:`3px solid ${c}`}}><div style={{fontSize:11,color:G,marginBottom:4}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div></div>)}
    </div>
    <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"0.5px solid #e2e8f0",marginBottom:20}}>
      {[["batches","Batches"],["analytics","Analytics"]].map(([k,l])=><button key={k} onClick={()=>setAtab(k)} style={{flex:1,padding:"10px 8px",border:"none",background:atab===k?P:"#f8fafc",color:atab===k?"#fff":G,fontSize:12,cursor:"pointer",fontWeight:atab===k?600:400}}>{l}</button>)}
    </div>
    {atab==="batches"&&<div>
      <Card style={{marginBottom:16}}>
        <div id="bf" style={{fontSize:14,fontWeight:600,marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:editId?A:DARK}}>{editId?"Editing Batch":"Create New Batch"}</span>{editId&&<Btn small variant="outline" onClick={cancelEdit}>Cancel</Btn>}</div>
        <div style={{fontSize:11,color:G,marginBottom:14}}>Fields marked <span style={{color:R}}>*</span> are mandatory</div>
        {Object.keys(errs).length>0&&<div style={{padding:"10px 14px",borderRadius:8,background:RL,color:R,fontSize:13,marginBottom:12}}>Please fix the highlighted fields.</div>}
        {saved&&<div style={{padding:"10px 14px",borderRadius:8,background:TL,color:"#065f46",fontSize:13,marginBottom:12}}>Batch created!</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><Lbl t="Batch Title" req/><input value={form.title} onChange={e=>fi("title",e.target.value)} placeholder="e.g. AI PM Masterclass" style={rs("title")}/></div>
          <div><Lbl t="Tag" req/><input value={form.tag} onChange={e=>fi("tag",e.target.value)} placeholder="AI, TPM, Career" style={rs("tag")}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <div><Lbl t="MRP (₹)" req/><input type="number" value={form.mrp} onChange={e=>fi("mrp",e.target.value)} placeholder="8999" style={rs("mrp")}/></div>
          <div><Lbl t="Offer Price (₹)" note="optional"/><input type="number" value={form.offerPrice} onChange={e=>fi("offerPrice",e.target.value)} placeholder="4999" style={IS}/></div>
          <div><Lbl t="Duration (weeks)"/><input type="number" value={form.weeks} onChange={e=>fi("weeks",e.target.value)} placeholder="8" style={IS}/></div>
        </div>
        <div style={{marginBottom:12}}><Lbl t="Course Description"/><textarea value={form.desc} onChange={e=>fi("desc",e.target.value)} placeholder="Brief course description..." rows={2} style={{...IS,resize:"vertical"}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><Lbl t="Date of Launch" req/><input type="date" value={form.launch} onChange={e=>fi("launch",e.target.value)} style={rs("launch")}/></div>
          <div><Lbl t="Schedule Timestamp" req/><input type="datetime-local" value={form.start} onChange={e=>fi("start",e.target.value)} style={rs("start")}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><Lbl t="Speaker Name"/><input value={form.speaker} onChange={e=>fi("speaker",e.target.value)} placeholder="Shobhit Saxena" style={IS}/></div>
          <div><Lbl t="LinkedIn URL"/><input value={form.linkedin} onChange={e=>fi("linkedin",e.target.value)} placeholder="https://linkedin.com/in/..." style={rs("linkedin")}/></div>
        </div>
        <div style={{marginBottom:12}}><Lbl t="Speaker Picture URL"/><input value={form.speakerPic} onChange={e=>fi("speakerPic",e.target.value)} placeholder="https://..." style={rs("speakerPic")}/></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={form.free} onChange={e=>fi("free",e.target.checked)}/> Free course</label>
          <div style={{flex:1}}/>
          <Btn small variant="outline" onClick={()=>{setForm(EMPTY_FORM);setErrs({});}}>Clear</Btn>
          <Btn small onClick={saveForm}>{editId?"Update Batch":"+ Create Batch"}</Btn>
        </div>
      </Card>
      <div style={{display:"grid",gap:8}}>
        {courses.map(c=>{const seatsUsed=enrollments.filter(e=>e.courseId===c.id).length;return<div key={c.id}><div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"#f8fafc",borderRadius:12,flexWrap:"wrap"}}>
          <span style={{fontSize:22,flexShrink:0}}>{c.img}</span>
          <div style={{flex:1,minWidth:140}}><div style={{fontSize:13,fontWeight:600}}>{c.title}</div><div style={{fontSize:11,color:G,display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}><Tag c={c.color} bg={c.color+"22"} small>{c.tag}</Tag><span>{seatsUsed}/{c.maxSeats||"∞"} seats</span></div></div>
          <StatusBadge status={batchStatus(c)}/>
          <div style={{fontSize:13,fontWeight:600}}>{c.free?<span style={{color:T}}>Free</span>:c.offerPrice?<span style={{color:T}}>₹{Number(c.offerPrice).toLocaleString()}</span>:<span style={{color:P}}>₹{Number(c.mrp||0).toLocaleString()}</span>}</div>
          <div style={{display:"flex",gap:6}}>
            <Btn small variant="outline" onClick={()=>startEdit(c)}>{editId===c.id?"Editing…":"Edit"}</Btn>
            {confirmRemove===c.id?<span style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontSize:11,color:R}}>Sure?</span><Btn small onClick={()=>doRemove(c)} style={{background:R,borderColor:R,color:"#fff"}}>Yes</Btn><Btn small variant="outline" onClick={()=>setConfirmRemove(null)}>No</Btn></span>:<Btn small onClick={()=>setConfirmRemove(c.id)} style={{background:RL,color:R,border:"none"}}>Remove</Btn>}
          </div>
        </div></div>;})}
      </div>
    </div>}
    {atab==="analytics"&&<div style={{display:"grid",gap:14}}>
      <Card><div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Enrollments by batch</div>{courses.map(c=>{const max=Math.max(...courses.map(x=>x.enrolled),1);return<div key={c.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#475569",maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</span><span style={{fontWeight:600,color:c.color,flexShrink:0}}>{c.enrolled.toLocaleString()}</span></div><div style={{background:"#f1f5f9",borderRadius:99,height:6,overflow:"hidden"}}><div style={{width:`${Math.round((c.enrolled/max)*100)}%`,height:"100%",background:c.color,borderRadius:99}}/></div></div>;})}</Card>
      <Card><div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Revenue summary</div><div style={{fontSize:28,fontWeight:700,color:T,marginBottom:4}}>₹{revenue.toLocaleString()}</div><div style={{fontSize:12,color:G}}>from {paidE.length} paid enrollments</div></Card>
    </div>}
  </div>;
}

/* ─── FOOTER ──────────────────────────────────────────── */
function Footer({setPage}){
  return<footer style={{background:DARK,color:"#94a3b8",padding:"60px 24px 32px",marginTop:24}}>
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:40,marginBottom:48,flexWrap:"wrap"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <img src="/logo.png" alt="V" style={{height:36,width:36,objectFit:"contain",borderRadius:9}} onError={e=>{e.target.style.display="none";}}/>
            <div><div style={{color:"#fff",fontSize:16,fontWeight:700}}>Vestigia Technologies</div><div style={{fontSize:10,color:"#64748b"}}>OPC Pvt. Ltd.</div></div>
          </div>
          <p style={{fontSize:13,lineHeight:1.8,marginBottom:16,maxWidth:260}}>Engineering intelligence ecosystems. Bridging talent and opportunity across India's Tier-2 and Tier-3 cities.</p>
          <div style={{fontSize:11,color:"#475569"}}>Founded 2014 · Reborn 2024 · AI-First 2025</div>
        </div>
        {[["Platform",[["Courses",()=>setPage("courses")],["Dashboard",null],["Live Classes",null],["Free AI Extensions",null]]],["Company",[["About Us",()=>setPage("about")],["Blog",null],["Careers",null],["Community",null]]],["Legal",[["Privacy Policy",null],["Terms of Service",null],["Refund Policy",null],["Cookie Policy",null]]]].map(([title,links])=><div key={title}><div style={{color:"#e2e8f0",fontSize:13,fontWeight:700,marginBottom:16,textTransform:"uppercase",letterSpacing:0.5}}>{title}</div>{links.map(([l,fn])=><div key={l} onClick={fn||undefined} style={{fontSize:13,color:"#64748b",padding:"4px 0",cursor:fn?"pointer":"default",transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color="#a78bfa"} onMouseLeave={e=>e.currentTarget.style.color="#64748b"}>{l}</div>)}</div>)}
      </div>
      <div style={{borderTop:"0.5px solid rgba(255,255,255,0.08)",paddingTop:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:12,color:"#475569"}}>© 2025 Vestigia Technologies OPC Pvt. Ltd. · All rights reserved.</div>
        <div style={{display:"flex",gap:16}}>
          {[["LinkedIn","https://linkedin.com/in/shobhit30"],["Twitter","#"],["YouTube","#"],["Instagram","#"]].map(([n,u])=><a key={n} href={u} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#64748b",textDecoration:"none",transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color="#a78bfa"} onMouseLeave={e=>e.currentTarget.style.color="#64748b"}>{n}</a>)}
        </div>
        <div style={{fontSize:12,color:"#475569"}}>Built for tier-2 India. 🇮🇳</div>
      </div>
    </div>
  </footer>;
}

/* ─── ERROR BOUNDARY ─────────────────────────────────── */
class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  render(){if(this.state.error)return<div style={{padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:32,marginBottom:12}}>⚠️</div><div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Something went wrong</div><div style={{fontSize:13,color:G,marginBottom:16}}>{this.state.error.message}</div><button onClick={()=>this.setState({error:null})} style={{padding:"8px 20px",borderRadius:8,background:P,border:"none",color:"#fff",cursor:"pointer",fontSize:13}}>Try again</button></div>;return this.props.children;}
}

/* ─── ROOT ────────────────────────────────────────────── */
function AppContent(){
  const{state,dispatch}=useApp();
  const[page,setPage]=useState("home");
  const[showAuth,setShowAuth]=useState(false);
  const go=useCallback((p)=>{
    if(p==="admin"&&!requireRole(state.user,"admin")){dispatch({type:"TOAST",v:{kind:"error",msg:"Admin access required."}});return;}
    if((p==="dashboard"||p==="live"||p==="profile")&&!state.user){setShowAuth(true);return;}
    setPage(p);window.scrollTo?.(0,0);
  },[state.user]);
  const courseDetailMatch=page.startsWith("course-");
  const courseDetailId=courseDetailMatch?Number(page.replace("course-","")):null;
  if(!state.hydrated)return<div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:"#f8fafc"}}><div style={{height:62,borderBottom:"0.5px solid #e2e8f0",background:"#fff"}}/><div style={{maxWidth:1100,margin:"0 auto",padding:"60px 24px"}}><div style={{marginBottom:20}}><Skeleton h={28} w="40%"/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>{[1,2,3].map(i=><div key={i} style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:16,padding:"18px 20px"}}><Skeleton h={90} r={10}/><div style={{height:12}}/><Skeleton h={14} w="65%"/><div style={{height:8}}/><Skeleton h={12} w="45%"/></div>)}</div></div></div>;
  return<div style={{fontFamily:"system-ui,-apple-system,sans-serif",minHeight:"100vh",background:"#fff",color:"#1e293b"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}*{box-sizing:border-box}body{margin:0}`}</style>
    <Nav page={page} setPage={go} setShowAuth={setShowAuth}/>
    {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={role=>{setShowAuth(false);go(role==="admin"?"admin":"profile");}}/>}
    <PDPModal/><PaymentModal/>
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:300,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none"}}>
      {state.toasts.map(t=><div key={t.id} style={{pointerEvents:"all"}}><ToastItem t={t}/></div>)}
    </div>
    <ErrorBoundary>
      {page==="home"&&<HomePage setPage={go} setShowAuth={setShowAuth}/>}
      {page==="courses"&&<CoursesPage setPage={go}/>}
      {page==="about"&&<AboutPage setPage={go} setShowAuth={setShowAuth}/>}
      {page==="profile"&&state.user&&<ProfilePage setPage={go}/>}
      {page==="dashboard"&&state.user&&<Dashboard setPage={go}/>}
      {page==="live"&&state.user&&<LiveClass setPage={go}/>}
      {page==="admin"&&requireRole(state.user,"admin")&&<AdminPanel/>}
      {courseDetailMatch&&courseDetailId&&<CourseDetailPage courseId={courseDetailId} setPage={go} setShowAuth={setShowAuth}/>}
    </ErrorBoundary>
    {page!=="live"&&<Footer setPage={go}/>}
  </div>;
}

export default function App(){
  return<AppProvider><AppContent/></AppProvider>;
}
