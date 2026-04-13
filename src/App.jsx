import {useState,useEffect,useRef,useContext,createContext,useReducer,useCallback} from "react";
import React from "react";

/* ─── PALETTE ─────────────────────────────────────────── */
const P="#5B3DF5",PL="#EDEBFF",PD="#4527D9",T="#0D9488",TL="#CCFBF1",A="#D97706",AL="#FEF3C7",R="#DC2626",RL="#FEE2E2",B="#2563EB",BL="#DBEAFE",G="#64748B",DARK="#0F172A";

/* ─── UTILS ───────────────────────────────────────────── */
const san=s=>String(s||"").replace(/<[^>]*>/g,"").trim().slice(0,500);
const okUrl=s=>{try{return["http:","https:"].includes(new URL(s).protocol);}catch{return false;}};

/* ─── PRODUCTION: localStorage replaces window.storage ── */
const db={
  async get(k){try{const v=localStorage.getItem(k);return v?{value:v}:null;}catch{return null;}},
  async set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){console.warn("db",e);}},
};

/* ─── AI: rate limit via localStorage ────────────────────*/
const AI_DAILY=20;
const checkAiLimit=async uid=>{
  const k=`ai-${uid}-${new Date().toDateString().replace(/ /g,"-")}`;
  try{
    const r=await db.get(k);
    const n=r?JSON.parse(r.value):0;
    if(n>=AI_DAILY)return{ok:false,rem:0};
    await db.set(k,n+1);
    return{ok:true,rem:AI_DAILY-n-1};
  }catch{return{ok:true,rem:AI_DAILY};}
};

/* ─── AI PROXY (hits /api/ai in production) ──────────── */
const aiProxy=async(messages,systemPrompt)=>{
  try{
    const res=await fetch("/api/ai",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages,system:systemPrompt}),
    });
    if(!res.ok)throw new Error("proxy error");
    const d=await res.json();
    return d.reply||"Keep pushing — consistency is everything!";
  }catch{
    return"Stay consistent with your learning — that's where breakthroughs happen!";
  }
};

/* ─── SEED DATA ────────────────────────────────────────── */
const SEED=[
  {id:1,title:"AI Product Management Masterclass",tag:"AI",mrp:8999,price:4999,offerPrice:4999,free:false,enrolled:1240,rating:4.9,weeks:8,img:"🤖",color:P,status:"active",maxSeats:8,launch:"2025-03-01",start:"2025-03-01T19:00",speaker:"Shobhit Saxena",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",modules:["Intro to AI PM","Roadmapping","Stakeholder Mgmt","Metrics & OKRs","Capstone"]},
  {id:2,title:"TPM Bootcamp: Systems Thinking",tag:"TPM",mrp:6999,price:2499,offerPrice:2499,free:false,enrolled:890,rating:4.8,weeks:6,img:"⚙️",color:T,status:"active",maxSeats:5,launch:"2025-02-10",start:"2025-02-10T18:30",speaker:"Shobhit Saxena",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",modules:["Systems Design","Cross-functional","Risk Mgmt","Execution","Interviews"]},
  {id:3,title:"Build with Claude API",tag:"AI",mrp:2999,price:0,offerPrice:null,free:true,enrolled:3400,rating:4.7,weeks:4,img:"🧠",color:A,status:"active",maxSeats:100,launch:"2025-01-15",start:"2025-01-15T20:00",speaker:"Shobhit Saxena",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",modules:["API Basics","Prompt Engineering","RAG Systems","Deployment"]},
  {id:4,title:"Data Storytelling for PMs",tag:"Analytics",mrp:4999,price:2499,offerPrice:2499,free:false,enrolled:560,rating:4.8,weeks:5,img:"📊",color:B,status:"upcoming",maxSeats:12,launch:"2025-09-01",start:"2025-09-01T19:00",speaker:"Shobhit Saxena",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",modules:["SQL for PMs","Metrics","Dashboard Design","A/B Testing"]},
  {id:5,title:"Career Acceleration: Tier-2 to Tech",tag:"Career",mrp:1999,price:0,offerPrice:null,free:true,enrolled:5200,rating:4.9,weeks:3,img:"🚀",color:R,status:"active",maxSeats:200,launch:"2025-01-01",start:"2025-01-01T18:00",speaker:"Shobhit Saxena",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",modules:["Resume Reboot","LinkedIn Strategy","Interview Playbook"]},
  {id:6,title:"GenAI for Non-Technical Founders",tag:"AI",mrp:3999,price:1999,offerPrice:1999,free:false,enrolled:720,rating:4.7,weeks:4,img:"💡",color:P,status:"upcoming",maxSeats:15,launch:"2025-10-01",start:"2025-10-01T19:00",speaker:"Shobhit Saxena",linkedin:"https://linkedin.com/in/shobhit30",speakerPic:"",modules:["AI Landscape","Use-case Mapping","Vendor Selection","ROI"]}
];
const BLOGS=[
  {title:"Why Tier-2 India is the next EdTech frontier",tag:"EdTech",date:"Mar 28, 2025",read:"5 min"},
  {title:"AI won't replace PMs — it will amplify them",tag:"AI + Product",date:"Mar 15, 2025",read:"7 min"},
  {title:"From Meerut to Meta: the TPM playbook",tag:"Career",date:"Feb 28, 2025",read:"6 min"}
];
const TESTIMONIALS=[
  {name:"Priya Sharma",role:"PM @ Flipkart",text:"Shobhit's AI PM course changed how I think about roadmaps. Got promoted within 3 months.",av:"PS"},
  {name:"Rahul Verma",role:"TPM @ Meesho",text:"Best TPM content in India, period. The systems thinking module alone is worth 10x the price.",av:"RV"},
  {name:"Anjali Singh",role:"SDE-2 → PM @ Swiggy",text:"Transitioned from engineering to PM in 6 months. The community support is incredible.",av:"AS"}
];
const INIT_CHAT=[
  {user:"Priya S",msg:"This makes so much sense!",time:"10:32",av:"PS"},
  {user:"Rahul V",msg:"Can you elaborate on RICE?",time:"10:33",av:"RV"},
  {user:"Amit K",msg:"Best session so far!",time:"10:34",av:"AK"}
];
const LB=[
  {rank:1,name:"Priya Sharma",pts:1840,badge:"1st",isMe:false},
  {rank:2,name:"Rahul Verma",pts:1620,badge:"2nd",isMe:false},
  {rank:3,name:"You",pts:1540,badge:"3rd",isMe:true},
  {rank:4,name:"Anjali Singh",pts:1290,badge:"",isMe:false},
  {rank:5,name:"Amit Kumar",pts:1100,badge:"",isMe:false}
];

/* ─── GLOBAL STATE ─────────────────────────────────────── */
const Ctx=createContext(null);
const useApp=()=>useContext(Ctx);
const INIT={user:null,courses:SEED,enrollments:[],waitlist:[],toasts:[],pdp:null,payment:null,hydrated:false};

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
    case "CANCEL_ENROLLMENT":{
      const next=s.waitlist.find(w=>w.courseId===a.courseId);
      const pruned=s.enrollments.filter(e=>e.id!==a.enrollmentId);
      return{...s,enrollments:next?[...pruned,{id:Date.now(),userId:next.userId,courseId:a.courseId,enrolledAt:new Date().toISOString(),progress:0,completed:false,paymentRef:null,promotedFromWaitlist:true}]:pruned,waitlist:next?s.waitlist.filter(w=>w.id!==next.id):s.waitlist,toasts:next?[...s.toasts,{id:Date.now(),kind:"success",msg:`Seat opened — ${next.name} promoted from waitlist.`}]:s.toasts};
    }
    case "UPDATE_PROGRESS":return{...s,enrollments:s.enrollments.map(e=>e.userId===a.userId&&e.courseId===a.courseId?{...e,progress:Math.max(e.progress,a.pct),completed:a.pct>=100}:e)};
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
  return state.courses.filter(c=>!ids.has(c.id)&&c.status!=="draft").map(c=>({...c,_score:(tags.has(c.tag)?3:0)+c.rating+(c.free?.5:0)})).sort((a,b)=>b._score-a._score).slice(0,3);
}

function AppProvider({children}){
  const[state,dispatch]=useReducer(reducer,INIT);
  useEffect(()=>{
    (async()=>{
      const saved=await db.get("vstig-v3");
      dispatch({type:"HYDRATE",p:{courses:saved?JSON.parse(saved.value)?.courses||SEED:SEED,enrollments:saved?JSON.parse(saved.value)?.enrollments||[]:[], waitlist:saved?JSON.parse(saved.value)?.waitlist||[]:[], user:saved?JSON.parse(saved.value)?.user||null:null}});
    })();
  },[]);
  useEffect(()=>{
    if(!state.hydrated)return;
    db.set("vstig-v3",{courses:state.courses,enrollments:state.enrollments,waitlist:state.waitlist,user:state.user});
  },[state.courses,state.enrollments,state.waitlist,state.user,state.hydrated]);
  return <Ctx.Provider value={{state,dispatch}}>{children}</Ctx.Provider>;
}

/* ─── UI PRIMITIVES ────────────────────────────────────── */
const Btn=({children,variant="primary",onClick,small,disabled,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{padding:small?"6px 14px":"10px 22px",borderRadius:10,border:`1.5px solid ${variant==="primary"?P:variant==="outline"?P:"transparent"}`,background:variant==="primary"?P:"transparent",color:variant==="primary"?"#fff":P,fontSize:small?12:14,fontWeight:500,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.6:1,whiteSpace:"nowrap",...style}}>{children}</button>
);
const Tag=({c=P,bg=PL,children,small})=><span style={{background:bg,color:c,fontSize:small?10:11,fontWeight:500,padding:small?"2px 6px":"3px 10px",borderRadius:20}}>{children}</span>;
const Card=({children,style={}})=><div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px",...style}}>{children}</div>;
const Avatar=({initials,size=36,color=P,src})=>(
  <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",color,fontSize:size*0.36,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
    {src?<img src={src} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>e.target.style.display="none"}/>:initials}
  </div>
);
const Star=()=><span style={{color:"#F59E0B",fontSize:12}}>★</span>;
const ProgressBar=({pct,color=P})=>(
  <div style={{background:"#f1f5f9",borderRadius:99,height:6,overflow:"hidden"}}>
    <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.6s"}}/>
  </div>
);
const Skeleton=({w="100%",h=14,r=6})=><div style={{width:w,height:h,borderRadius:r,background:"#f1f5f9",animation:"pulse 1.4s ease-in-out infinite"}}/>;

const batchStatus=c=>{
  const now=new Date(),ld=new Date(c.launch),sd=new Date(c.start);
  if(ld.toDateString()===now.toDateString()||sd.toDateString()===now.toDateString())return"live";
  if(ld>now)return"upcoming";
  return"active";
};

const PriceDisplay=({c,large})=>{
  const fs=large?18:15,sm=large?13:11;
  if(c.free)return<span style={{fontSize:fs,fontWeight:600,color:T}}>Free</span>;
  if(c.offerPrice)return<span style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}><span style={{fontSize:fs,fontWeight:600,color:T}}>₹{Number(c.offerPrice).toLocaleString()}</span><span style={{fontSize:sm,color:G,textDecoration:"line-through"}}>₹{Number(c.mrp).toLocaleString()}</span><Tag c={T} bg={TL} small>Save ₹{(Number(c.mrp)-Number(c.offerPrice)).toLocaleString()}</Tag></span>;
  return<span style={{fontSize:fs,fontWeight:600,color:c.color}}>₹{Number(c.price||c.mrp).toLocaleString()}</span>;
};
const StatusBadge=({status})=>{
  const m={live:[R,RL,"Live"],active:[T,TL,"Active"],upcoming:[A,AL,"Upcoming"],draft:[G,"#f1f5f9","Draft"]};
  const[c,bg,l]=m[status]||m.active;
  return<Tag c={c} bg={bg} small>{l}</Tag>;
};

const TOAST_C={success:{bg:TL,c:"#065f46"},error:{bg:RL,c:"#7f1d1d"},info:{bg:BL,c:"#1e3a5f"}};
function ToastItem({t}){
  const{dispatch}=useApp();
  useEffect(()=>{const id=setTimeout(()=>dispatch({type:"DISMISS_TOAST",id:t.id}),3500);return()=>clearTimeout(id);},[t.id]);
  const col=TOAST_C[t.kind]||TOAST_C.info;
  return<div style={{background:col.bg,color:col.c,padding:"10px 16px",borderRadius:10,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:10,minWidth:240,maxWidth:340}}><span style={{flex:1}}>{t.msg}</span><button onClick={()=>dispatch({type:"DISMISS_TOAST",id:t.id})} style={{background:"none",border:"none",cursor:"pointer",color:col.c,fontSize:18,lineHeight:1}}>×</button></div>;
}

function CountdownBadge({target}){
  const calc=useCallback(()=>{const diff=new Date(target)-new Date();if(diff<=0)return null;return{d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)};},[target]);
  const[t,setT]=useState(calc);
  useEffect(()=>{setT(calc());const id=setInterval(()=>setT(calc()),1000);return()=>clearInterval(id);},[calc]);
  if(!t)return<div style={{padding:"8px 14px",borderRadius:8,background:RL,color:R,fontSize:12,fontWeight:500,marginBottom:12}}>Scheduled time has passed</div>;
  return<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:AL,marginBottom:12}}><span style={{fontSize:12,color:A,fontWeight:500}}>Launches in:</span><div style={{display:"flex",gap:6}}>{[["Days",t.d],["Hrs",t.h],["Min",t.m],["Sec",t.s]].map(([l,v])=><div key={l} style={{textAlign:"center",background:"#fff",borderRadius:8,padding:"4px 10px",minWidth:44}}><div style={{fontSize:16,fontWeight:700,color:A,lineHeight:1}}>{String(v).padStart(2,"0")}</div><div style={{fontSize:9,color:G,marginTop:2}}>{l}</div></div>)}</div></div>;
}

function SpeakerCard({speaker,linkedin,speakerPic,previewMode}){
  if(!speaker&&!linkedin)return null;
  return<div style={{padding:"12px 14px",borderRadius:12,background:previewMode?PL:"#f8fafc",border:`1px solid ${previewMode?P+"33":"#e2e8f0"}`,marginTop:12}}>{previewMode&&<div style={{fontSize:10,color:P,fontWeight:500,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>PDP Preview</div>}<div style={{display:"flex",alignItems:"center",gap:10}}><Avatar initials={(speaker||"S")[0]} size={40} color={P} src={speakerPic||null}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{speaker||"Instructor"}</div><div style={{fontSize:11,color:G}}>Course Instructor</div></div>{linkedin&&okUrl(linkedin)&&<a href={linkedin} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"#0A66C2",color:"#fff",fontSize:11,fontWeight:500,textDecoration:"none"}}>LinkedIn</a>}</div></div>;
}

function requireRole(user,role){return user?.role===role;}

/* ─── PDP MODAL ─────────────────────────────────────────── */
function PDPModal(){
  const{state,dispatch}=useApp();
  const c=state.pdp;
  if(!c)return null;
  const close=()=>dispatch({type:"SET_PDP",v:null});
  const{user,enrollments,waitlist}=state;
  const status=batchStatus(c);
  const isEnrolled=enrollments.some(e=>e.userId===user?.id&&e.courseId===c.id);
  const seatsUsed=enrollments.filter(e=>e.courseId===c.id).length;
  const maxSeats=c.maxSeats??null;
  const isFull=maxSeats!==null&&seatsUsed>=maxSeats;
  const seatsLeft=maxSeats!==null?Math.max(0,maxSeats-seatsUsed):null;
  const wlQueue=waitlist.filter(w=>w.courseId===c.id);
  const myWaitIdx=waitlist.findIndex(w=>w.userId===user?.id&&w.courseId===c.id);
  const isOnWaitlist=myWaitIdx!==-1;
  const handleEnroll=()=>{
    if(!user){close();return;}
    if(isFull&&!isEnrolled){
      if(isOnWaitlist){dispatch({type:"TOAST",v:{kind:"info",msg:`You're #${myWaitIdx+1} on the waitlist.`}});return;}
      dispatch({type:"ADD_WAITLIST",v:{id:Date.now(),userId:user.id,courseId:c.id,name:user.name,joinedAt:new Date().toISOString()}});
      dispatch({type:"TOAST",v:{kind:"info",msg:`You're #${wlQueue.length+1} on the waitlist!`}});
      close();return;
    }
    if(c.free||c.price===0){
      dispatch({type:"ADD_ENROLLMENT",v:{id:Date.now(),userId:user.id,courseId:c.id,enrolledAt:new Date().toISOString(),progress:0,completed:false,paymentRef:null}});
      dispatch({type:"TOAST",v:{kind:"success",msg:`Enrolled in "${c.title}"!`}});
      close();
    }else{close();dispatch({type:"SET_PAYMENT",v:c});}
  };
  return<div onClick={e=>e.target===e.currentTarget&&close()} style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"60px 16px 40px",background:"rgba(0,0,0,0.5)",overflowY:"auto"}}>
    <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",maxWidth:560,width:"100%",position:"relative"}}>
      <button onClick={close} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:22,cursor:"pointer",color:G}}>×</button>
      <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:20}}>
        <div style={{width:64,height:64,borderRadius:14,background:`${c.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{c.img}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}><Tag c={c.color} bg={c.color+"22"}>{c.tag}</Tag>{c.free&&<Tag c={T} bg={TL}>Free</Tag>}<StatusBadge status={status}/></div>
          <div style={{fontSize:18,fontWeight:500,marginBottom:4}}>{c.title}</div>
          <div style={{fontSize:12,color:G}}>{c.weeks} weeks · {seatsUsed.toLocaleString()} enrolled{c.rating&&` · ★ ${c.rating}`}</div>
        </div>
      </div>
      {status==="upcoming"&&c.start&&<CountdownBadge target={c.start}/>}
      {c.modules?.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:500,color:c.color,marginBottom:8}}>What you'll learn</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{c.modules.map(m=><Tag key={m} c={c.color} bg={c.color+"22"} small>{m}</Tag>)}</div></div>}
      {seatsLeft!==null&&!isEnrolled&&!isFull&&seatsLeft<=5&&<div style={{fontSize:11,color:R,marginBottom:8,fontWeight:500}}>Only {seatsLeft} seat{seatsLeft!==1?"s":""} left!</div>}
      {isFull&&!isEnrolled&&<div style={{fontSize:11,color:A,marginBottom:8}}>Batch full · {wlQueue.length} on waitlist</div>}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16,flexWrap:"wrap"}}>
        <PriceDisplay c={c} large/>
        {isEnrolled?<Tag c={T} bg={TL}>Already enrolled</Tag>:!user?<Btn onClick={()=>dispatch({type:"SET_PDP",v:null})}>Login to Enroll</Btn>:isFull?<Btn onClick={handleEnroll}>{isOnWaitlist?`Waitlisted — #${myWaitIdx+1} in line`:`Join Waitlist (${wlQueue.length} ahead)`}</Btn>:<Btn onClick={handleEnroll}>{c.free?"Enroll Free":"Buy Now — ₹"+(c.offerPrice||c.price||c.mrp).toLocaleString()}</Btn>}
      </div>
      <SpeakerCard speaker={c.speaker} linkedin={c.linkedin} speakerPic={c.speakerPic}/>
    </div>
  </div>;
}

/* ─── PAYMENT MODAL ─────────────────────────────────────── */
function PaymentModal(){
  const{state,dispatch}=useApp();
  const c=state.payment;
  const[step,setStep]=useState("checkout");
  const[processing,setProcessing]=useState(false);
  if(!c)return null;
  const close=()=>{dispatch({type:"SET_PAYMENT",v:null});setStep("checkout");};
  const price=c.offerPrice||c.price||c.mrp;
  const pay=async()=>{
    setProcessing(true);
    await new Promise(r=>setTimeout(r,2000));
    const ref="pay_"+Math.random().toString(36).slice(2,10);
    dispatch({type:"ADD_ENROLLMENT",v:{id:Date.now(),userId:state.user.id,courseId:c.id,enrolledAt:new Date().toISOString(),progress:0,completed:false,paymentRef:ref}});
    dispatch({type:"TOAST",v:{kind:"success",msg:`Payment successful! Enrolled in "${c.title}".`}});
    setStep("success");setProcessing(false);
  };
  return<div onClick={e=>e.target===e.currentTarget&&close()} style={{position:"fixed",inset:0,zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.5)"}}>
    <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",maxWidth:420,width:"100%"}}>
      {step==="checkout"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}><div><div style={{fontSize:16,fontWeight:500,marginBottom:4}}>{c.title}</div><div style={{fontSize:12,color:G}}>{c.weeks} weeks · {c.tag}</div></div><button onClick={close} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:G}}>×</button></div>
        <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span>Course MRP</span><span>₹{Number(c.mrp).toLocaleString()}</span></div>
          {c.offerPrice&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6,color:T}}><span>Discount</span><span>-₹{(Number(c.mrp)-Number(c.offerPrice)).toLocaleString()}</span></div>}
          <div style={{borderTop:"0.5px solid #e2e8f0",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:500}}><span>Total</span><span style={{color:T}}>₹{Number(price).toLocaleString()}</span></div>
        </div>
        <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"8px 14px",marginBottom:14,fontSize:12,color:"#166534"}}>Test mode — no real charge.</div>
        <div style={{display:"grid",gap:10,marginBottom:16}}>
          <input placeholder="Card number: 4111 1111 1111 1111" style={{padding:"10px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><input placeholder="MM / YY" style={{padding:"10px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13}}/><input placeholder="CVV" style={{padding:"10px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13}}/></div>
        </div>
        <button onClick={pay} disabled={processing} style={{width:"100%",padding:"13px",borderRadius:12,background:processing?"#9ca3af":DARK,border:"none",color:"#fff",fontSize:14,fontWeight:500,cursor:processing?"not-allowed":"pointer"}}>{processing?"Processing...":"Pay ₹"+Number(price).toLocaleString()+" via Razorpay"}</button>
      </>}
      {step==="success"&&<div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
        <div style={{fontSize:20,fontWeight:600,marginBottom:6}}>Payment Successful!</div>
        <div style={{fontSize:13,color:G,marginBottom:20}}>You are enrolled in <strong>{c.title}</strong></div>
        <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:20,textAlign:"left"}}>
          <div style={{fontSize:12,fontWeight:500,color:G,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>What happens next</div>
          {[["📅","First live class",c.start?new Date(c.start).toLocaleDateString("en-IN",{day:"numeric",month:"long"}):"-"],["📧","Confirmation email","Sent to your registered email"],["📂","Course content","Available in your dashboard"],["🤖","AI study assistant","Ready to help in dashboard"]].map(([ic,lbl,val])=><div key={lbl} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}><span style={{fontSize:16}}>{ic}</span><div><div style={{fontSize:12,fontWeight:500}}>{lbl}</div><div style={{fontSize:11,color:G}}>{val}</div></div></div>)}
        </div>
        <Btn onClick={close}>Go to Dashboard</Btn>
      </div>}
    </div>
  </div>;
}

/* ─── AUTH MODAL (REDESIGNED) ──────────────────────────── */
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
  const CCS=["+91","+1","+44","+61","+971","+65","+60","+66","+880","+94"];
  const handleOtp=(i,v)=>{if(!/^\d?$/.test(v))return;const n=[...otp];n[i]=v;setOtp(n);if(v&&i<4)refs[i+1].current?.focus();};
  const login=(role="student")=>{
    const user={id:"u-"+Date.now(),name:san(name)||"Learner",avatar,role,mobile:cc+mobile};
    dispatch({type:"SET_USER",v:user});
    dispatch({type:"TOAST",v:{kind:"success",msg:`Welcome, ${user.name}!`}});
    onClose();onLogin?.(role);
  };
  const sendOtp=async()=>{
    if(mobile.length<7)return;
    setSending(true);
    await new Promise(r=>setTimeout(r,900));
    setSending(false);
    setStep("otp");
  };
  const verifyOtp=()=>{if(otp.join("").length===5)setStep("profile");};
  const isDev=true;
  const steps=["start","otp","profile"];
  const idx=steps.indexOf(step);
  return<div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(15,10,46,0.65)",backdropFilter:"blur(6px)"}}>
    <div style={{width:"100%",maxWidth:440,background:"#fff",borderRadius:28,overflow:"hidden",boxShadow:"0 24px 80px rgba(91,61,245,0.22)"}}>
      <div style={{background:`linear-gradient(135deg,${DARK},#2d1a6e)`,padding:"32px 32px 28px",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <img src="/logo.png" alt="V" style={{height:44,width:44,objectFit:"contain",borderRadius:12}} onError={e=>{e.target.style.display="none";e.target.parentNode.insertAdjacentHTML("afterbegin",`<div style="width:44px;height:44px;borderRadius:12px;background:rgba(255,255,255,0.15);display:flex;alignItems:center;justifyContent:center;color:#c4b5fd;fontWeight:700;fontSize:20px">V</div>`);}}/>
          <div><div style={{color:"#fff",fontWeight:700,fontSize:18}}>Vestigia Technologies</div><div style={{color:"#a78bfa",fontSize:12}}>India's AI-first learning platform</div></div>
        </div>
        <div style={{display:"flex",gap:6}}>{steps.map((s,i)=><div key={s} style={{height:3,borderRadius:99,background:i<=idx?"#a78bfa":"rgba(255,255,255,0.15)",flex:i===idx?2:1,transition:"all 0.4s"}}/>)}</div>
      </div>
      <div style={{padding:"32px 32px 36px"}}>
        {step==="start"&&<>
          <div style={{fontSize:22,fontWeight:700,color:DARK,marginBottom:4}}>Get started free</div>
          <div style={{fontSize:13,color:G,marginBottom:28}}>Join 12,000+ learners building AI & Product skills</div>
          <button onClick={()=>setStep("profile")} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid #e2e8f0",background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",marginBottom:20,fontSize:15,color:DARK,fontWeight:500}}>
            <svg width="20" height="20" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><div style={{flex:1,height:1,background:"#e2e8f0"}}/><span style={{fontSize:12,color:G,fontWeight:500}}>or sign in with mobile</span><div style={{flex:1,height:1,background:"#e2e8f0"}}/></div>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <select value={cc} onChange={e=>setCc(e.target.value)} style={{padding:"12px 10px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fafafa",color:DARK,fontSize:14,width:88,flexShrink:0,cursor:"pointer"}}>
              {CCS.map(c=><option key={c}>{c}</option>)}
            </select>
            <input value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,""))} placeholder="Mobile number" maxLength={12} style={{flex:1,padding:"12px 14px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fafafa",fontSize:14,color:DARK,outline:"none"}}/>
          </div>
          <button onClick={sendOtp} disabled={sending||mobile.length<7} style={{width:"100%",padding:"14px",borderRadius:14,background:mobile.length>=7?P:"#c7bcff",border:"none",color:"#fff",fontSize:15,fontWeight:600,cursor:mobile.length>=7?"pointer":"not-allowed"}}>
            {sending?"Sending OTP...":"Send OTP →"}
          </button>
          {isDev&&<button onClick={()=>login("admin")} style={{width:"100%",padding:"8px",marginTop:10,background:"none",border:"none",color:"#cbd5e1",fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Dev: Admin login</button>}
        </>}
        {step==="otp"&&<>
          <div style={{fontSize:22,fontWeight:700,color:DARK,marginBottom:4}}>Verify your number</div>
          <div style={{fontSize:13,color:G,marginBottom:6}}>We sent a 5-digit OTP to</div>
          <div style={{fontSize:15,fontWeight:600,color:P,marginBottom:28}}>{cc} {mobile}</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:10}}>
            {otp.map((v,i)=><input key={i} ref={refs[i]} maxLength={1} value={v} onChange={e=>handleOtp(i,e.target.value)} onKeyDown={e=>{if(e.key==="Backspace"&&!v&&i>0)refs[i-1].current?.focus();}} style={{width:52,height:60,textAlign:"center",fontSize:26,fontWeight:700,borderRadius:14,border:`2.5px solid ${v?P:"#e2e8f0"}`,background:v?PL:"#fafafa",color:DARK,outline:"none"}}/>)}
          </div>
          <div style={{textAlign:"center",fontSize:12,color:G,marginBottom:24}}>
            <button onClick={()=>setStep("start")} style={{background:"none",border:"none",color:P,cursor:"pointer",fontSize:12,fontWeight:500}}>Change number</button>
            {" · "}
            <button onClick={sendOtp} style={{background:"none",border:"none",color:P,cursor:"pointer",fontSize:12,fontWeight:500}}>Resend OTP</button>
          </div>
          <button onClick={verifyOtp} disabled={otp.join("").length<5} style={{width:"100%",padding:"14px",borderRadius:14,background:otp.join("").length===5?P:"#c7bcff",border:"none",color:"#fff",fontSize:15,fontWeight:600,cursor:otp.join("").length===5?"pointer":"not-allowed"}}>Verify & Continue →</button>
        </>}
        {step==="profile"&&<>
          <div style={{fontSize:22,fontWeight:700,color:DARK,marginBottom:4}}>Set up your profile</div>
          <div style={{fontSize:13,color:G,marginBottom:20}}>Quick setup — update everything later in your profile</div>
          <div style={{background:"#f8f7ff",border:"1.5px solid #e2d9f3",borderRadius:16,padding:16,marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:P,textTransform:"uppercase",letterSpacing:0.5,marginBottom:12}}>Choose your avatar</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["🧑‍💻","👩‍💻","🧑‍🎓","👩‍🎓","🦊","🚀","🧠","⚡"].map(a=><button key={a} onClick={()=>setAvatar(a)} style={{width:46,height:46,fontSize:22,borderRadius:12,border:`2px solid ${avatar===a?P:"#e2d9f3"}`,background:avatar===a?PL:"#fff",cursor:"pointer"}}>{a}</button>)}</div>
          </div>
          <input placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fafafa",fontSize:14,color:DARK,outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
          <button onClick={()=>login("student")} style={{width:"100%",padding:"14px",borderRadius:14,background:P,border:"none",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer"}}>{avatar} Start Learning →</button>
          <div style={{textAlign:"center",fontSize:11,color:G,marginTop:12}}>By joining you agree to our <span style={{color:P,cursor:"pointer"}}>Terms</span> & <span style={{color:P,cursor:"pointer"}}>Privacy Policy</span></div>
        </>}
      </div>
    </div>
  </div>;
}

/* ─── NAV ───────────────────────────────────────────────── */
function Nav({page,setPage,setShowAuth}){
  const{state,dispatch}=useApp();
  const{user}=state;
  const[mob,setMob]=useState(false);
  return<nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",borderBottom:"0.5px solid #e2e8f0",padding:"0 24px"}}>
    <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",gap:8,height:60}}>
      <button onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0}}>
<img src="/logo.png" alt="Vestigia" style={{height:38,width:38,objectFit:"contain",borderRadius:8}}/>        <div style={{lineHeight:1.2,textAlign:"left"}}><div style={{fontSize:14,fontWeight:600,color:DARK}}>Vestigia</div><div style={{fontSize:10,color:G}}>Technologies</div></div>
      </button>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:4}} className="desk-nav">
        {[["courses","Courses"],["about","About Us"]].map(([p,l])=><button key={p} onClick={()=>setPage(p)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:page===p?PL:"transparent",color:page===p?P:G,fontSize:13,cursor:"pointer",fontWeight:page===p?500:400}}>{l}</button>)}
        <a href="https://chromewebstore.google.com" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#475569",fontSize:13,fontWeight:500,textDecoration:"none",whiteSpace:"nowrap"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke={P} strokeWidth="1.8"/><circle cx="12" cy="12" r="4" fill={P}/><path d="M12 8c2.2 0 4 1.8 4 4H22M12 8c-2.2 0-4 1.8-4 4l-5.2 9M12 8V2" stroke={P} strokeWidth="1.8" strokeLinecap="round"/></svg>
          AI Tools
        </a>
        {user&&<button onClick={()=>setPage("dashboard")} style={{padding:"6px 14px",borderRadius:8,border:"none",background:page==="dashboard"?PL:"transparent",color:page==="dashboard"?P:G,fontSize:13,cursor:"pointer",fontWeight:page==="dashboard"?500:400}}>Dashboard</button>}
        {requireRole(user,"admin")&&<button onClick={()=>setPage("admin")} style={{padding:"6px 12px",borderRadius:8,border:"none",background:page==="admin"?RL:"transparent",color:page==="admin"?R:G,fontSize:12,cursor:"pointer"}}>Admin</button>}
        <div style={{width:1,height:20,background:"#e2e8f0",flexShrink:0}}/>
        {user?<div style={{display:"flex",alignItems:"center",gap:8}}><Avatar initials={user.avatar||user.name?.[0]||"U"} size={32} color={P}/><button onClick={()=>{dispatch({type:"LOGOUT"});dispatch({type:"TOAST",v:{kind:"info",msg:"Logged out."}});setPage("home");}} style={{fontSize:12,color:G,background:"none",border:"none",cursor:"pointer"}}>Logout</button></div>:<button onClick={()=>setShowAuth(true)} style={{padding:"8px 20px",borderRadius:10,background:P,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Start Free</button>}
      </div>
      <button onClick={()=>setMob(o=>!o)} className="ham" style={{display:"none",background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}>
        <div style={{width:22,height:2,background:DARK,marginBottom:5,borderRadius:2}}/><div style={{width:22,height:2,background:DARK,marginBottom:5,borderRadius:2}}/><div style={{width:22,height:2,background:DARK,borderRadius:2}}/>
      </button>
    </div>
    {mob&&<div style={{padding:"12px 24px 20px",borderTop:"0.5px solid #e2e8f0",display:"flex",flexDirection:"column",gap:4}}>
      {[["courses","Courses"],["about","About Us"]].map(([p,l])=><button key={p} onClick={()=>{setPage(p);setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>{l}</button>)}
      {user&&<button onClick={()=>{setPage("dashboard");setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>Dashboard</button>}
      {requireRole(user,"admin")&&<button onClick={()=>{setPage("admin");setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:R,fontSize:14,cursor:"pointer",textAlign:"left"}}>Admin</button>}
      {user?<button onClick={()=>{dispatch({type:"LOGOUT"});setPage("home");setMob(false);}} style={{padding:"10px 14px",borderRadius:8,border:"none",background:"transparent",color:G,fontSize:14,cursor:"pointer",textAlign:"left"}}>Logout</button>:<button onClick={()=>{setShowAuth(true);setMob(false);}} style={{padding:"10px",borderRadius:10,background:P,border:"none",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>Start Free</button>}
    </div>}
    <style>{`.ham{display:none!important}@media(max-width:768px){.ham{display:block!important}.desk-nav{display:none!important}}`}</style>
  </nav>;
}

/* ─── COURSE CARD ───────────────────────────────────────── */
function CourseCard({c,dashboard}){
  const{state,dispatch}=useApp();
  const{enrollments}=state;
  const status=batchStatus(c);
  const seatsUsed=enrollments.filter(e=>e.courseId===c.id).length;
  const maxSeats=c.maxSeats??null;
  const isFull=maxSeats!==null&&seatsUsed>=maxSeats;
  const seatsLeft=maxSeats!==null?Math.max(0,maxSeats-seatsUsed):null;
  const myE=enrollments.find(e=>e.userId===state.user?.id&&e.courseId===c.id);
  return<div onClick={()=>dispatch({type:"SET_PDP",v:c})} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&dispatch({type:"SET_PDP",v:c})} style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px",cursor:"pointer",display:"flex",flexDirection:"column"}}>
    <div style={{height:90,borderRadius:10,background:`${c.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:14,position:"relative"}}>
      {c.img}
      {status==="live"&&<span style={{position:"absolute",top:8,right:8,background:R,color:"#fff",fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:99}}>LIVE</span>}
      {isFull&&<span style={{position:"absolute",bottom:8,right:8,background:DARK,color:"#fff",fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:99}}>Full</span>}
    </div>
    <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}><Tag c={c.color} bg={c.color+"22"} small>{c.tag}</Tag>{c.free&&<Tag c={T} bg={TL} small>Free</Tag>}<StatusBadge status={status}/></div>
    <div style={{fontSize:14,fontWeight:500,marginBottom:4,lineHeight:1.4}}>{c.title}</div>
    <div style={{fontSize:12,color:G,marginBottom:10}}>{c.speaker} · {c.weeks} weeks</div>
    {dashboard&&myE&&<><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:11,color:G}}>Progress</span><span style={{fontSize:11,fontWeight:500,color:myE.progress>=100?T:c.color}}>{myE.progress}%{myE.progress>=100?" ✓":""}</span></div><ProgressBar pct={myE.progress} color={myE.progress>=100?T:c.color}/><div style={{height:8}}/></>}
    <div style={{flex:1}}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}><PriceDisplay c={c}/><div style={{fontSize:11,color:G}}><Star/>{c.rating}{seatsLeft!==null&&seatsLeft<=3&&!isFull&&<span style={{color:R,marginLeft:4}}>·{seatsLeft} left</span>}</div></div>
  </div>;
}

/* ─── HOME PAGE ─────────────────────────────────────────── */
function HomePage({setPage,setShowAuth}){
  const{state}=useApp();
  const{courses}=state;
  const featured=courses.filter(c=>c.status!=="draft").slice(0,3);
  const live=courses.filter(c=>batchStatus(c)==="live");
  const totalEnrolled=courses.reduce((s,c)=>s+c.enrolled,0);
  return<div>
    <section style={{background:DARK,padding:"96px 24px 80px",color:"#fff",textAlign:"center"}}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        {live.length>0?<div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(220,38,38,0.15)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:99,padding:"5px 16px",fontSize:12,color:"#fca5a5",marginBottom:28,fontWeight:500}}>Live now: {live[0].title}</div>:<div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(91,61,245,0.15)",border:"1px solid rgba(139,92,246,0.35)",borderRadius:99,padding:"5px 16px",fontSize:12,color:"#a78bfa",marginBottom:28,fontWeight:500}}>{courses.length} cohorts · {courses.filter(c=>c.free).length} free · AI-first</div>}
        <h1 style={{fontSize:50,fontWeight:700,lineHeight:1.12,margin:"0 0 20px",letterSpacing:"-0.03em",color:"#F8FAFC"}}>Bridge the gap between talent and<br/><span style={{color:"#818CF8"}}>AI-driven opportunities.</span></h1>
        <p style={{fontSize:17,color:"#94A3B8",lineHeight:1.75,margin:"0 auto 36px",maxWidth:520}}>Learn AI, Product, and System Design with real mentorship — built for Tier-2 and Tier-3 India.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:48}}>
          <button onClick={()=>setShowAuth(true)} style={{padding:"13px 28px",borderRadius:12,background:P,border:"none",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer"}}>Start Free Course</button>
          <button onClick={()=>setPage("courses")} style={{padding:"13px 28px",borderRadius:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#E2E8F0",fontSize:15,fontWeight:500,cursor:"pointer"}}>Explore Cohorts</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:40,flexWrap:"wrap"}}>
          {[[totalEnrolled.toLocaleString()+"+","learners enrolled"],[courses.length+"+","live cohorts"],["4.9★","average rating"],["₹0","to get started"]].map(([v,l])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:"#A78BFA"}}>{v}</div><div style={{fontSize:12,color:"#64748B",marginTop:3}}>{l}</div></div>)}
        </div>
      </div>
    </section>
    <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px"}}>
      <section style={{padding:"60px 0 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
          <div><div style={{fontSize:22,fontWeight:500}}>Featured Batches</div><div style={{fontSize:13,color:G,marginTop:4}}>Live cohorts with Shobhit — learn by doing</div></div>
          <Btn variant="outline" small onClick={()=>setPage("courses")}>View all {courses.length}</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>{featured.map(c=><CourseCard key={c.id} c={c}/>)}</div>
      </section>
      <section style={{background:`linear-gradient(135deg,${PL},#f0fdf4)`,borderRadius:20,padding:"40px 36px",marginBottom:48,display:"flex",gap:32,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{width:80,height:80,borderRadius:20,background:`linear-gradient(135deg,${P},${PD})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:30,fontWeight:700,flexShrink:0}}>S</div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontSize:11,fontWeight:500,color:P,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>From the Founder</div>
          <blockquote style={{fontSize:18,fontWeight:500,margin:"0 0 8px"}}>"I built Vestigia because I know what it takes to grow from a tier-2 city. Now I'm sharing everything."</blockquote>
          <div style={{fontSize:13,color:G}}>Shobhit Shubham Saxena · AI, Product & TPM Leader · Founded 2014</div>
        </div>
        <Btn variant="outline" onClick={()=>setPage("about")}>Read Story</Btn>
      </section>
      <section style={{paddingBottom:60}}>
        <div style={{fontSize:22,fontWeight:500,marginBottom:8,textAlign:"center"}}>What our learners say</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,marginTop:20}}>
          {TESTIMONIALS.map(t=><Card key={t.name}><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}><Avatar initials={t.av} size={38} color={P}/><div><div style={{fontSize:13,fontWeight:500}}>{t.name}</div><div style={{fontSize:11,color:G}}>{t.role}</div></div></div><div style={{fontSize:13,color:"#475569",lineHeight:1.6}}>"{t.text}"</div><div style={{marginTop:10}}>{[1,2,3,4,5].map(i=><Star key={i}/>)}</div></Card>)}
        </div>
      </section>
      <section style={{paddingBottom:60}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div style={{fontSize:22,fontWeight:500}}>Thought Leadership</div><Tag c={P} bg={PL}>Insights by Shobhit</Tag></div>
        {BLOGS.map(b=><div key={b.title} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:"0.5px solid #e2e8f0",gap:12,cursor:"pointer"}}><div><div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{b.title}</div><div style={{display:"flex",gap:10,alignItems:"center"}}><Tag c={P} bg={PL} small>{b.tag}</Tag><span style={{fontSize:11,color:G}}>{b.date} · {b.read} read</span></div></div><span style={{color:P,fontSize:18,flexShrink:0}}>›</span></div>)}
      </section>
      <section style={{background:`linear-gradient(135deg,${P},${PD})`,borderRadius:20,padding:"48px 36px",textAlign:"center",marginBottom:60,color:"#fff"}}>
        <div style={{fontSize:26,fontWeight:600,marginBottom:10}}>Ready to stay ahead?</div>
        <div style={{fontSize:14,color:"#c4b5fd",marginBottom:28}}>Join {totalEnrolled.toLocaleString()}+ professionals learning AI, Product & TPM</div>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={()=>setPage("courses")} style={{background:"#fff",color:P,border:"none"}}>Browse Courses</Btn>
          <Btn onClick={()=>setShowAuth(true)} style={{border:"1.5px solid rgba(255,255,255,0.4)",color:"#fff",background:"transparent"}}>Join Free</Btn>
        </div>
      </section>
    </div>
  </div>;
}

/* ─── COURSES ───────────────────────────────────────────── */
function CoursesPage(){
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
    <div style={{marginBottom:24}}><h1 style={{fontSize:26,fontWeight:500,marginBottom:4}}>Course Marketplace</h1><div style={{fontSize:14,color:G}}>{courses.length} batches · {courses.filter(c=>c.free).length} free · {courses.filter(c=>batchStatus(c)==="live").length} live now</div></div>
    <div style={{position:"relative",marginBottom:16}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses, tags, instructors..." style={{width:"100%",padding:"11px 16px 11px 42px",borderRadius:12,border:"1.5px solid #e2e8f0",fontSize:14,background:"#f8fafc",boxSizing:"border-box"}}/>
      <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,pointerEvents:"none",color:G}}>⌕</span>
      {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:G,fontSize:18}}>×</button>}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>{allTags.map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 18px",borderRadius:20,border:`1.5px solid ${filter===f?P:"#e2e8f0"}`,background:filter===f?PL:"transparent",color:filter===f?P:G,fontSize:13,cursor:"pointer",fontWeight:filter===f?500:400}}>{f}</button>)}</div>
    {shown.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:G}}><div style={{fontSize:32,marginBottom:12}}>⌕</div><div style={{fontSize:16,fontWeight:500}}>No courses found</div><button onClick={()=>{setSearch("");setFilter("All");}} style={{color:P,background:"none",border:"none",cursor:"pointer",fontSize:13,marginTop:8}}>Clear filters</button></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>{shown.map(c=><CourseCard key={c.id} c={c}/>)}</div>
  </div>;
}

/* ─── ABOUT ─────────────────────────────────────────────── */
function AboutPage({setPage,setShowAuth}){
  const tl=[{year:"2014",title:"Founded Vestigia",desc:"Software & web dev for tier-2 cities",c:P},{year:"2018",title:"Scaled to 50+ clients",desc:"SMBs, startups and government orgs",c:T},{year:"2021",title:"Pivoted to AI & EdTech",desc:"Recognized the talent gap in emerging India",c:A},{year:"2024",title:"Vestigia Reborn",desc:"AI-first LMS + personal brand platform",c:P},{year:"2025",title:"10,000+ Learners",desc:"India's leading founder-led EdTech platform",c:T}];
  return<div style={{maxWidth:860,margin:"0 auto",padding:"40px 24px"}}>
    <div style={{textAlign:"center",marginBottom:48}}>
      <img src="/logo.png" alt="Vestigia" style={{height:90,width:90,objectFit:"contain",borderRadius:20,margin:"0 auto 20px",display:"block"}}/>
      <div style={{display:"inline-block",background:`linear-gradient(135deg,${P},${PD})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:28,fontWeight:700,marginBottom:8}}>Vestigia Technologies 2.0</div>
      <div style={{fontSize:16,color:G,marginBottom:6,fontStyle:"italic"}}>The Rebirth of Intelligence</div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:14}}>{["AI Solutions","EdTech","Product","TPM","Systems Design"].map(t=><Tag key={t} c={P} bg={PL}>{t}</Tag>)}</div>
    </div>
    <Card style={{marginBottom:24}}>
      <div style={{fontSize:13,fontWeight:500,color:P,letterSpacing:1,textTransform:"uppercase",marginBottom:16}}>Our Story</div>
      <p style={{fontSize:14,lineHeight:1.9,color:"#475569",margin:"0 0 14px"}}>Vestigia Technologies was born in 2014 from a bold vision by <strong>Shobhit Shubham Saxena</strong> — to empower tier-2 and tier-3 cities with the power of digital innovation.</p>
      <p style={{fontSize:14,lineHeight:1.9,color:"#475569",margin:"0 0 14px"}}>Today, that vision has evolved. Welcome to <strong>Vestigia Technologies 2.0</strong> — a rebirth fueled by Artificial Intelligence, driven by purpose, and built for the future.</p>
      <p style={{fontSize:14,lineHeight:1.9,color:"#475569",margin:0}}>We are no longer just building software — we are engineering intelligence. From cutting-edge AI solutions to next-generation EdTech platforms and job-ready learning ecosystems, Vestigia is redefining how talent meets technology in an AI-first world.</p>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginBottom:24}}>
      {[["🧠","Engineering Intelligence","Cutting-edge AI solutions built for real-world impact"],["🎓","Future-proof Learning","Next-gen EdTech platforms and job-ready ecosystems"],["🚀","Speed of Thought","Innovation that moves as fast as ideas do"]].map(([icon,title,desc])=><Card key={title}><div style={{fontSize:28,marginBottom:10}}>{icon}</div><div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{title}</div><div style={{fontSize:13,color:G,lineHeight:1.7}}>{desc}</div></Card>)}
    </div>
    <Card style={{marginBottom:24,background:`linear-gradient(135deg,${P}11,${PD}08)`}}>
      <div style={{fontSize:13,fontWeight:500,color:P,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Our Mission</div>
      <p style={{fontSize:15,lineHeight:1.9,color:DARK,margin:0,fontWeight:500}}>To bridge the gap between human potential and machine intelligence — creating powerful, scalable solutions that transform lives, businesses, and communities.</p>
    </Card>
    <div style={{marginBottom:32}}>
      <h2 style={{fontSize:18,fontWeight:500,marginBottom:20}}>Our Journey</h2>
      {tl.map((t,i)=><div key={t.year} style={{display:"flex",gap:16,marginBottom:20}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:t.c+"22",color:t.c,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{t.year.slice(2)}</div>
          {i<tl.length-1&&<div style={{width:1,flex:1,background:"#e2e8f0",margin:"4px 0"}}/>}
        </div>
        <div style={{paddingTop:6,paddingBottom:16}}><div style={{fontSize:14,fontWeight:500}}>{t.title}</div><div style={{fontSize:13,color:G}}>{t.desc}</div></div>
      </div>)}
    </div>
    <div style={{textAlign:"center",padding:"36px",background:`linear-gradient(135deg,${P},${PD})`,borderRadius:16,color:"#fff"}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:8}}>This is not an upgrade. This is a transformation.</div>
      <div style={{fontSize:14,opacity:0.85,marginBottom:6}}>Stay ahead. Stay intelligent. Stay Vestigia.</div>
      <div style={{fontSize:13,opacity:0.7,marginBottom:24}}>Where ideas become intelligent systems. Where learning becomes future-proof.</div>
      <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={()=>setPage("courses")} style={{padding:"10px 24px",borderRadius:10,background:"#fff",border:"none",color:P,fontSize:13,fontWeight:600,cursor:"pointer"}}>Explore Courses</button>
        <button onClick={()=>setShowAuth(true)} style={{padding:"10px 24px",borderRadius:10,background:"transparent",border:"1.5px solid rgba(255,255,255,0.6)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Join Free</button>
      </div>
    </div>
  </div>;
}
/* ─── DASHBOARD ─────────────────────────────────────────── */
function Dashboard({setPage}){
  const{state,dispatch}=useApp();
  const{user,courses,enrollments,waitlist}=state;
  const[aiOpen,setAiOpen]=useState(false);
  const[aiMsg,setAiMsg]=useState("");
  const[aiChat,setAiChat]=useState([{role:"ai",msg:"Hi! I'm your Vestigia AI. Ask about courses, career paths, or what to study next."}]);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiRem,setAiRem]=useState(AI_DAILY);
  const chatEndRef=useRef();
  const myE=enrollments.filter(e=>e.userId===user?.id);
  const enrolledCourses=courses.filter(c=>myE.some(e=>e.courseId===c.id));
  const recs=getRecs(state);
  const liveNow=courses.filter(c=>batchStatus(c)==="live");
  const myWaitlist=waitlist.filter(w=>w.userId===user?.id);
  const inProgress=enrolledCourses.filter(c=>myE.find(e=>e.courseId===c.id)?.progress<100)[0];
  const inProgressE=inProgress?myE.find(e=>e.courseId===inProgress.id):null;

  const sendAI=async()=>{
    if(!aiMsg.trim()||aiLoading)return;
    const q=san(aiMsg);setAiMsg("");
    const{ok,rem}=await checkAiLimit(user.id);
    if(!ok){dispatch({type:"TOAST",v:{kind:"error",msg:`Daily AI limit reached (${AI_DAILY}/day).`}});return;}
    setAiRem(rem);
    setAiChat(p=>[...p.slice(-49),{role:"user",msg:q}]);
    setAiLoading(true);
    const systemPrompt=`You are Vestigia AI. Student: ${user.name}. Enrolled: ${enrolledCourses.map(c=>c.title).join(", ")||"none"}. Progress: ${myE.map(e=>{const c=courses.find(x=>x.id===e.courseId);return c?`${c.title} ${e.progress}%`:""}).filter(Boolean).join(", ")||"just started"}. Give concise personalized advice (2-3 sentences max).`;
    const reply=await aiProxy(aiChat.filter(m=>m.role==="user").slice(-3).map(m=>({role:"user",content:m.msg})),systemPrompt);
    setAiChat(p=>[...p.slice(-49),{role:"ai",msg:reply}]);
    setAiLoading(false);
    setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),50);
  };

  const continueLesson=(courseId)=>{
    const e=myE.find(en=>en.courseId===courseId);
    if(!e||e.progress>=100)return;
    const newPct=Math.min(100,e.progress+20);
    dispatch({type:"UPDATE_PROGRESS",userId:user.id,courseId,pct:newPct});
    dispatch({type:"TOAST",v:{kind:"success",msg:`Progress updated to ${newPct}%!`}});
  };

  return<div style={{maxWidth:1100,margin:"0 auto",padding:"32px 24px"}}>
    {(liveNow.length>0||inProgress)&&<div style={{background:`linear-gradient(135deg,${P}11,${B}11)`,border:`1.5px solid ${P}33`,borderRadius:14,padding:"16px 20px",marginBottom:24}}>
      <div style={{fontSize:11,fontWeight:600,color:P,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Your Next Action</div>
      {liveNow.length>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:inProgress?10:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:8,height:8,borderRadius:"50%",background:R,display:"inline-block"}}/><div><div style={{fontSize:14,fontWeight:500}}>{liveNow[0].title}</div><div style={{fontSize:12,color:G}}>Live now · {liveNow[0].speaker}</div></div></div>
        <Btn small onClick={()=>setPage("live")} style={{background:R,borderColor:R,color:"#fff"}}>Join Live</Btn>
      </div>}
      {inProgress&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{flex:1,marginRight:16}}><div style={{fontSize:14,fontWeight:500,marginBottom:6}}>Continue: {inProgress.title}</div><ProgressBar pct={inProgressE?.progress||0} color={inProgress.color}/><div style={{fontSize:11,color:G,marginTop:4}}>{inProgressE?.progress||0}% complete</div></div>
        <Btn small onClick={()=>continueLesson(inProgress.id)}>Continue →</Btn>
      </div>}
    </div>}

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:22,fontWeight:500,margin:0}}>Welcome back, {user?.name?.split(" ")[0]} {user?.avatar}</h1><div style={{fontSize:13,color:G}}>Keep your momentum going!</div></div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
      {[["Streak","7 🔥",A],["Study Hours","24h",P],["Enrolled",myE.length,T],["Certificates",myE.filter(e=>e.completed).length,B]].map(([l,v,c])=><div key={l} style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px"}}><div style={{fontSize:11,color:G,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:600,color:c}}>{v}</div></div>)}
    </div>

    <Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Learning Streak — 7 days</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Array.from({length:28},(_,i)=>{const active=i>=21;return <div key={i} style={{width:28,height:28,borderRadius:6,background:active?`${A}cc`:"#f1f5f9",border:i===27?`2px solid ${A}`:"none"}}/>;})}</div>
      <div style={{fontSize:11,color:G,marginTop:8}}>7-day streak · Longest: 14 days</div>
    </Card>

    {myWaitlist.length>0&&<Card style={{marginBottom:20,background:AL,border:`1px solid ${A}33`}}>
      <div style={{fontSize:13,fontWeight:500,color:A,marginBottom:10}}>Your Waitlist Positions</div>
      {myWaitlist.map(w=>{const c=courses.find(x=>x.id===w.courseId);const pos=waitlist.filter(x=>x.courseId===w.courseId).findIndex(x=>x.userId===user.id)+1;return c?<div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"0.5px solid #e2e8f0"}}><div style={{fontSize:13}}>{c.title}</div><Tag c={A} bg={AL}>#{pos} in queue</Tag></div>:null;})}
    </Card>}

    {enrolledCourses.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:"#f8fafc",borderRadius:14,marginBottom:24}}>
      <div style={{fontSize:32,marginBottom:12}}>📚</div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:8}}>Start your learning journey</div>
      <div style={{fontSize:13,color:G,marginBottom:16}}>Browse free courses — no credit card needed.</div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>{courses.filter(c=>c.free).slice(0,2).map(c=><div key={c.id} onClick={()=>dispatch({type:"SET_PDP",v:c})} style={{background:"#fff",border:`1px solid ${c.color}33`,borderRadius:10,padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:20}}>{c.img}</span><div style={{textAlign:"left"}}><div style={{fontSize:12,fontWeight:500}}>{c.title.split(":")[0]}</div><Tag c={T} bg={TL} small>Free</Tag></div></div>)}</div>
      <Btn onClick={()=>setPage("courses")}>Browse All Courses</Btn>
    </div>}

    {recs.length>0&&<div style={{marginBottom:24}}><div style={{fontSize:16,fontWeight:500,marginBottom:4}}>Recommended for you</div><div style={{fontSize:12,color:G,marginBottom:14}}>Based on your learning history</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>{recs.map(c=><CourseCard key={c.id} c={c}/>)}</div></div>}

    <div style={{fontSize:16,fontWeight:500,marginBottom:14}}>My Courses</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginBottom:24}}>
      {enrolledCourses.map(c=><CourseCard key={c.id} c={c} dashboard/>)}
      {enrolledCourses.length>0&&<div onClick={()=>setPage("courses")} role="button" tabIndex={0} style={{background:PL+"44",border:`1.5px dashed ${P}44`,borderRadius:14,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:180,cursor:"pointer"}}><div style={{fontSize:28,marginBottom:8}}>+</div><div style={{fontSize:13,color:P,fontWeight:500}}>Browse more batches</div></div>}
    </div>

    {myE.filter(e=>e.completed).length>0&&<Card style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:500,marginBottom:12}}>Certificates Earned</div>
      {myE.filter(e=>e.completed).map(e=>{const c=courses.find(x=>x.id===e.courseId);return c?<div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #e2e8f0"}}><div><div style={{fontSize:13,fontWeight:500}}>{c.title}</div><div style={{fontSize:11,color:G}}>Completed</div></div><Btn small variant="outline">Download PDF</Btn></div>:null;})}
    </Card>}

    <div style={{position:"fixed",bottom:24,right:24,zIndex:50}}>
      {aiOpen&&<div style={{position:"absolute",bottom:64,right:0,width:320,background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.1)"}}>
        <div style={{background:P,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:"#fff",fontSize:14,fontWeight:500}}>Vestigia AI</div><div style={{color:"#c4b5fd",fontSize:10}}>{aiRem} messages left today</div></div>
          <button onClick={()=>setAiOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:18}}>×</button>
        </div>
        <div style={{height:240,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
          {aiChat.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"80%",padding:"8px 12px",borderRadius:12,background:m.role==="user"?P:PL,color:m.role==="user"?"#fff":P,fontSize:13,lineHeight:1.5}}>{m.msg}</div></div>)}
          {aiLoading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{background:PL,borderRadius:12,padding:"8px 12px",color:P,fontSize:13}}>Thinking...</div></div>}
          <div ref={chatEndRef}/>
        </div>
        <div style={{padding:"10px 12px",borderTop:"0.5px solid #e2e8f0",display:"flex",gap:8}}>
          <input value={aiMsg} onChange={e=>setAiMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendAI()} placeholder="Ask anything..." style={{flex:1,padding:"8px 12px",borderRadius:8,border:"0.5px solid #e2e8f0",fontSize:13,background:"#f8fafc"}}/>
          <button onClick={sendAI} disabled={aiLoading||aiRem<=0} style={{width:34,height:34,borderRadius:8,background:P,border:"none",color:"#fff",cursor:"pointer",fontSize:16,opacity:aiLoading?.6:1}}>↑</button>
        </div>
      </div>}
      <button onClick={()=>setAiOpen(o=>!o)} style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${P},${PD})`,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 16px rgba(91,61,245,0.4)"}}>AI</button>
    </div>
  </div>;
}

/* ─── LIVE CLASS ─────────────────────────────────────────── */
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
      <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:8,height:8,borderRadius:"50%",background:started?R:A,display:"inline-block"}}/><span style={{fontSize:11,color:started?R:A,fontWeight:500}}>{started?"LIVE":"STARTING SOON"}</span><span style={{fontSize:14,fontWeight:500}}>AI PM Masterclass — Module 4: Metrics & OKRs</span></div><div style={{fontSize:12,color:G,marginTop:2}}>Shobhit Saxena · 347 watching</div></div>
      <Btn variant="outline" small onClick={()=>setPage("dashboard")}>← Dashboard</Btn>
    </div>
    {!started&&<div style={{background:"#f8fafc",borderRadius:14,padding:"40px 24px",textAlign:"center",marginBottom:16}}>
      <div style={{fontSize:32,marginBottom:12}}>⏱</div>
      <div style={{fontSize:18,fontWeight:500,marginBottom:8}}>Class starts in a moment</div>
      <div style={{fontSize:13,color:G,marginBottom:20}}>Shobhit will go live soon. Check your audio and video settings.</div>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
        <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:10,padding:"12px 20px",fontSize:13}}><div style={{fontSize:10,color:G,marginBottom:4}}>Today's topic</div><strong>Metrics & OKRs for AI Products</strong></div>
        <div style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:10,padding:"12px 20px",fontSize:13}}><div style={{fontSize:10,color:G,marginBottom:4}}>Duration</div><strong>~60 minutes</strong></div>
      </div>
      <Btn onClick={()=>setStarted(true)}>Enter Classroom</Btn>
    </div>}
    {started&&<div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16,alignItems:"start"}}>
      <div>
        <div style={{background:"#0f0a2e",borderRadius:14,aspectRatio:"16/9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#fff",position:"relative",overflow:"hidden",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:500,color:"#c4b5fd",marginBottom:8}}>Zoom SDK embedded here in production</div>
          <div style={{fontSize:13,color:"#8b7cc8"}}>AI PM Masterclass · Module 4</div>
          <div style={{position:"absolute",bottom:14,left:14,display:"flex",gap:8}}>
            {[["MIC"],["CAM"],["SCR"],["HAND"]].map(([l])=><button key={l} style={{width:36,height:36,borderRadius:8,background:"rgba(255,255,255,0.1)",border:"none",cursor:"pointer",fontSize:9,color:"#fff"}}>{l}</button>)}
          </div>
          <div style={{position:"absolute",top:12,right:12}}><Tag c="#fff" bg="rgba(220,38,38,0.7)">LIVE · 347</Tag></div>
        </div>
        <Card>
          <div style={{fontSize:13,fontWeight:500,color:P,marginBottom:10}}>Live Poll: Best prioritization framework?</div>
          {pollOpts.map(o=><div key={o.l} onClick={()=>!pollVote&&setPollVote(o.l)} style={{marginBottom:8,cursor:pollVote?"default":"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:pollVote===o.l?500:400,color:pollVote===o.l?P:"#1e293b"}}>{o.l}</span>{pollVote&&<span style={{fontSize:12,color:G}}>{o.v}%</span>}</div>
            <div style={{background:"#f1f5f9",borderRadius:99,height:8,overflow:"hidden"}}>{pollVote&&<div style={{width:`${o.v}%`,height:"100%",background:pollVote===o.l?P:P+"44",borderRadius:99,transition:"width 0.6s"}}/>}</div>
          </div>)}
        </Card>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"0.5px solid #e2e8f0"}}>
          {["chat","leaderboard"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px",border:"none",background:tab===t?P:"#f8fafc",color:tab===t?"#fff":G,fontSize:12,cursor:"pointer"}}>{t==="chat"?"Chat":"Board"}</button>)}
        </div>
        {tab==="chat"&&<Card style={{padding:0,overflow:"hidden"}}>
          <div ref={chatRef} style={{height:260,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
            {chat.map((m,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}><Avatar initials={m.av} size={28} color={m.isMe?P:T}/><div><div style={{fontSize:11,fontWeight:500,color:m.isMe?P:T}}>{m.user} <span style={{color:G,fontWeight:400}}>{m.time}</span></div><div style={{fontSize:13,color:"#475569"}}>{m.msg}</div></div></div>)}
          </div>
          <div style={{padding:"10px 12px",borderTop:"0.5px solid #e2e8f0",display:"flex",gap:8}}>
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Say something..." style={{flex:1,padding:"7px 10px",borderRadius:8,border:"0.5px solid #e2e8f0",fontSize:12,background:"#f8fafc"}}/>
            <button onClick={send} style={{width:32,height:32,borderRadius:8,background:P,border:"none",color:"#fff",cursor:"pointer",fontSize:14}}>↑</button>
          </div>
        </Card>}
        {tab==="leaderboard"&&<Card><div style={{fontSize:12,color:G,marginBottom:12}}>Engagement Score</div>{LB.map(l=><div key={l.rank} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:10,background:l.isMe?PL:"transparent",marginBottom:4}}><div style={{width:24,fontSize:12,textAlign:"center",fontWeight:500,color:l.isMe?P:G}}>{l.badge||l.rank}</div><div style={{flex:1,fontSize:13,fontWeight:l.isMe?500:400,color:l.isMe?P:"#1e293b"}}>{l.name}</div><div style={{fontSize:12,color:G}}>{l.pts.toLocaleString()}</div></div>)}</Card>}
        <Card><div style={{fontSize:12,color:G,marginBottom:8}}>Reactions</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["🔥","👏","💡","❤️","🚀","👍"].map(r=><button key={r} onClick={()=>dispatch({type:"TOAST",v:{kind:"info",msg:`Reacted with ${r}`}})} style={{fontSize:20,background:"#f8fafc",border:"0.5px solid #e2e8f0",borderRadius:8,padding:"6px 8px",cursor:"pointer"}}>{r}</button>)}</div></Card>
      </div>
    </div>}
  </div>;
}

/* ─── ADMIN ─────────────────────────────────────────────── */
const EMPTY_FORM={title:"",tag:"",mrp:"",offerPrice:"",launch:"",start:"",speaker:"",linkedin:"",speakerPic:"",free:false};
const IS={width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,background:"#f8fafc",color:"#1e293b",boxSizing:"border-box"};
function Lbl({t,req,note}){return<label style={{fontSize:11,fontWeight:500,color:G,display:"block",marginBottom:4}}>{t}{req&&<span style={{color:R}}> *</span>}{note&&<span style={{fontSize:10,color:T,fontWeight:400}}>{" — "}{note}</span>}</label>;}

function AdminPanel(){
  const{state,dispatch}=useApp();
  if(!requireRole(state.user,"admin"))return<div style={{maxWidth:600,margin:"80px auto",textAlign:"center",padding:40}}><div style={{fontSize:32,marginBottom:16}}>🔒</div><div style={{fontSize:18,fontWeight:500,marginBottom:8}}>Access Denied</div><div style={{fontSize:13,color:G}}>Admin access required.</div></div>;
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
  const startEdit=c=>{setForm({title:c.title||"",tag:c.tag||"",mrp:String(c.mrp||""),offerPrice:String(c.offerPrice||""),launch:c.launch||"",start:c.start||"",speaker:c.speaker||"",linkedin:c.linkedin||"",speakerPic:c.speakerPic||"",free:!!c.free});setEditId(c.id);setErrs({});setConfirmRemove(null);document.getElementById("bf")?.scrollIntoView({behavior:"smooth",block:"start"});};
  const cancelEdit=()=>{setEditId(null);setForm(EMPTY_FORM);setErrs({});};
  const saveForm=()=>{if(!validate())return;const fields={title:san(form.title),tag:san(form.tag),mrp:Number(form.mrp),price:Number(form.offerPrice||form.mrp),offerPrice:form.offerPrice?Number(form.offerPrice):null,free:form.free||false,speaker:san(form.speaker),linkedin:okUrl(form.linkedin)?form.linkedin:"",speakerPic:okUrl(form.speakerPic)?form.speakerPic:"",launch:form.launch,start:form.start};if(editId){dispatch({type:"UPDATE_COURSE",id:editId,v:fields});dispatch({type:"TOAST",v:{kind:"success",msg:`"${fields.title}" updated!`}});setEditId(null);}else{const nb={...fields,id:Date.now(),enrolled:0,rating:0,img:"📚",color:P,status:"upcoming",weeks:6,modules:[],maxSeats:50};dispatch({type:"ADD_COURSE",v:nb});dispatch({type:"TOAST",v:{kind:"success",msg:`"${nb.title}" created!`}});setSaved(true);setTimeout(()=>setSaved(false),3000);}setForm(EMPTY_FORM);setErrs({});};
  const doRemove=c=>{dispatch({type:"REMOVE_COURSE",id:c.id});dispatch({type:"TOAST",v:{kind:"info",msg:`"${c.title}" removed.`}});setConfirmRemove(null);if(editId===c.id)cancelEdit();};
  const totalEnrolled=courses.reduce((s,c)=>s+c.enrolled,0);
  const paidE=enrollments.filter(e=>{const c=courses.find(x=>x.id===e.courseId);return c&&!c.free;});
  const revenue=paidE.reduce((s,e)=>{const c=courses.find(x=>x.id===e.courseId);return s+(c?.offerPrice||c?.price||0);},0);
  return<div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
      <div style={{width:36,height:36,borderRadius:10,background:R,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:600}}>A</div>
      <div><div style={{fontSize:18,fontWeight:500}}>Admin Panel</div><div style={{fontSize:12,color:G}}>Vestigia Technologies</div></div>
      <div style={{marginLeft:"auto"}}><Tag c={R} bg={RL}>Admin</Tag></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
      {[["Total Learners",totalEnrolled.toLocaleString(),P],["Batches",courses.length,T],["Paid Enrollments",paidE.length,A],["Revenue","₹"+revenue.toLocaleString(),B]].map(([l,v,c])=><div key={l} style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px"}}><div style={{fontSize:11,color:G,marginBottom:4}}>{l}</div><div style={{fontSize:18,fontWeight:600,color:c}}>{v}</div></div>)}
    </div>
    <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"0.5px solid #e2e8f0",marginBottom:20}}>
      {[["batches","Batches"],["schedule","Schedule"],["content","Content"],["certs","Certs"],["analytics","Analytics"]].map(([k,l])=><button key={k} onClick={()=>setAtab(k)} style={{flex:1,padding:"10px 8px",border:"none",background:atab===k?P:"#f8fafc",color:atab===k?"#fff":G,fontSize:11,cursor:"pointer",fontWeight:atab===k?500:400,minWidth:60}}>{l}</button>)}
    </div>
    {atab==="batches"&&<div>
      <Card style={{marginBottom:16}}>
        <div id="bf" style={{fontSize:14,fontWeight:500,marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:editId?A:"#1e293b"}}>{editId?"Editing Batch":"Create New Batch"}</span>
          {editId&&<Btn small variant="outline" onClick={cancelEdit}>Cancel</Btn>}
        </div>
        <div style={{fontSize:11,color:G,marginBottom:14}}>Fields marked <span style={{color:R}}>*</span> are mandatory</div>
        {Object.keys(errs).length>0&&<div style={{padding:"10px 14px",borderRadius:8,background:RL,color:R,fontSize:13,marginBottom:12}}>Please fix the highlighted fields.</div>}
        {saved&&<div style={{padding:"10px 14px",borderRadius:8,background:TL,color:"#065f46",fontSize:13,marginBottom:12}}>Batch created and published!</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><Lbl t="Batch Title" req/><input value={form.title} onChange={e=>fi("title",e.target.value)} placeholder="e.g. AI PM Masterclass" style={rs("title")}/></div>
          <div><Lbl t="Tag" req/><input value={form.tag} onChange={e=>fi("tag",e.target.value)} placeholder="e.g. AI, TPM" style={rs("tag")}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><Lbl t="MRP (₹)" req/><input type="number" value={form.mrp} onChange={e=>fi("mrp",e.target.value)} placeholder="8999" style={rs("mrp")}/></div>
          <div><Lbl t="Offer Price (₹)" note="optional — triggers strikethrough"/><input type="number" value={form.offerPrice} onChange={e=>fi("offerPrice",e.target.value)} placeholder="4999" style={IS}/></div>
        </div>
        {form.mrp&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:8,background:form.offerPrice?TL:PL,marginBottom:12}}><span style={{fontSize:11,color:G}}>Preview:</span>{form.offerPrice?<><span style={{fontSize:15,fontWeight:600,color:T}}>₹{Number(form.offerPrice).toLocaleString()}</span><span style={{fontSize:12,color:G,textDecoration:"line-through",marginLeft:4}}>₹{Number(form.mrp).toLocaleString()}</span><Tag c={T} bg={TL} small>Save ₹{(Number(form.mrp)-Number(form.offerPrice)).toLocaleString()}</Tag></>:<span style={{fontSize:15,fontWeight:600,color:P}}>₹{Number(form.mrp).toLocaleString()}</span>}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <div><Lbl t="Date of Launch" req/><input type="date" value={form.launch} onChange={e=>fi("launch",e.target.value)} style={rs("launch")}/></div>
          <div><Lbl t="Schedule Timestamp" req/><input type="datetime-local" value={form.start} onChange={e=>fi("start",e.target.value)} style={rs("start")}/></div>
        </div>
        {form.start&&<CountdownBadge target={form.start}/>}
        <div style={{border:"0.5px solid #e2e8f0",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:500,color:P,marginBottom:12}}>Speaker Details <span style={{fontSize:10,color:G,fontWeight:400}}>— all optional</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div><Lbl t="Speaker Name"/><input value={form.speaker} onChange={e=>fi("speaker",e.target.value)} placeholder="Shobhit Saxena" style={IS}/></div>
            <div><Lbl t="LinkedIn URL"/><input value={form.linkedin} onChange={e=>fi("linkedin",e.target.value)} placeholder="https://linkedin.com/in/..." style={rs("linkedin")}/>{errs.linkedin&&<div style={{fontSize:11,color:R,marginTop:2}}>Must be https://</div>}</div>
          </div>
          <Lbl t="Speaker Picture URL"/>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:52,height:52,borderRadius:12,background:PL,border:`2px dashed ${P}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,overflow:"hidden",color:P}}>{form.speakerPic&&okUrl(form.speakerPic)?<img src={form.speakerPic} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="" onError={e=>e.target.style.display="none"}/>:"Pic"}</div>
            <input value={form.speakerPic} onChange={e=>fi("speakerPic",e.target.value)} placeholder="https://..." style={rs("speakerPic")}/>
          </div>
          {errs.speakerPic&&<div style={{fontSize:11,color:R,marginTop:2}}>Must be https://</div>}
          {(form.speaker||form.linkedin)&&<SpeakerCard speaker={san(form.speaker)} linkedin={okUrl(form.linkedin)?form.linkedin:""} speakerPic={okUrl(form.speakerPic)?form.speakerPic:""} previewMode/>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={form.free} onChange={e=>fi("free",e.target.checked)}/> Free course</label>
          <div style={{flex:1}}/>
          <Btn small variant="outline" onClick={()=>{setForm(EMPTY_FORM);setErrs({});}}>Clear</Btn>
          <Btn small onClick={saveForm}>{editId?"Update Batch":"+ Create Batch"}</Btn>
        </div>
      </Card>
      <div style={{display:"grid",gap:8}}>
        {courses.map(c=>{
          const seatsUsed=enrollments.filter(e=>e.courseId===c.id).length;
          const impact=enrollments.filter(e=>e.courseId===c.id).length;
          return<div key={c.id}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:"#f8fafc",borderRadius:10,flexWrap:"wrap"}}>
              <span style={{fontSize:20,flexShrink:0}}>{c.img}</span>
              <div style={{flex:1,minWidth:140}}><div style={{fontSize:13,fontWeight:500}}>{c.title}</div><div style={{fontSize:11,color:G,display:"flex",gap:8,flexWrap:"wrap",marginTop:2}}><Tag c={c.color} bg={c.color+"22"} small>{c.tag}</Tag>{c.launch&&<span>{new Date(c.launch).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>}<span>{seatsUsed}/{c.maxSeats||"∞"} seats</span></div></div>
              <StatusBadge status={batchStatus(c)}/>
              <div style={{fontSize:13,fontWeight:500}}>{c.free?<span style={{color:T}}>Free</span>:c.offerPrice?<span><span style={{color:T}}>₹{Number(c.offerPrice).toLocaleString()}</span><span style={{fontSize:11,color:G,textDecoration:"line-through",marginLeft:4}}>₹{Number(c.mrp).toLocaleString()}</span></span>:<span style={{color:P}}>₹{Number(c.mrp||c.price||0).toLocaleString()}</span>}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Btn small variant="outline" onClick={()=>startEdit(c)} style={{borderColor:editId===c.id?A:undefined,color:editId===c.id?A:undefined}}>{editId===c.id?"Editing…":"Edit"}</Btn>
                {confirmRemove===c.id
                  ?<span style={{display:"flex",gap:4,alignItems:"center"}}><span style={{fontSize:11,color:R,whiteSpace:"nowrap"}}>Sure?</span><Btn small onClick={()=>doRemove(c)} style={{background:R,borderColor:R,color:"#fff"}}>Yes</Btn><Btn small variant="outline" onClick={()=>setConfirmRemove(null)}>No</Btn></span>
                  :<Btn small onClick={()=>setConfirmRemove(c.id)} style={{background:RL,color:R,border:"none"}}>Remove</Btn>}
              </div>
            </div>
            {impact>0&&confirmRemove===c.id&&<div style={{background:RL,border:`1px solid ${R}33`,borderRadius:10,padding:"10px 14px",marginTop:4}}><div style={{fontSize:12,color:R,marginBottom:8}}>{impact} enrolled student{impact!==1?"s":""} will lose access.</div></div>}
          </div>;
        })}
      </div>
    </div>}
    {atab==="schedule"&&<Card>
      <div style={{fontSize:14,fontWeight:500,marginBottom:16}}>Schedule Live Class</div>
      <div style={{display:"grid",gap:12}}>
        <select style={IS}>{courses.map(c=><option key={c.id}>{c.title}</option>)}</select>
        <input placeholder="Session title" style={IS}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><input type="datetime-local" style={IS}/><input placeholder="Zoom Webinar ID" style={IS}/></div>
        <Btn onClick={()=>dispatch({type:"TOAST",v:{kind:"success",msg:"Session scheduled!"}})}>Schedule & Notify Students</Btn>
      </div>
    </Card>}
    {atab==="content"&&<Card>
      <div style={{fontSize:14,fontWeight:500,marginBottom:16}}>Upload Content</div>
      <div style={{border:`2px dashed ${P}44`,borderRadius:12,padding:"32px",textAlign:"center",background:PL,marginBottom:16,cursor:"pointer"}}><div style={{fontSize:32,marginBottom:8}}>📂</div><div style={{fontSize:14,color:P,fontWeight:500}}>Drop files here or click to upload</div><div style={{fontSize:12,color:G,marginTop:4}}>PDF, MP4, PPT · Max 500MB</div></div>
      {[["Module 4 Notes.pdf","PDF",T],["Session 3 Recording.mp4","Video",B],["Week 2 Resources.zip","Freebie",A]].map(([n,t,c])=><div key={n} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f8fafc",borderRadius:8,marginBottom:8}}><Tag c={c} bg={c+"22"} small>{t}</Tag><div style={{flex:1,fontSize:13}}>{n}</div><Btn small variant="outline" onClick={()=>dispatch({type:"TOAST",v:{kind:"success",msg:`${n} published.`}})}>Publish</Btn></div>)}
    </Card>}
    {atab==="certs"&&<Card>
      <div style={{fontSize:14,fontWeight:500,marginBottom:16}}>Certificate Management</div>
      <div style={{background:AL,borderRadius:12,padding:"16px 18px",marginBottom:16}}><div style={{fontSize:13,fontWeight:500,color:A,marginBottom:10}}>Completion Criteria</div>{[["Minimum video watched","80"],["Quiz pass score","70"]].map(([l,d])=><label key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,marginBottom:8,gap:12}}><span>{l}</span><div style={{display:"flex",alignItems:"center",gap:8}}><input type="range" min={50} max={100} defaultValue={d}/><span style={{minWidth:36,fontWeight:500,color:A}}>{d}%</span></div></label>)}</div>
      {enrollments.filter(e=>e.completed).length===0?<div style={{textAlign:"center",padding:"24px",color:G,fontSize:13}}>No certificates issued yet.</div>:null}
    </Card>}
    {atab==="analytics"&&<div style={{display:"grid",gap:14}}>
      <Card><div style={{fontSize:14,fontWeight:500,marginBottom:14}}>Enrollments by batch</div>{courses.map(c=>{const max=Math.max(...courses.map(x=>x.enrolled),1);return<div key={c.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#475569",maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</span><span style={{fontWeight:500,color:c.color,flexShrink:0}}>{c.enrolled.toLocaleString()}</span></div><div style={{background:"#f1f5f9",borderRadius:99,height:6,overflow:"hidden"}}><div style={{width:`${Math.round((c.enrolled/max)*100)}%`,height:"100%",background:c.color,borderRadius:99}}/></div></div>;})}</Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card><div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Batch breakdown</div>{[["Total",courses.length,P],["Active",courses.filter(c=>batchStatus(c)==="active").length,T],["Upcoming",courses.filter(c=>batchStatus(c)==="upcoming").length,A],["Free",courses.filter(c=>c.free).length,B]].map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"0.5px solid #e2e8f0",fontSize:13}}><span style={{color:G}}>{l}</span><span style={{fontWeight:500,color:c}}>{v}</span></div>)}</Card>
        <Card><div style={{fontSize:13,fontWeight:500,marginBottom:8}}>Revenue summary</div><div style={{fontSize:28,fontWeight:600,color:T,marginBottom:4}}>₹{revenue.toLocaleString()}</div><div style={{fontSize:12,color:G,marginBottom:12}}>from {paidE.length} paid enrollments</div>{[["Free enrollments",enrollments.length-paidE.length,T],["Paid enrollments",paidE.length,P],["Avg order","₹"+(paidE.length?Math.round(revenue/paidE.length):0).toLocaleString(),A]].map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:12}}><span style={{color:G}}>{l}</span><span style={{fontWeight:500,color:c}}>{v}</span></div>)}</Card>
      </div>
    </div>}
  </div>;
}

/* ─── FOOTER ─────────────────────────────────────────────── */
function Footer({setPage}){
  return<footer style={{borderTop:"0.5px solid #e2e8f0",padding:"32px 24px",marginTop:24}}>
    <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
      <div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><img src="/logo.png" alt="Vestigia" style={{height:28,width:28,objectFit:"contain",borderRadius:7}}/><div style={{fontSize:14,fontWeight:500}}>Vestigia Technologies</div></div><div style={{fontSize:12,color:G,lineHeight:1.7,maxWidth:200}}>Bridging talent and technology. Founded 2014, reborn 2024.</div></div>
      {[["Platform",["Courses","Dashboard","Live Classes"]],["Company",["About Us","Blog","Careers"]],["Legal",["Privacy","Terms","Refunds"]]].map(([t,links])=><div key={t}><div style={{fontSize:12,fontWeight:500,marginBottom:10,color:"#1e293b"}}>{t}</div>{links.map(l=><div key={l} style={{fontSize:12,color:G,padding:"3px 0",cursor:"pointer"}}>{l}</div>)}</div>)}
    </div>
    <div style={{maxWidth:1100,margin:"16px auto 0",paddingTop:16,borderTop:"0.5px solid #e2e8f0",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:11,color:G}}>2025 Vestigia Technologies OPC Pvt Ltd.</div>
      <div style={{fontSize:11,color:G}}>Built for tier-2 India.</div>
    </div>
  </footer>;
}

/* ─── ERROR BOUNDARY ─────────────────────────────────────── */
class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  render(){if(this.state.error)return<div style={{padding:"40px 24px",textAlign:"center"}}><div style={{fontSize:24,marginBottom:12}}>⚠️</div><div style={{fontSize:16,fontWeight:500,marginBottom:8}}>Something went wrong</div><div style={{fontSize:13,color:G,marginBottom:16}}>{this.state.error.message}</div><button onClick={()=>this.setState({error:null})} style={{padding:"8px 20px",borderRadius:8,background:P,border:"none",color:"#fff",cursor:"pointer",fontSize:13}}>Try again</button></div>;return this.props.children;}
}

/* ─── ROOT ───────────────────────────────────────────────── */
function AppContent(){
  const{state,dispatch}=useApp();
  const[page,setPage]=useState("home");
  const[showAuth,setShowAuth]=useState(false);
  const go=useCallback((p)=>{
    if(p==="admin"&&!requireRole(state.user,"admin")){dispatch({type:"TOAST",v:{kind:"error",msg:"Admin access required."}});return;}
    if((p==="dashboard"||p==="live")&&!state.user){setShowAuth(true);return;}
    setPage(p);window.scrollTo?.(0,0);
  },[state.user]);
  if(!state.hydrated)return<div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:"#f8fafc"}}><div style={{height:60,borderBottom:"0.5px solid #e2e8f0",background:"#fff"}}/><div style={{maxWidth:1100,margin:"0 auto",padding:"60px 24px"}}><div style={{marginBottom:20}}><Skeleton h={28} w="40%"/></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>{[1,2,3].map(i=><div key={i} style={{background:"#fff",border:"0.5px solid #e2e8f0",borderRadius:14,padding:"18px 20px"}}><Skeleton h={90} r={10}/><div style={{height:12}}/><Skeleton h={14} w="65%"/><div style={{height:8}}/><Skeleton h={12} w="45%"/></div>)}</div></div></div>;
  return<div style={{fontFamily:"system-ui,-apple-system,sans-serif",minHeight:"100vh",background:"#fff",color:"#1e293b"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}*{box-sizing:border-box}body{margin:0}`}</style>
    <Nav page={page} setPage={go} setShowAuth={setShowAuth}/>
    {showAuth&&<AuthModal onClose={()=>setShowAuth(false)} onLogin={role=>{setShowAuth(false);go(role==="admin"?"admin":"dashboard");}}/>}
    <PDPModal/><PaymentModal/>
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:300,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none"}}>
      {state.toasts.map(t=><div key={t.id} style={{pointerEvents:"all"}}><ToastItem t={t}/></div>)}
    </div>
    <ErrorBoundary>
      {page==="home"&&<HomePage setPage={go} setShowAuth={setShowAuth}/>}
      {page==="courses"&&<CoursesPage/>}
      {page==="about"&&<AboutPage setPage={go} setShowAuth={setShowAuth}/>}
      {page==="dashboard"&&state.user&&<Dashboard setPage={go}/>}
      {page==="live"&&state.user&&<LiveClass setPage={go}/>}
      {page==="admin"&&requireRole(state.user,"admin")&&<AdminPanel/>}
    </ErrorBoundary>
    {page!=="live"&&<Footer setPage={go}/>}
  </div>;
}

export default function App(){
  return<AppProvider><AppContent/></AppProvider>;
}
