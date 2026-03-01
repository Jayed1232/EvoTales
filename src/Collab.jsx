import { useState, useEffect, useRef } from 'react'
import { rtdb } from './firebase.js'
import { ref, set, get, onValue, push, update, remove, serverTimestamp } from 'firebase/database'
import { AFF_CLR, GRADE_CLR, calcStats, getTierName, ARCHETYPES, AFFINITIES, SPECIAL_AFFs, ALL_ELEMENTS, GRADES, ROLES } from './constants.js'
import { uid } from './utils.js'

const SKILL_TYPE_CLR = { Attack:'#ff4d4d', Buff:'#4caf50', Debuff:'#9b5de5' }

// ── UTILS ──────────────────────────────────────────────────────────────────
function genCode() {
  return 'EVO-' + Math.random().toString(36).substring(2,5).toUpperCase()
}

function getUserProfile() {
  try {
    const p = localStorage.getItem('evo_user_profile')
    return p ? JSON.parse(p) : null
  } catch { return null }
}

function saveUserProfile(profile) {
  localStorage.setItem('evo_user_profile', JSON.stringify(profile))
}

// ── MAGNET BUTTON (local copy to avoid import issues) ──────────────────────
function MBtn({ children, className, onClick, disabled, style }) {
  const ref2 = useRef(null)
  const hm = (e) => {
    if (!ref2.current || disabled) return
    const rect = ref2.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) * 0.3
    const dy = (e.clientY - rect.top - rect.height / 2) * 0.3
    ref2.current.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'
  }
  const hl = () => {
    if (!ref2.current) return
    ref2.current.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)'
    ref2.current.style.transform = 'translate(0,0)'
    setTimeout(() => { if (ref2.current) ref2.current.style.transition = '' }, 500)
  }
  return (
    <button ref={ref2} className={'magnet-btn ' + (className||'')} onClick={onClick} disabled={disabled} style={style} onMouseMove={hm} onMouseLeave={hl}>
      {children}
    </button>
  )
}

// ── SETUP PROFILE MODAL ────────────────────────────────────────────────────
function SetupProfileModal({ onDone }) {
  const [name, setName] = useState('')
  const save = () => {
    if (!name.trim()) return
    const profile = { name: name.trim(), id: 'USR-' + Math.random().toString(36).substring(2,8).toUpperCase(), createdAt: Date.now() }
    saveUserProfile(profile)
    onDone(profile)
  }
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">✦ Writer Identity</div>
        <p style={{ fontSize:13,color:'var(--text2)',marginBottom:16,lineHeight:1.6 }}>Choose your writer name. This will identify you in collaborative stories.</p>
        <div className="form-group">
          <label className="form-label">Your Writer Name</label>
          <input className="form-input" placeholder="e.g. DarkScribe..." value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()} autoFocus />
        </div>
        <MBtn className="btn btn-gold btn-full" onClick={save} disabled={!name.trim()}>Begin Your Legend ✦</MBtn>
      </div>
    </div>
  )
}

// ── CHAT PANEL ─────────────────────────────────────────────────────────────
function ChatPanel({ sessionId, user, members }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!rtdb || !sessionId) return
    const r = ref(rtdb, 'collab_sessions/' + sessionId + '/chat')
    const unsub = onValue(r, snap => {
      const val = snap.val()
      if (val) setMessages(Object.entries(val).map(([id,m]) => ({id,...m})).sort((a,b)=>a.ts-b.ts))
      else setMessages([])
    })
    return () => unsub()
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || !rtdb) return
    const r = ref(rtdb, 'collab_sessions/' + sessionId + '/chat')
    await push(r, { text: text.trim(), userId: user.id, userName: user.name, ts: Date.now() })
    setText('')
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',background:'var(--bg2)',borderLeft:'1px solid var(--border)' }}>
      <div style={{ padding:'12px 14px',borderBottom:'1px solid var(--border)',fontFamily:'Cinzel,serif',fontSize:11,color:'var(--gold2)',letterSpacing:2 }}>
        ⚡ COLLAB CHAT
      </div>

      {/* Online members */}
      <div style={{ padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:6 }}>
        {Object.values(members||{}).map(m => (
          <div key={m.id} style={{ display:'flex',alignItems:'center',gap:4,fontSize:9,fontFamily:'Cinzel,serif',color:m.online?'#4caf50':'var(--text3)',padding:'2px 8px',borderRadius:20,border:'1px solid '+(m.online?'rgba(76,175,80,0.3)':'var(--border)'),background:m.online?'rgba(76,175,80,0.06)':'transparent' }}>
            <div style={{ width:5,height:5,borderRadius:'50%',background:m.online?'#4caf50':'var(--text3)' }} />
            {m.name}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1,overflowY:'auto',padding:'10px 14px',display:'flex',flexDirection:'column',gap:8 }}>
        {messages.length===0 && <div style={{ textAlign:'center',color:'var(--text3)',fontSize:12,marginTop:20 }}>No messages yet. Start the conversation!</div>}
        {messages.map(m => {
          const isMe = m.userId === user.id
          return (
            <div key={m.id} style={{ display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start' }}>
              <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',marginBottom:2 }}>{isMe?'You':m.userName}</div>
              <div style={{ maxWidth:'80%',padding:'8px 12px',borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px',background:isMe?'rgba(201,168,76,0.15)':'var(--panel)',border:'1px solid '+(isMe?'rgba(201,168,76,0.3)':'var(--border)'),fontSize:13,color:'var(--text)',lineHeight:1.5 }}>
                {m.text}
              </div>
              <div style={{ fontSize:8,color:'var(--text3)',marginTop:2 }}>{new Date(m.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'10px 14px',borderTop:'1px solid var(--border)',display:'flex',gap:8 }}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Type a message..." style={{ flex:1,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:20,padding:'8px 14px',color:'var(--text)',fontFamily:'Crimson Pro,serif',fontSize:13,outline:'none' }} />
        <button onClick={send} style={{ background:'rgba(201,168,76,0.2)',border:'1px solid rgba(201,168,76,0.4)',borderRadius:'50%',width:36,height:36,color:'var(--gold2)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>➤</button>
      </div>
    </div>
  )
}

// ── CHAPTER WRITER VIEW ────────────────────────────────────────────────────
function CollabChapterWriter({ sessionId, chapter, user, isOwner, onBack }) {
  const [parts, setParts] = useState(chapter.parts || [])
  const [activePart, setActivePart] = useState(null)
  const [partContent, setPartContent] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [members, setMembers] = useState({})
  const [saving, setSaving] = useState(false)
  const [newPartTitle, setNewPartTitle] = useState('')
  const [showAddPart, setShowAddPart] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!rtdb) return
    const r = ref(rtdb, 'collab_sessions/' + sessionId + '/chapters/' + chapter.id + '/parts')
    const unsub = onValue(r, snap => {
      const val = snap.val()
      if (val) setParts(Object.entries(val).map(([id,p]) => ({id,...p})).sort((a,b) => (a.order||0)-(b.order||0)))
      else setParts([])
    })
    return () => unsub()
  }, [sessionId, chapter.id])

  useEffect(() => {
    if (!rtdb) return
    const r = ref(rtdb, 'collab_sessions/' + sessionId + '/members')
    const unsub = onValue(r, snap => { if (snap.val()) setMembers(snap.val()) })
    return () => unsub()
  }, [sessionId])

  useEffect(() => {
    if (activePart) {
      const p = parts.find(p => p.id === activePart)
      setPartContent(p?.content || '')
    }
  }, [activePart, parts])

  const saveContent = async (content) => {
    if (!rtdb || !activePart) return
    setSaving(true)
    await update(ref(rtdb, 'collab_sessions/' + sessionId + '/chapters/' + chapter.id + '/parts/' + activePart), { content, lastEditBy: user.name, lastEditAt: Date.now() })
    setSaving(false)
  }

  const addPart = async () => {
    if (!newPartTitle.trim() || !rtdb) return
    const pId = uid()
    await set(ref(rtdb, 'collab_sessions/' + sessionId + '/chapters/' + chapter.id + '/parts/' + pId), { id:pId, title:newPartTitle.trim(), content:'', order:parts.length, createdBy:user.name })
    setNewPartTitle('')
    setShowAddPart(false)
  }

  const canEdit = isOwner || chapter.assignedTo === user.id || chapter.assignedTo === 'all'

  if (activePart) {
    const part = parts.find(p => p.id === activePart)
    return (
      <div style={{ display:'flex',height:'100%',flexDirection:'column' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border)' }}>
          <button onClick={() => setActivePart(null)} style={{ background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'5px 14px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>← Back</button>
          <div style={{ flex:1,fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)' }}>{part?.title}</div>
          {saving && <div style={{ fontSize:10,color:'var(--text3)',fontFamily:'Cinzel,serif' }}>saving...</div>}
          <button onClick={() => setShowChat(!showChat)} style={{ background:showChat?'rgba(201,168,76,0.2)':'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,padding:'5px 12px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>💬</button>
        </div>
        <div style={{ flex:1,display:'flex',overflow:'hidden' }}>
          <textarea
            value={partContent}
            onChange={e => {
              setPartContent(e.target.value)
              clearTimeout(timer.current)
              timer.current = setTimeout(() => saveContent(e.target.value), 1000)
            }}
            disabled={!canEdit}
            placeholder={canEdit ? 'Write this part...' : 'You are not assigned to write this part.'}
            style={{ flex:1,background:'var(--bg)',border:'none',padding:'20px',color:'var(--text)',fontFamily:'Crimson Pro,serif',fontSize:16,lineHeight:1.9,resize:'none',outline:'none',opacity:canEdit?1:0.5 }}
          />
          {showChat && (
            <div style={{ width:280,flexShrink:0 }}>
              <ChatPanel sessionId={sessionId} user={user} members={members} />
            </div>
          )}
        </div>
        <div style={{ padding:'6px 16px',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--text3)',fontFamily:'Cinzel,serif' }}>
          <span>{partContent.trim() ? partContent.trim().split(/\s+/).length : 0} words</span>
          {part?.lastEditBy && <span>Last edited by {part.lastEditBy}</span>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex:1,overflowY:'auto' }}>
      <div style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border)' }}>
        <button onClick={onBack} style={{ background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'5px 14px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>← Back</button>
        <div style={{ flex:1,fontFamily:'Cinzel,serif',fontSize:14,color:'var(--gold2)' }}>{chapter.title}</div>
        <button onClick={() => setShowChat(!showChat)} style={{ background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,padding:'5px 12px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>💬 Chat</button>
      </div>

      {!canEdit && (
        <div style={{ margin:'12px 16px',padding:'10px 14px',background:'rgba(193,18,31,0.1)',border:'1px solid rgba(193,18,31,0.3)',borderRadius:8,fontSize:12,color:'#ff6b6b',fontFamily:'Cinzel,serif' }}>
          ⚠ You are not assigned to write this chapter. You can read but not edit.
        </div>
      )}

      <div style={{ padding:'0 16px' }}>
        {parts.length === 0 && <div style={{ textAlign:'center',color:'var(--text3)',fontSize:13,padding:'30px 0' }}>No parts yet. {(isOwner||canEdit)?'Add the first part!':''}</div>}
        {parts.map(p => (
          <div key={p.id} onClick={() => setActivePart(p.id)}
            style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px',marginBottom:10,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'; e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='' }}>
            <div>
              <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)' }}>{p.title}</div>
              <div style={{ fontSize:11,color:'var(--text3)',marginTop:3 }}>{p.content?.split(/\s+/).filter(Boolean).length||0} words {p.lastEditBy&&'· '+p.lastEditBy}</div>
            </div>
            <div style={{ color:'var(--text3)',fontSize:18 }}>▶</div>
          </div>
        ))}

        {(isOwner || canEdit) && (
          showAddPart ? (
            <div style={{ display:'flex',gap:8,marginTop:8 }}>
              <input value={newPartTitle} onChange={e=>setNewPartTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addPart()}
                placeholder="Part title..." className="form-input" style={{ flex:1 }} autoFocus />
              <MBtn className="btn btn-gold btn-sm" onClick={addPart}>Add</MBtn>
              <MBtn className="btn btn-outline btn-sm" onClick={() => setShowAddPart(false)}>✕</MBtn>
            </div>
          ) : (
            <MBtn className="btn btn-outline btn-full" style={{ marginTop:8 }} onClick={() => setShowAddPart(true)}>+ Add Part</MBtn>
          )
        )}
      </div>
    </div>
  )
}

// ── COLLAB SESSION VIEW ────────────────────────────────────────────────────
function CollabSessionView({ session, user, onBack }) {
  const [chapters, setChapters] = useState([])
  const [members, setMembers] = useState({})
  const [activeChapter, setActiveChapter] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showAssign, setShowAssign] = useState(null)
  const [newChTitle, setNewChTitle] = useState('')
  const [showAddCh, setShowAddCh] = useState(false)
  const isOwner = session.ownerId === user.id

  // Mark user online
  useEffect(() => {
    if (!rtdb) return
    const r = ref(rtdb, 'collab_sessions/' + session.id + '/members/' + user.id)
    update(r, { id:user.id, name:user.name, online:true, lastSeen:Date.now() })
    const off = () => update(r, { online:false, lastSeen:Date.now() })
    window.addEventListener('beforeunload', off)
    return () => { off(); window.removeEventListener('beforeunload', off) }
  }, [session.id])

  // Listen to chapters
  useEffect(() => {
    if (!rtdb) return
    const r = ref(rtdb, 'collab_sessions/' + session.id + '/chapters')
    const unsub = onValue(r, snap => {
      const val = snap.val()
      if (val) setChapters(Object.entries(val).map(([id,c]) => ({id,...c})).sort((a,b)=>(a.order||0)-(b.order||0)))
      else setChapters([])
    })
    return () => unsub()
  }, [session.id])

  // Listen to members
  useEffect(() => {
    if (!rtdb) return
    const r = ref(rtdb, 'collab_sessions/' + session.id + '/members')
    const unsub = onValue(r, snap => { if (snap.val()) setMembers(snap.val()) })
    return () => unsub()
  }, [session.id])

  // Listen to notifications
  useEffect(() => {
    if (!rtdb) return
    const r = ref(rtdb, 'collab_sessions/' + session.id + '/notifications')
    const unsub = onValue(r, snap => {
      const val = snap.val()
      if (val) {
        const all = Object.entries(val).map(([id,n]) => ({id,...n})).sort((a,b)=>b.ts-a.ts).slice(0,5)
        setNotifications(all)
      }
    })
    return () => unsub()
  }, [session.id])

  const addChapter = async () => {
    if (!newChTitle.trim() || !rtdb) return
    const cId = uid()
    await set(ref(rtdb, 'collab_sessions/' + session.id + '/chapters/' + cId), {
      id:cId, title:newChTitle.trim(), parts:{}, order:chapters.length,
      assignedTo:'all', createdBy:user.name
    })
    await push(ref(rtdb, 'collab_sessions/' + session.id + '/notifications'), {
      text: user.name + ' added chapter: ' + newChTitle.trim(), ts:Date.now()
    })
    setNewChTitle(''); setShowAddCh(false)
  }

  const assignChapter = async (chId, memberId) => {
    await update(ref(rtdb, 'collab_sessions/' + session.id + '/chapters/' + chId), { assignedTo: memberId })
    setShowAssign(null)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(session.code)
    alert('Code copied: ' + session.code)
  }

  if (activeChapter) {
    return (
      <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
        <CollabChapterWriter
          sessionId={session.id}
          chapter={activeChapter}
          user={user}
          isOwner={isOwner}
          onBack={() => setActiveChapter(null)}
        />
      </div>
    )
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10,flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:20,padding:'5px 14px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Cinzel Decorative,serif',fontSize:14,color:'var(--gold2)' }}>{session.title}</div>
          <div style={{ fontSize:10,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:1,marginTop:1 }}>{isOwner?'OWNER':'COLLABORATOR'} · {Object.keys(members).length} members</div>
        </div>
        <button onClick={copyCode} style={{ background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:8,padding:'5px 10px',color:'var(--gold)',fontFamily:'Cinzel,serif',fontSize:10,cursor:'pointer',letterSpacing:1 }}>{session.code}</button>
        <button onClick={() => setShowChat(!showChat)} style={{ background:showChat?'rgba(201,168,76,0.2)':'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:20,padding:'5px 12px',color:'var(--gold2)',fontFamily:'Cinzel,serif',fontSize:11,cursor:'pointer' }}>💬</button>
      </div>

      <div style={{ display:'flex',flex:1,overflow:'hidden' }}>
        {/* Main content */}
        <div style={{ flex:1,overflowY:'auto',padding:'0 16px' }}>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div style={{ margin:'12px 0',padding:'10px 14px',background:'rgba(201,168,76,0.05)',border:'1px solid rgba(201,168,76,0.15)',borderRadius:10 }}>
              <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--gold)',letterSpacing:2,marginBottom:6 }}>RECENT ACTIVITY</div>
              {notifications.map(n => (
                <div key={n.id} style={{ fontSize:12,color:'var(--text2)',marginBottom:4,fontFamily:'Crimson Pro,serif' }}>✦ {n.text}</div>
              ))}
            </div>
          )}

          {/* Online members */}
          <div style={{ margin:'12px 0',display:'flex',flexWrap:'wrap',gap:6 }}>
            {Object.values(members).map(m => (
              <div key={m.id} style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,border:'1px solid '+(m.online?'rgba(76,175,80,0.3)':'var(--border)'),background:m.online?'rgba(76,175,80,0.06)':'var(--bg2)',fontSize:10,fontFamily:'Cinzel,serif',color:m.online?'#4caf50':'var(--text3)' }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:m.online?'#4caf50':'var(--text3)' }} />
                {m.name} {m.id === session.ownerId && '(Owner)'}
              </div>
            ))}
          </div>

          {/* Chapters */}
          <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:2,margin:'10px 0 8px' }}>CHAPTERS</div>

          {chapters.length === 0 && <div style={{ textAlign:'center',color:'var(--text3)',fontSize:13,padding:'20px 0' }}>No chapters yet. {isOwner?'Add one below!':''}</div>}

          {chapters.map(ch => {
            const assignedMember = ch.assignedTo && ch.assignedTo !== 'all' ? members[ch.assignedTo] : null
            const canEdit = isOwner || ch.assignedTo === user.id || ch.assignedTo === 'all'
            return (
              <div key={ch.id} style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 16px',marginBottom:10,position:'relative' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div style={{ flex:1,cursor:'pointer' }} onClick={() => setActiveChapter(ch)}>
                    <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)' }}>{ch.title}</div>
                    <div style={{ fontSize:11,color:'var(--text3)',marginTop:3 }}>
                      {ch.parts ? Object.keys(ch.parts).length : 0} parts ·
                      {assignedMember ? ' Assigned to ' + assignedMember.name : ' Open to all'}
                      {!canEdit && ' · Read only for you'}
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                    {isOwner && (
                      <button onClick={() => setShowAssign(showAssign===ch.id?null:ch.id)}
                        style={{ fontSize:10,fontFamily:'Cinzel,serif',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',borderRadius:10,padding:'3px 8px',color:'var(--gold)',cursor:'pointer' }}>
                        Assign
                      </button>
                    )}
                    <div onClick={() => setActiveChapter(ch)} style={{ fontSize:18,color:canEdit?'var(--gold2)':'var(--text3)',cursor:'pointer' }}>▶</div>
                  </div>
                </div>

                {/* Assign dropdown */}
                {showAssign === ch.id && isOwner && (
                  <div style={{ marginTop:10,padding:'10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8 }}>
                    <div style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:1,marginBottom:6 }}>ASSIGN TO</div>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                      <div onClick={() => assignChapter(ch.id,'all')}
                        style={{ padding:'4px 10px',borderRadius:20,border:'1px solid '+(ch.assignedTo==='all'?'var(--gold)':'var(--border)'),background:ch.assignedTo==='all'?'rgba(201,168,76,0.1)':'transparent',color:ch.assignedTo==='all'?'var(--gold2)':'var(--text3)',fontSize:10,fontFamily:'Cinzel,serif',cursor:'pointer' }}>
                        All Members
                      </div>
                      {Object.values(members).map(m => (
                        <div key={m.id} onClick={() => assignChapter(ch.id, m.id)}
                          style={{ padding:'4px 10px',borderRadius:20,border:'1px solid '+(ch.assignedTo===m.id?'var(--gold)':'var(--border)'),background:ch.assignedTo===m.id?'rgba(201,168,76,0.1)':'transparent',color:ch.assignedTo===m.id?'var(--gold2)':'var(--text3)',fontSize:10,fontFamily:'Cinzel,serif',cursor:'pointer' }}>
                          {m.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add chapter */}
          {isOwner && (
            showAddCh ? (
              <div style={{ display:'flex',gap:8,marginBottom:16 }}>
                <input value={newChTitle} onChange={e=>setNewChTitle(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addChapter()}
                  placeholder="Chapter title..." className="form-input" style={{ flex:1 }} autoFocus />
                <MBtn className="btn btn-gold btn-sm" onClick={addChapter}>Add</MBtn>
                <MBtn className="btn btn-outline btn-sm" onClick={() => setShowAddCh(false)}>✕</MBtn>
              </div>
            ) : (
              <MBtn className="btn btn-outline btn-full" style={{ marginBottom:16 }} onClick={() => setShowAddCh(true)}>+ Add Chapter</MBtn>
            )
          )}
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div style={{ width:280,flexShrink:0 }}>
            <ChatPanel sessionId={session.id} user={user} members={members} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── MAIN COLLAB TAB ────────────────────────────────────────────────────────
export default function CollabTab({ stories, online }) {
  const [user, setUser] = useState(() => getUserProfile())
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [selectedStory, setSelectedStory] = useState('')
  const [loading, setLoading] = useState(false)

  // Load user's sessions
  useEffect(() => {
    if (!user || !rtdb) return
    const r = ref(rtdb, 'collab_sessions')
    const unsub = onValue(r, snap => {
      const val = snap.val()
      if (!val) { setSessions([]); return }
      const mine = Object.entries(val)
        .map(([id,s]) => ({id,...s}))
        .filter(s => s.ownerId===user.id || (s.members && s.members[user.id]))
      setSessions(mine)
    })
    return () => unsub()
  }, [user])

  if (!user) return <SetupProfileModal onDone={p => { saveUserProfile(p); setUser(p) }} />

  if (!online) return (
    <div className="empty-state">
      <div className="empty-icon">📡</div>
      <div className="empty-title">No Connection</div>
      <div className="empty-desc">Collab requires internet connection.</div>
    </div>
  )

  if (activeSession) {
    return (
      <div style={{ position:'fixed',inset:0,background:'var(--bg)',zIndex:200,display:'flex',flexDirection:'column' }}>
        <CollabSessionView session={activeSession} user={user} onBack={() => setActiveSession(null)} />
      </div>
    )
  }

  const createSession = async () => {
    if (!selectedStory || !rtdb) return
    const story = stories.find(s => s.id === selectedStory)
    if (!story) return
    setLoading(true)
    const sId = uid()
    const code = genCode()

    // Copy chapters from the story
    const chapters = {}
    ;(story.chapters || []).forEach((ch, idx) => {
      const parts = {}
      ;(ch.parts || []).forEach((p, pi) => {
        parts[p.id||uid()] = { id:p.id||uid(), title:p.title, content:p.content||'', order:pi }
      })
      chapters[ch.id||uid()] = { id:ch.id||uid(), title:ch.title, parts, order:idx, assignedTo:'all' }
    })

    const sessionData = {
      id: sId, title: story.title, genre: story.genre,
      code, ownerId: user.id, ownerName: user.name,
      storyId: story.id, createdAt: Date.now(),
      members: { [user.id]: { id:user.id, name:user.name, online:true, role:'owner' } },
      chapters
    }

    await set(ref(rtdb, 'collab_sessions/' + sId), sessionData)
    setLoading(false)
    setShowCreate(false)
    setSelectedStory('')
    setActiveSession(sessionData)
  }

  const joinSession = async () => {
    if (!joinCode.trim() || !rtdb) return
    setJoinError('')
    setLoading(true)
    try {
      const snap = await get(ref(rtdb, 'collab_sessions'))
      const val = snap.val()
      if (!val) { setJoinError('Code not found.'); setLoading(false); return }
      const found = Object.entries(val).find(([,s]) => s.code === joinCode.trim().toUpperCase())
      if (!found) { setJoinError('Invalid code. Try again.'); setLoading(false); return }
      const [sId, sessionData] = found
      await update(ref(rtdb, 'collab_sessions/' + sId + '/members/' + user.id), {
        id:user.id, name:user.name, online:true, role:'collaborator'
      })
      await push(ref(rtdb, 'collab_sessions/' + sId + '/notifications'), {
        text: user.name + ' joined the story!', ts:Date.now()
      })
      setActiveSession({...sessionData, id:sId})
      setShowJoin(false)
      setJoinCode('')
    } catch(e) { setJoinError('Error joining. Try again.') }
    setLoading(false)
  }

  const publishedStories = stories.filter(s => s.firebaseId)

  return (
    <div className="screen-fade" style={{ paddingBottom:80 }}>
      {/* Profile */}
      <div style={{ margin:'16px 20px',padding:'14px 16px',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:44,height:44,borderRadius:'50%',background:'radial-gradient(circle,#9b3dab,#2d1550)',border:'2px solid var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontFamily:'Cinzel,serif',color:'var(--gold2)',flexShrink:0 }}>
          {user.name[0].toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'Cinzel,serif',fontSize:14,color:'var(--gold2)' }}>{user.name}</div>
          <div style={{ fontSize:10,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:1,marginTop:2 }}>{user.id}</div>
        </div>
        <button onClick={() => { if(window.confirm('Change your writer name?')) { localStorage.removeItem('evo_user_profile'); setUser(null) } }}
          style={{ fontSize:10,fontFamily:'Cinzel,serif',color:'var(--text3)',background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'4px 8px',cursor:'pointer' }}>
          Edit
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'0 20px 16px' }}>
        <div onClick={() => setShowCreate(true)} style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,padding:'16px',cursor:'pointer',transition:'all .2s',textAlign:'center' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          <div style={{ fontSize:24,marginBottom:6 }}>⚔</div>
          <div style={{ fontFamily:'Cinzel,serif',fontSize:11,color:'var(--gold2)',letterSpacing:1 }}>Start Session</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:3 }}>From your stories</div>
        </div>
        <div onClick={() => setShowJoin(true)} style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,padding:'16px',cursor:'pointer',transition:'all .2s',textAlign:'center' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,212,255,0.4)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          <div style={{ fontSize:24,marginBottom:6 }}>🔗</div>
          <div style={{ fontFamily:'Cinzel,serif',fontSize:11,color:'var(--cyan)',letterSpacing:1 }}>Join Session</div>
          <div style={{ fontSize:10,color:'var(--text3)',marginTop:3 }}>Enter invite code</div>
        </div>
      </div>

      {/* Active sessions */}
      {sessions.length > 0 && (
        <>
          <div style={{ padding:'0 20px',fontSize:9,fontFamily:'Cinzel,serif',color:'var(--text3)',letterSpacing:2,marginBottom:8 }}>YOUR SESSIONS</div>
          {sessions.map(s => (
            <div key={s.id} onClick={() => setActiveSession(s)}
              style={{ margin:'0 20px 10px',background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,padding:'14px 16px',cursor:'pointer',transition:'all .2s',position:'relative',overflow:'hidden' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(201,168,76,0.4)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ position:'absolute',top:0,left:'15%',right:'15%',height:1,background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }} />
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:'var(--gold2)' }}>{s.title}</div>
                  <div style={{ fontSize:10,color:'var(--text3)',marginTop:3,fontFamily:'Cinzel,serif' }}>
                    {s.ownerId===user.id?'Owner':'Collaborator'} · {Object.keys(s.members||{}).length} members · {s.code}
                  </div>
                </div>
                <div style={{ fontSize:18,color:'var(--gold2)' }}>▶</div>
              </div>
            </div>
          ))}
        </>
      )}

      {sessions.length === 0 && !showCreate && !showJoin && (
        <div className="empty-state">
          <div className="empty-icon">🤝</div>
          <div className="empty-title">No Sessions Yet</div>
          <div className="empty-desc">Start a collab session from your published story or join with a code.</div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div className="modal">
            <div className="modal-drag" />
            <div className="modal-title">⚔ Start Collab Session</div>
            <p style={{ fontSize:13,color:'var(--text2)',marginBottom:14,lineHeight:1.6 }}>Select one of your published stories to start a collab session. Your existing chapters will be imported.</p>
            {publishedStories.length === 0 ? (
              <div style={{ textAlign:'center',color:'var(--text3)',fontSize:13,padding:'20px 0' }}>You have no published stories yet. Publish a story from Library first.</div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Select Story</label>
                  {publishedStories.map(s => (
                    <div key={s.id} onClick={() => setSelectedStory(s.id)}
                      style={{ background:selectedStory===s.id?'rgba(201,168,76,0.08)':'var(--bg2)',border:'1px solid '+(selectedStory===s.id?'var(--gold)':'var(--border)'),borderRadius:8,padding:'10px 14px',marginBottom:8,cursor:'pointer' }}>
                      <div style={{ fontFamily:'Cinzel,serif',fontSize:13,color:selectedStory===s.id?'var(--gold2)':'var(--text)' }}>{s.title}</div>
                      <div style={{ fontSize:11,color:'var(--text3)',marginTop:2 }}>{s.genre} · {s.chapters?.length||0} chapters</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex',gap:10 }}>
                  <MBtn className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</MBtn>
                  <MBtn className="btn btn-gold" style={{ flex:1 }} disabled={!selectedStory||loading} onClick={createSession}>
                    {loading ? '⟳ Creating...' : 'Create Session ✦'}
                  </MBtn>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowJoin(false)}>
          <div className="modal">
            <div className="modal-drag" />
            <div className="modal-title">🔗 Join Collab Session</div>
            <p style={{ fontSize:13,color:'var(--text2)',marginBottom:14 }}>Enter the invite code shared by the story owner.</p>
            <div className="form-group">
              <label className="form-label">Invite Code</label>
              <input className="form-input" placeholder="EVO-XXX" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&joinSession()} autoFocus style={{ textTransform:'uppercase',letterSpacing:3,fontFamily:'Cinzel,serif',textAlign:'center',fontSize:18 }} />
              {joinError && <div style={{ fontSize:12,color:'#ff6b6b',marginTop:6,fontFamily:'Cinzel,serif' }}>{joinError}</div>}
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <MBtn className="btn btn-outline" onClick={() => { setShowJoin(false); setJoinCode(''); setJoinError('') }}>Cancel</MBtn>
              <MBtn className="btn btn-gold" style={{ flex:1 }} disabled={!joinCode.trim()||loading} onClick={joinSession}>
                {loading ? '⟳ Joining...' : 'Join Session ✦'}
              </MBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
