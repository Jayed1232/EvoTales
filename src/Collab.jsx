import { useState, useEffect, useRef } from 'react'
import { rtdb } from './firebase.js'
import { ref, set, get, onValue, push, update } from 'firebase/database'
import { uid } from './utils.js'

function genCode() { return 'EVO-'+Math.random().toString(36).substring(2,5).toUpperCase() }
function getUserProfile() { try { const p=localStorage.getItem('evo_user_profile'); return p?JSON.parse(p):null } catch { return null } }
function saveUserProfile(p) { localStorage.setItem('evo_user_profile',JSON.stringify(p)) }
function objToArr(obj) {
  if (!obj||typeof obj!=='object'||Array.isArray(obj)) return obj||[]
  return Object.entries(obj).map(([id,v])=>({id,...v}))
}

function BackBtn({ onClick, label='← Back' }) {
  return <button onClick={onClick} style={{ background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'6px 16px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer',flexShrink:0,letterSpacing:1 }}>{label}</button>
}

function HeaderBar({ left, center, right }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'rgba(13,10,26,0.97)',borderBottom:'1px solid var(--border)',flexShrink:0,position:'sticky',top:0,zIndex:10,backdropFilter:'blur(12px)' }}>
      {left}
      <div style={{ flex:1,overflow:'hidden' }}>{center}</div>
      {right}
    </div>
  )
}

function MBtn({ children, className, onClick, disabled, style }) {
  const r=useRef(null)
  const hm=(e)=>{ if(!r.current||disabled)return; const rect=r.current.getBoundingClientRect(); r.current.style.transform='translate('+(e.clientX-rect.left-rect.width/2)*0.3+'px,'+(e.clientY-rect.top-rect.height/2)*0.3+'px)' }
  const hl=()=>{ if(!r.current)return; r.current.style.transition='transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)'; r.current.style.transform='translate(0,0)'; setTimeout(()=>{ if(r.current)r.current.style.transition='' },500) }
  return <button ref={r} className={'magnet-btn '+(className||'')} onClick={onClick} disabled={disabled} style={style} onMouseMove={hm} onMouseLeave={hl}>{children}</button>
}

function SetupProfileModal({ onDone }) {
  const [name,setName]=useState('')
  const save=()=>{ if(!name.trim())return; const p={name:name.trim(),id:'USR-'+Math.random().toString(36).substring(2,8).toUpperCase(),createdAt:Date.now()}; saveUserProfile(p); onDone(p) }
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-drag"/>
        <div className="modal-title">✦ Writer Identity</div>
        <p style={{ fontSize:13,color:'var(--text2)',marginBottom:16,lineHeight:1.6 }}>Choose your writer name. This identifies you in collaborative stories.</p>
        <div className="form-group">
          <label className="form-label">Your Writer Name</label>
          <input className="form-input" placeholder="e.g. DarkScribe..." value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()} autoFocus/>
        </div>
        <MBtn className="btn btn-gold btn-full" onClick={save} disabled={!name.trim()}>Begin Your Legend ✦</MBtn>
      </div>
    </div>
  )
}

function ChatPanel({ sessionId, user, members, onClose }) {
  const [messages,setMessages]=useState([])
  const [text,setText]=useState('')
  const bottomRef=useRef(null)
  useEffect(()=>{ if(!rtdb||!sessionId)return; const r=ref(rtdb,'collab_sessions/'+sessionId+'/chat'); const unsub=onValue(r,snap=>{ const val=snap.val(); setMessages(val?objToArr(val).sort((a,b)=>a.ts-b.ts):[]) }); return ()=>unsub() },[sessionId])
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])
  const send=async()=>{ if(!text.trim()||!rtdb)return; await push(ref(rtdb,'collab_sessions/'+sessionId+'/chat'),{text:text.trim(),userId:user.id,userName:user.name,ts:Date.now()}); setText('') }
  return (
    <div style={{ position:'absolute',inset:0,zIndex:300,background:'var(--bg)',display:'flex',flexDirection:'column' }}>
      <HeaderBar left={<BackBtn onClick={onClose}/>} center={<div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)',letterSpacing:2 }}>⚡ COLLAB CHAT</div>}/>
      <div style={{ padding:'8px 16px',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:6 }}>
        {Object.values(members||{}).map(m=>(
          <div key={m.id} style={{ display:'flex',alignItems:'center',gap:4,fontSize:9,fontFamily:'Cinzel,serif',color:m.online?'#4caf50':'var(--text3)',padding:'3px 10px',borderRadius:20,border:'1px solid '+(m.online?'rgba(76,175,80,0.3)':'var(--border)') }}>
            <div style={{ width:5,height:5,borderRadius:'50%',background:m.online?'#4caf50':'var(--text3)' }}/>{m.name}
          </div>
        ))}
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:10 }}>
        {messages.length===0&&<div style={{ textAlign:'center',color:'var(--text3)',fontSize:13,marginTop:30 }}>No messages yet!</div>}
        {messages.map(m=>{ const isMe=m.userId===user.id; return (
          <div key={m.id} style={{ display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start' }}>
            <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',marginBottom:2 }}>{isMe?'You':m.userName}</div>
            <div style={{ maxWidth:'78%',padding:'10px 14px',borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',background:isMe?'rgba(201,168,76,0.15)':'var(--panel)',border:'1px solid '+(isMe?'rgba(201,168,76,0.3)':'var(--border)'),fontSize:14,color:'var(--text)',lineHeight:1.5 }}>{m.text}</div>
            <div style={{ fontSize:8,color:'var(--text3)',marginTop:2 }}>{new Date(m.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        )})}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:'12px 16px',borderTop:'1px solid var(--border)',display:'flex',gap:8 }}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type a message..." style={{ flex:1,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:20,padding:'10px 16px',color:'var(--text)',fontFamily:'Crimson Pro,serif',fontSize:14,outline:'none' }}/>
        <button onClick={send} style={{ background:'rgba(201,168,76,0.2)',border:'1px solid rgba(201,168,76,0.4)',borderRadius:'50%',width:40,height:40,color:'var(--gold2)',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>➤</button>
      </div>
    </div>
  )
}

function PartWriter({ sessionId, chapterId, part, user, canEdit, onBack, members }) {
  const [content,setContent]=useState(part.content||'')
  const [saving,setSaving]=useState(false)
  const [showChat,setShowChat]=useState(false)
  const timer=useRef(null)
  const save=async(val)=>{ if(!rtdb)return; setSaving(true); await update(ref(rtdb,'collab_sessions/'+sessionId+'/chapters/'+chapterId+'/parts/'+part.id),{content:val,lastEditBy:user.name,lastEditAt:Date.now()}); setSaving(false) }
  if(showChat) return <ChatPanel sessionId={sessionId} user={user} members={members} onClose={()=>setShowChat(false)}/>
  return (
    <div style={{ position:'absolute',inset:0,zIndex:250,background:'var(--bg)',display:'flex',flexDirection:'column' }}>
      <HeaderBar
        left={<BackBtn onClick={onBack}/>}
        center={<div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{part.title}</div>}
        right={<div style={{ display:'flex',gap:8,alignItems:'center' }}>{saving&&<span style={{ fontSize:9,color:'var(--text3)',fontFamily:'Cinzel,serif' }}>saving...</span>}<button onClick={()=>setShowChat(true)} style={{ background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,padding:'5px 12px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>💬 Chat</button></div>}
      />
      <textarea value={content} onChange={e=>{ setContent(e.target.value); clearTimeout(timer.current); timer.current=setTimeout(()=>save(e.target.value),1000) }} disabled={!canEdit} placeholder={canEdit?'Write this part...':'You are not assigned to write this part.'} style={{ flex:1,background:'var(--bg)',border:'none',padding:'24px 20px',color:'var(--text)',fontFamily:'Crimson Pro,serif',fontSize:17,lineHeight:1.9,resize:'none',outline:'none',opacity:canEdit?1:0.5 }}/>
      <div style={{ padding:'6px 20px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)',fontFamily:'Cinzel,serif' }}>
        <span>{content.trim()?content.trim().split(/\s+/).length:0} words</span>
        {part.lastEditBy&&<span>Last: {part.lastEditBy}</span>}
      </div>
    </div>
  )
}

function ChapterView({ sessionId, chapter, user, isOwner, onBack, members }) {
  const [parts,setParts]=useState([])
  const [activePart,setActivePart]=useState(null)
  const [showChat,setShowChat]=useState(false)
  const [newPartTitle,setNewPartTitle]=useState('')
  const [showAddPart,setShowAddPart]=useState(false)
  useEffect(()=>{ if(!rtdb)return; const r=ref(rtdb,'collab_sessions/'+sessionId+'/chapters/'+chapter.id+'/parts'); const unsub=onValue(r,snap=>{ const val=snap.val(); setParts(val?objToArr(val).sort((a,b)=>(a.order||0)-(b.order||0)):[]) }); return ()=>unsub() },[sessionId,chapter.id])
  const canEdit=isOwner||chapter.assignedTo===user.id||chapter.assignedTo==='all'
  const addPart=async()=>{ if(!newPartTitle.trim()||!rtdb)return; const pId=uid(); await set(ref(rtdb,'collab_sessions/'+sessionId+'/chapters/'+chapter.id+'/parts/'+pId),{id:pId,title:newPartTitle.trim(),content:'',order:parts.length,createdBy:user.name}); setNewPartTitle(''); setShowAddPart(false) }
  if(showChat) return <ChatPanel sessionId={sessionId} user={user} members={members} onClose={()=>setShowChat(false)}/>
  if(activePart) return <PartWriter sessionId={sessionId} chapterId={chapter.id} part={activePart} user={user} canEdit={canEdit} onBack={()=>setActivePart(null)} members={members}/>
  return (
    <div style={{ position:'absolute',inset:0,zIndex:220,background:'var(--bg)',display:'flex',flexDirection:'column' }}>
      <HeaderBar
        left={<BackBtn onClick={onBack}/>}
        center={<div style={{ fontFamily:'Cinzel,serif',fontSize:14,color:'var(--gold2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{chapter.title}</div>}
        right={<button onClick={()=>setShowChat(true)} style={{ background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,padding:'5px 12px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>💬 Chat</button>}
      />
      {!canEdit&&<div style={{ margin:'12px 16px',padding:'10px 14px',background:'rgba(193,18,31,0.1)',border:'1px solid rgba(193,18,31,0.3)',borderRadius:8,fontSize:12,color:'#ff6b6b',fontFamily:'Cinzel,serif' }}>⚠ Not assigned to you — read only.</div>}
      <div style={{ flex:1,overflowY:'auto',padding:'0 16px 20px' }}>
        {parts.length===0&&<div style={{ textAlign:'center',color:'var(--text3)',fontSize:13,padding:'40px 0' }}>No parts yet.{(isOwner||canEdit)?' Add one below!':''}</div>}
        {parts.map(p=>(
          <div key={p.id} onClick={()=>setActivePart(p)} style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px',marginBottom:10,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,transition:'all .2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'; e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='' }}>
            <div>
              <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)' }}>{p.title}</div>
              <div style={{ fontSize:11,color:'var(--text3)',marginTop:3 }}>{p.content?.split(/\s+/).filter(Boolean).length||0} words{p.lastEditBy&&' · '+p.lastEditBy}</div>
            </div>
            <div style={{ color:'var(--gold2)',fontSize:18 }}>▶</div>
          </div>
        ))}
        {(isOwner||canEdit)&&(showAddPart?(
          <div style={{ display:'flex',gap:8,marginTop:10 }}>
            <input value={newPartTitle} onChange={e=>setNewPartTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPart()} placeholder="Part title..." className="form-input" style={{ flex:1 }} autoFocus/>
            <MBtn className="btn btn-gold btn-sm" onClick={addPart}>Add</MBtn>
            <MBtn className="btn btn-outline btn-sm" onClick={()=>setShowAddPart(false)}>✕</MBtn>
          </div>
        ):(
          <MBtn className="btn btn-outline btn-full" style={{ marginTop:12 }} onClick={()=>setShowAddPart(true)}>+ Add Part</MBtn>
        ))}
      </div>
    </div>
  )
}

function SessionView({ session, user, onBack }) {
  const [chapters,setChapters]=useState([])
  const [members,setMembers]=useState({})
  const [activeChapter,setActiveChapter]=useState(null)
  const [showChat,setShowChat]=useState(false)
  const [notifications,setNotifications]=useState([])
  const [showAssign,setShowAssign]=useState(null)
  const [newChTitle,setNewChTitle]=useState('')
  const [showAddCh,setShowAddCh]=useState(false)
  const isOwner=session.ownerId===user.id

  useEffect(()=>{ if(!rtdb)return; const r=ref(rtdb,'collab_sessions/'+session.id+'/members/'+user.id); update(r,{id:user.id,name:user.name,online:true,lastSeen:Date.now()}); const off=()=>update(r,{online:false,lastSeen:Date.now()}); window.addEventListener('beforeunload',off); return ()=>{ off(); window.removeEventListener('beforeunload',off) } },[session.id])
  useEffect(()=>{ if(!rtdb)return; const r=ref(rtdb,'collab_sessions/'+session.id+'/chapters'); const unsub=onValue(r,snap=>{ const val=snap.val(); setChapters(val?objToArr(val).sort((a,b)=>(a.order||0)-(b.order||0)):[]) }); return ()=>unsub() },[session.id])
  useEffect(()=>{ if(!rtdb)return; const r=ref(rtdb,'collab_sessions/'+session.id+'/members'); const unsub=onValue(r,snap=>{ if(snap.val())setMembers(snap.val()) }); return ()=>unsub() },[session.id])
  useEffect(()=>{ if(!rtdb)return; const r=ref(rtdb,'collab_sessions/'+session.id+'/notifications'); const unsub=onValue(r,snap=>{ const val=snap.val(); setNotifications(val?objToArr(val).sort((a,b)=>b.ts-a.ts).slice(0,5):[]) }); return ()=>unsub() },[session.id])

  const addChapter=async()=>{ if(!newChTitle.trim()||!rtdb)return; const cId=uid(); await set(ref(rtdb,'collab_sessions/'+session.id+'/chapters/'+cId),{id:cId,title:newChTitle.trim(),parts:{},order:chapters.length,assignedTo:'all',createdBy:user.name}); await push(ref(rtdb,'collab_sessions/'+session.id+'/notifications'),{text:user.name+' added chapter: '+newChTitle.trim(),ts:Date.now()}); setNewChTitle(''); setShowAddCh(false) }
  const assignChapter=async(chId,memberId)=>{ await update(ref(rtdb,'collab_sessions/'+session.id+'/chapters/'+chId),{assignedTo:memberId}); setShowAssign(null) }
  const copyCode=()=>{ navigator.clipboard.writeText(session.code); alert('Invite code copied: '+session.code) }

  if(showChat) return <ChatPanel sessionId={session.id} user={user} members={members} onClose={()=>setShowChat(false)}/>
  if(activeChapter) return <ChapterView sessionId={session.id} chapter={activeChapter} user={user} isOwner={isOwner} onBack={()=>setActiveChapter(null)} members={members}/>

  return (
    <div style={{ position:'absolute',inset:0,zIndex:200,background:'var(--bg)',display:'flex',flexDirection:'column' }}>
      <HeaderBar
        left={<BackBtn onClick={onBack}/>}
        center={<div><div style={{ fontFamily:'Cinzel Decorative,serif',fontSize:13,color:'var(--gold2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{session.title}</div><div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:1,marginTop:1 }}>{isOwner?'OWNER':'COLLABORATOR'} · {Object.keys(members).length} members</div></div>}
        right={<div style={{ display:'flex',gap:8 }}><button onClick={copyCode} style={{ background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,padding:'5px 10px',color:'var(--gold)',fontFamily:'Cinzel,serif',fontSize:10,cursor:'pointer',letterSpacing:1 }}>{session.code}</button><button onClick={()=>setShowChat(true)} style={{ background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,padding:'5px 12px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>💬</button></div>}
      />
      <div style={{ flex:1,overflowY:'auto',padding:'0 16px 20px' }}>
        <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:12,marginBottom:8 }}>
          {Object.values(members).map(m=>(
            <div key={m.id} style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,border:'1px solid '+(m.online?'rgba(76,175,80,0.3)':'var(--border)'),background:m.online?'rgba(76,175,80,0.06)':'var(--bg2)',fontSize:10,fontFamily:'Cinzel,serif',color:m.online?'#4caf50':'var(--text3)' }}>
              <div style={{ width:6,height:6,borderRadius:'50%',background:m.online?'#4caf50':'var(--text3)' }}/>{m.name}{m.id===session.ownerId?' (Owner)':''}
            </div>
          ))}
        </div>
        {notifications.length>0&&(
          <div style={{ marginBottom:12,padding:'10px 14px',background:'rgba(201,168,76,0.05)',border:'1px solid rgba(201,168,76,0.15)',borderRadius:10 }}>
            <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--gold)',letterSpacing:2,marginBottom:6 }}>RECENT ACTIVITY</div>
            {notifications.map(n=><div key={n.id} style={{ fontSize:12,color:'var(--text2)',marginBottom:3 }}>✦ {n.text}</div>)}
          </div>
        )}
        <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:2,marginBottom:8 }}>CHAPTERS</div>
        {chapters.length===0&&<div style={{ textAlign:'center',color:'var(--text3)',fontSize:13,padding:'20px 0' }}>No chapters yet.{isOwner?' Add one below!':''}</div>}
        {chapters.map(ch=>{
          const assignedMember=ch.assignedTo&&ch.assignedTo!=='all'?members[ch.assignedTo]:null
          const canEdit=isOwner||ch.assignedTo===user.id||ch.assignedTo==='all'
          const partCount=ch.parts?(Array.isArray(ch.parts)?ch.parts.length:Object.keys(ch.parts).length):0
          return (
            <div key={ch.id} style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px',marginBottom:10,position:'relative' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8 }}>
                <div style={{ flex:1,cursor:'pointer' }} onClick={()=>setActiveChapter(ch)}>
                  <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)' }}>{ch.title}</div>
                  <div style={{ fontSize:11,color:'var(--text3)',marginTop:3 }}>{partCount} parts · {assignedMember?'→ '+assignedMember.name:'Open to all'}{!canEdit&&' · Read only'}</div>
                </div>
                <div style={{ display:'flex',gap:6,alignItems:'center',flexShrink:0 }}>
                  {isOwner&&<button onClick={()=>setShowAssign(showAssign===ch.id?null:ch.id)} style={{ fontSize:10,fontFamily:'Cinzel,serif',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:10,padding:'3px 10px',color:'var(--gold)',cursor:'pointer' }}>Assign</button>}
                  <div onClick={()=>setActiveChapter(ch)} style={{ fontSize:20,color:canEdit?'var(--gold2)':'var(--text3)',cursor:'pointer' }}>▶</div>
                </div>
              </div>
              {showAssign===ch.id&&isOwner&&(
                <div style={{ marginTop:10,padding:'10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8 }}>
                  <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:1,marginBottom:6 }}>ASSIGN TO</div>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {[{id:'all',name:'All Members'},...Object.values(members)].map(m=>(
                      <div key={m.id} onClick={()=>assignChapter(ch.id,m.id)} style={{ padding:'4px 12px',borderRadius:20,border:'1px solid '+(ch.assignedTo===m.id?'var(--gold)':'var(--border)'),background:ch.assignedTo===m.id?'rgba(201,168,76,0.1)':'transparent',color:ch.assignedTo===m.id?'var(--gold2)':'var(--text3)',fontSize:10,fontFamily:'Cinzel,serif',cursor:'pointer' }}>{m.name}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {isOwner&&(showAddCh?(
          <div style={{ display:'flex',gap:8,marginBottom:16 }}>
            <input value={newChTitle} onChange={e=>setNewChTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addChapter()} placeholder="Chapter title..." className="form-input" style={{ flex:1 }} autoFocus/>
            <MBtn className="btn btn-gold btn-sm" onClick={addChapter}>Add</MBtn>
            <MBtn className="btn btn-outline btn-sm" onClick={()=>setShowAddCh(false)}>✕</MBtn>
          </div>
        ):(
          <MBtn className="btn btn-outline btn-full" style={{ marginBottom:16 }} onClick={()=>setShowAddCh(true)}>+ Add Chapter</MBtn>
        ))}
      </div>
    </div>
  )
}

export default function CollabTab({ stories, online }) {
  const [user,setUser]=useState(()=>getUserProfile())
  const [sessions,setSessions]=useState([])
  const [activeSession,setActiveSession]=useState(null)
  const [showCreate,setShowCreate]=useState(false)
  const [showJoin,setShowJoin]=useState(false)
  const [joinCode,setJoinCode]=useState('')
  const [joinError,setJoinError]=useState('')
  const [selectedStory,setSelectedStory]=useState('')
  const [loading,setLoading]=useState(false)

  useEffect(()=>{ if(!user||!rtdb)return; const r=ref(rtdb,'collab_sessions'); const unsub=onValue(r,snap=>{ const val=snap.val(); if(!val){setSessions([]);return}; setSessions(objToArr(val).filter(s=>s.ownerId===user.id||(s.members&&s.members[user.id]))) }); return ()=>unsub() },[user])

  if(!user) return <SetupProfileModal onDone={p=>{ saveUserProfile(p); setUser(p) }}/>
  if(!online) return <div className="empty-state"><div className="empty-icon">📡</div><div className="empty-title">No Connection</div><div className="empty-desc">Collab requires internet connection.</div></div>
  if(activeSession) return <SessionView session={activeSession} user={user} onBack={()=>setActiveSession(null)}/>

  const createSession=async()=>{
    if(!selectedStory||!rtdb)return
    const story=stories.find(s=>s.id===selectedStory)
    if(!story)return
    setLoading(true)
    const sId=uid(), code=genCode()
    const chapters={}
    ;(story.chapters||[]).forEach((ch,idx)=>{
      const parts={}
      ;(ch.parts||[]).forEach((p,pi)=>{ const pid=p.id||uid(); parts[pid]={id:pid,title:p.title,content:p.content||'',order:pi} }); if(Object.keys(parts).length===0&&ch.content){ const pid=uid(); parts[pid]={id:pid,title:'Content',content:ch.content,order:0} }
      const cid=ch.id||uid()
      chapters[cid]={id:cid,title:ch.title,parts,order:idx,assignedTo:'all'}
    })
    const sessionData={id:sId,title:story.title,genre:story.genre,code,ownerId:user.id,ownerName:user.name,storyId:story.id,createdAt:Date.now(),members:{[user.id]:{id:user.id,name:user.name,online:true,role:'owner'}},chapters}
    await set(ref(rtdb,'collab_sessions/'+sId),sessionData)
    setLoading(false); setShowCreate(false); setSelectedStory(''); setActiveSession(sessionData)
  }

  const joinSession=async()=>{
    if(!joinCode.trim()||!rtdb)return
    setJoinError(''); setLoading(true)
    try {
      const snap=await get(ref(rtdb,'collab_sessions'))
      const val=snap.val()
      if(!val){setJoinError('Code not found.');setLoading(false);return}
      const found=objToArr(val).find(s=>s.code===joinCode.trim().toUpperCase())
      if(!found){setJoinError('Invalid code. Try again.');setLoading(false);return}
      await update(ref(rtdb,'collab_sessions/'+found.id+'/members/'+user.id),{id:user.id,name:user.name,online:true,role:'collaborator'})
      await push(ref(rtdb,'collab_sessions/'+found.id+'/notifications'),{text:user.name+' joined the story!',ts:Date.now()})
      setActiveSession(found); setShowJoin(false); setJoinCode('')
    } catch(e){setJoinError('Error joining. Try again.')}
    setLoading(false)
  }

  const publishedStories=stories.filter(s=>s.firebaseId)

  return (
    <div className="screen-fade" style={{ paddingBottom:80 }}>
      <div style={{ margin:'16px 20px',padding:'14px 16px',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:44,height:44,borderRadius:'50%',background:'radial-gradient(circle,#9b3dab,#2d1550)',border:'2px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontFamily:'Cinzel,serif',color:'var(--gold2)',flexShrink:0 }}>{user.name[0].toUpperCase()}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Cinzel,serif',fontSize:14,color:'var(--gold2)' }}>{user.name}</div>
          <div style={{ fontSize:10,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:1,marginTop:2 }}>{user.id}</div>
        </div>
        <button onClick={()=>{ if(window.confirm('Reset your writer name?')){localStorage.removeItem('evo_user_profile');setUser(null)} }} style={{ fontSize:10,fontFamily:'Cinzel,serif',color:'var(--text3)',background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'4px 10px',cursor:'pointer' }}>Edit</button>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'0 20px 16px' }}>
        <div onClick={()=>setShowCreate(true)} style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,padding:'18px',cursor:'pointer',transition:'all .2s',textAlign:'center' }} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          <div style={{ fontSize:26,marginBottom:6 }}>⚔</div>
          <div style={{ fontFamily:'Cinzel,serif',fontSize:11,color:'var(--gold2)',letterSpacing:1 }}>Start Session</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:3 }}>From published stories</div>
        </div>
        <div onClick={()=>setShowJoin(true)} style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,padding:'18px',cursor:'pointer',transition:'all .2s',textAlign:'center' }} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,212,255,0.4)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          <div style={{ fontSize:26,marginBottom:6 }}>🔗</div>
          <div style={{ fontFamily:'Cinzel,serif',fontSize:11,color:'var(--cyan)',letterSpacing:1 }}>Join Session</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:3 }}>Enter invite code</div>
        </div>
      </div>

      {sessions.length>0&&(
        <>
          <div style={{ padding:'0 20px',fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:2,marginBottom:8 }}>YOUR SESSIONS</div>
          {sessions.map(s=>(
            <div key={s.id} onClick={()=>setActiveSession(s)} style={{ margin:'0 20px 10px',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px',cursor:'pointer',transition:'all .2s',position:'relative',overflow:'hidden' }} onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ position:'absolute',top:0,left:'15%',right:'15%',height:1,background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }}/>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)' }}>{s.title}</div>
                  <div style={{ fontSize:10,color:'var(--text3)',marginTop:3,fontFamily:'Cinzel,serif' }}>{s.ownerId===user.id?'Owner':'Collaborator'} · {Object.keys(s.members||{}).length} members · {s.code}</div>
                </div>
                <div style={{ fontSize:20,color:'var(--gold2)' }}>▶</div>
              </div>
            </div>
          ))}
        </>
      )}

      {sessions.length===0&&!showCreate&&!showJoin&&(
        <div className="empty-state"><div className="empty-icon">🤝</div><div className="empty-title">No Sessions Yet</div><div className="empty-desc">Start a collab from your published story or join with a code.</div></div>
      )}

      {showCreate&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div className="modal">
            <div className="modal-drag"/>
            <div className="modal-title">⚔ Start Collab Session</div>
            <p style={{ fontSize:13,color:'var(--text2)',marginBottom:14,lineHeight:1.6 }}>Select a published story. Your chapters will be imported.</p>
            {publishedStories.length===0?(
              <div style={{ textAlign:'center',color:'var(--text3)',fontSize:13,padding:'20px 0' }}>No published stories yet. Publish one from Library first.</div>
            ):(
              <>
                <div className="form-group">
                  <label className="form-label">Select Story</label>
                  {publishedStories.map(s=>(
                    <div key={s.id} onClick={()=>setSelectedStory(s.id)} style={{ background:selectedStory===s.id?'rgba(201,168,76,0.08)':'var(--bg2)',border:'1px solid '+(selectedStory===s.id?'var(--gold)':'var(--border)'),borderRadius:8,padding:'10px 14px',marginBottom:8,cursor:'pointer' }}>
                      <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:selectedStory===s.id?'var(--gold2)':'var(--text)' }}>{s.title}</div>
                      <div style={{ fontSize:11,color:'var(--text3)',marginTop:2 }}>{s.genre} · {s.chapters?.length||0} chapters</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:10 }}>
                  <MBtn className="btn btn-outline" onClick={()=>setShowCreate(false)}>Cancel</MBtn>
                  <MBtn className="btn btn-gold" style={{ flex:1 }} disabled={!selectedStory||loading} onClick={createSession}>{loading?'⟳ Creating...':'Create Session ✦'}</MBtn>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showJoin&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowJoin(false)}>
          <div className="modal">
            <div className="modal-drag"/>
            <div className="modal-title">🔗 Join Collab Session</div>
            <p style={{ fontSize:13,color:'var(--text2)',marginBottom:14 }}>Enter the invite code shared by the story owner.</p>
            <div className="form-group">
              <label className="form-label">Invite Code</label>
              <input className="form-input" placeholder="EVO-XXX" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&joinSession()} autoFocus style={{ textTransform:'uppercase',letterSpacing:3,fontFamily:'Cinzel,serif',textAlign:'center',fontSize:18 }}/>
              {joinError&&<div style={{ fontSize:12,color:'#ff6b6b',marginTop:6,fontFamily:'Cinzel,serif' }}>{joinError}</div>}
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <MBtn className="btn btn-outline" onClick={()=>{ setShowJoin(false); setJoinCode(''); setJoinError('') }}>Cancel</MBtn>
              <MBtn className="btn btn-gold" style={{ flex:1 }} disabled={!joinCode.trim()||loading} onClick={joinSession}>{loading?'⟳ Joining...':'Join Session ✦'}</MBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
