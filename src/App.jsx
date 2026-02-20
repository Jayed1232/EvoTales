import { useState, useEffect, useRef, useCallback } from 'react'
import { collection, addDoc, getDocs, orderBy, query, where, updateDoc, doc } from 'firebase/firestore'
import { db } from './firebase.js'
import { uid, LS } from './utils.js'
import { ARCHETYPES, AFFINITIES, SPECIAL_AFFs, ALL_ELEMENTS, GRADES, ROLES, GENRES, AFF_CLR, GRADE_CLR, calcStats, getTierName } from './constants.js'

// ── TARGET CURSOR ──────────────────────────────────────────────────────────
function TargetCursor() {
  const outer = useRef(null)
  const inner = useRef(null)
  const pos = useRef({ x: 0, y: 0 })
  const smooth = useRef({ x: 0, y: 0 })
  const raf = useRef(null)
  const hovering = useRef(false)

  useEffect(() => {
    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (inner.current) {
        inner.current.style.left = e.clientX + 'px'
        inner.current.style.top = e.clientY + 'px'
      }
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const isClickable = el && (el.closest('button') || el.closest('[class*="btn"]') || el.closest('[class*="card"]') || el.closest('[class*="ch-item"]') || el.closest('[class*="skill-item"]') || el.closest('[class*="tab"]') || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
      hovering.current = !!isClickable
      if (outer.current) outer.current.classList.toggle('cursor-hover', !!isClickable)
    }
    const loop = () => {
      smooth.current.x += (pos.current.x - smooth.current.x) * 0.12
      smooth.current.y += (pos.current.y - smooth.current.y) * 0.12
      if (outer.current) {
        outer.current.style.left = smooth.current.x + 'px'
        outer.current.style.top = smooth.current.y + 'px'
      }
      raf.current = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', move)
    raf.current = requestAnimationFrame(loop)
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf.current) }
  }, [])

  return (
    <>
      {/* Outer reticle ring */}
      <div ref={outer} className="cursor-outer">
        <div className="cursor-ring" />
        <div className="cursor-line cursor-line-t" />
        <div className="cursor-line cursor-line-b" />
        <div className="cursor-line cursor-line-l" />
        <div className="cursor-line cursor-line-r" />
        <div className="cursor-corners">
          <div className="cursor-corner tl" />
          <div className="cursor-corner tr" />
          <div className="cursor-corner bl" />
          <div className="cursor-corner br" />
        </div>
      </div>
      {/* Inner dot */}
      <div ref={inner} className="cursor-inner" />
    </>
  )
}

// ── CLICK SPARK ────────────────────────────────────────────────────────────
function useClickSpark() {
  useEffect(() => {
    const handler = (e) => {
      const count = 8
      for (let i = 0; i < count; i++) {
        const spark = document.createElement('div')
        spark.className = 'spark'
        const angle = (i / count) * 360
        const dist = 30 + Math.random() * 20
        const tx = Math.cos((angle * Math.PI) / 180) * dist
        const ty = Math.sin((angle * Math.PI) / 180) * dist
        spark.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--tx:${tx}px;--ty:${ty}px;`
        document.body.appendChild(spark)
        setTimeout(() => spark.remove(), 500)
      }
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])
}

// ── MAGNET BUTTON ──────────────────────────────────────────────────────────
function MagnetBtn({ children, className, onClick, disabled, style }) {
  const ref = useRef(null)
  const handleMove = (e) => {
    if (!ref.current || disabled) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) * 0.35
    const dy = (e.clientY - cy) * 0.35
    ref.current.style.transform = `translate(${dx}px,${dy}px)`
  }
  const handleLeave = () => {
    if (!ref.current) return
    ref.current.style.transform = 'translate(0,0)'
    ref.current.style.transition = 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)'
    setTimeout(() => { if (ref.current) ref.current.style.transition = '' }, 500)
  }
  return (
    <button ref={ref} className={`magnet-btn ${className}`} onClick={onClick}
      disabled={disabled} style={style}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </button>
  )
}

// ── ANTIGRAVITY CARD ───────────────────────────────────────────────────────
function AntiCard({ children, className, onClick, style }) {
  const ref = useRef(null)
  const handleMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / rect.width * 12
    const dy = (e.clientY - cy) / rect.height * 12
    ref.current.style.transform = `perspective(600px) rotateX(${-dy}deg) rotateY(${dx}deg) translateY(-4px) scale(1.01)`
    ref.current.style.boxShadow = `${-dx}px ${-dy}px 30px rgba(201,168,76,0.15), 0 12px 40px rgba(0,0,0,0.5)`
  }
  const handleLeave = () => {
    if (!ref.current) return
    ref.current.style.transform = ''
    ref.current.style.boxShadow = ''
    ref.current.style.transition = 'all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)'
    setTimeout(() => { if (ref.current) ref.current.style.transition = '' }, 400)
  }
  return (
    <div ref={ref} className={className} onClick={onClick} style={{ ...style, transition: 'all 0.1s ease', cursor: onClick ? 'pointer' : 'default' }}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </div>
  )
}

// ── RUNE FIELD ─────────────────────────────────────────────────────────────
const RUNES = ['᚛','᚜','ᚐ','ᚑ','ᚒ','✦','✧','⚔','⚡','◈','⬡','△','▽','◇','✵','⊕','⊗','⊙','❋','✺']
function RuneField() {
  const runes = useRef([])
  if (!runes.current.length) {
    runes.current = Array.from({ length: 16 }, (_, i) => ({
      id: i, char: RUNES[Math.floor(Math.random() * RUNES.length)],
      left: Math.random() * 100, size: 10 + Math.random() * 14,
      duration: 14 + Math.random() * 20, delay: -(Math.random() * 20),
    }))
  }
  return (
    <div className="rune-field">
      {runes.current.map(r => (
        <div key={r.id} className="rune" style={{ left: `${r.left}%`, fontSize: `${r.size}px`, animationDuration: `${r.duration}s`, animationDelay: `${r.delay}s` }}>{r.char}</div>
      ))}
    </div>
  )
}

// ── COUNT UP ───────────────────────────────────────────────────────────────
function CountUp({ value }) {
  const [disp, setDisp] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const target = parseInt(value) || 0
    const start = performance.now()
    const dur = 900
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisp(Math.round(target * ease))
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return <>{disp.toLocaleString()}</>
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t) }, [])
  return <div className="toast">✦ {msg}</div>
}

// ── CONFIRM MODAL ──────────────────────────────────────────────────────────
function ConfirmModal({ msg, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">⚠ Confirm Delete</div>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <MagnetBtn className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Delete</MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── NEW STORY MODAL ────────────────────────────────────────────────────────
function NewStoryModal({ onClose, onCreate }) {
  const [f, sf] = useState({ title: '', genre: 'Fantasy', description: '', type: 'chapters' })
  const set = (k, v) => sf(p => ({ ...p, [k]: v }))
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">✦ New Story</div>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="Name your legend..." value={f.title} onChange={e => set('title', e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Genre</label>
          <select className="form-select" value={f.genre} onChange={e => set('genre', e.target.value)}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Structure</label>
          <div className="radio-group">
            <div className={`radio-btn ${f.type === 'chapters' ? 'active' : ''}`} onClick={() => set('type', 'chapters')}>⚔ Chapters & Parts</div>
            <div className={`radio-btn ${f.type === 'plain' ? 'active' : ''}`} onClick={() => set('type', 'plain')}>📜 Plain</div>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Synopsis</label>
          <textarea className="form-textarea" placeholder="In a world where..." value={f.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MagnetBtn className="btn btn-outline" onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!f.title.trim()) return; onCreate(f); onClose() }}>Create Story</MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── NEW CHAPTER MODAL ──────────────────────────────────────────────────────
function NewChapterModal({ onClose, onCreate }) {
  const [t, st] = useState('')
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">⚔ New Chapter</div>
        <div className="form-group">
          <label className="form-label">Chapter Title</label>
          <input className="form-input" placeholder="The Awakening..." value={t} onChange={e => st(e.target.value)} autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MagnetBtn className="btn btn-outline" onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!t.trim()) return; onCreate(t); onClose() }}>Add Chapter</MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── NEW PART MODAL ─────────────────────────────────────────────────────────
function NewPartModal({ onClose, onCreate }) {
  const [t, st] = useState('')
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">✦ New Part</div>
        <div className="form-group">
          <label className="form-label">Part Title</label>
          <input className="form-input" placeholder="Part title..." value={t} onChange={e => st(e.target.value)} autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MagnetBtn className="btn btn-outline" onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!t.trim()) return; onCreate(t); onClose() }}>Add Part</MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── ADD SKILL MODAL ────────────────────────────────────────────────────────
function AddSkillModal({ onClose, onAdd }) {
  const [f, sf] = useState({ name: '', element: 'Fire', level: 1 })
  const set = (k, v) => sf(p => ({ ...p, [k]: v }))
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">⚡ Add Skill</div>
        <div className="form-group">
          <label className="form-label">Skill Name</label>
          <input className="form-input" placeholder="e.g. Flame Strike, Shadow Step..." value={f.name} onChange={e => set('name', e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Element Type</label>
          <div className="multi-select" style={{ gap: 5 }}>
            {ALL_ELEMENTS.map(el => (
              <div key={el}
                className={`multi-chip ${f.element === el ? 'sel' : ''}`}
                style={{ color: AFF_CLR[el] }}
                onClick={() => set('element', el)}>
                {el}
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Skill Level</label>
          <input type="number" className="form-number" value={f.level} onChange={e => set('level', Math.max(1, +e.target.value))} min={1} max={100} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MagnetBtn className="btn btn-outline" onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!f.name.trim()) return; onAdd({ ...f, id: uid() }); onClose() }}>Add Skill</MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── NEW CHARACTER MODAL ────────────────────────────────────────────────────
function NewCharModal({ onClose, onCreate }) {
  const [f, sf] = useState({ name: '', role: 'Protagonist', archetype: 'Warrior', affinities: [], grade: 'Beginner', level: 1, lore: '', skills: [] })
  const set = (k, v) => sf(p => ({ ...p, [k]: v }))
  const togAff = a => set('affinities', f.affinities.includes(a) ? f.affinities.filter(x => x !== a) : [...f.affinities, a])
  const autoStats = calcStats(f.level)
  const tierName = getTierName(f.level)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">⚔ New Character</div>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="Character name..." value={f.name} onChange={e => set('name', e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <div className="radio-group">
            {ROLES.map(r => <div key={r} className={`radio-btn ${f.role === r ? 'active' : ''}`} onClick={() => set('role', r)}>{r}</div>)}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Archetype</label>
          <select className="form-select" value={f.archetype} onChange={e => set('archetype', e.target.value)}>
            {ARCHETYPES.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Affinities — Elements</label>
          <div className="multi-select">
            {AFFINITIES.map(a => <div key={a} className={`multi-chip ${f.affinities.includes(a) ? 'sel' : ''}`} style={{ color: AFF_CLR[a] }} onClick={() => togAff(a)}>{a}</div>)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'Cinzel,serif', letterSpacing: 2, margin: '8px 0 5px' }}>SPECIAL</div>
          <div className="multi-select">
            {SPECIAL_AFFs.map(a => <div key={a} className={`multi-chip ${f.affinities.includes(a) ? 'sel' : ''}`} style={{ color: AFF_CLR[a] }} onClick={() => togAff(a)}>{a}</div>)}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Grade / Rank</label>
          <div className="grade-grid">
            {GRADES.map(g => (
              <div key={g} className={`grade-btn ${f.grade === g ? 'active' : ''}`}
                style={f.grade === g ? { background: GRADE_CLR[g] || 'var(--gold)', borderColor: GRADE_CLR[g] || 'var(--gold)', color: '#fff', boxShadow: `0 0 12px ${GRADE_CLR[g] || 'var(--gold)'}` } : {}}
                onClick={() => set('grade', g)}>{g}</div>
            ))}
          </div>
        </div>

        {/* CORE STATS */}
        <div className="form-group">
          <label className="form-label">Level</label>
          <input type="number" className="form-number" value={f.level} min={1} max={100}
            onChange={e => set('level', Math.max(1, Math.min(100, +e.target.value)))} />
          <div className="tier-badge" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 14 }}>⚔</span>
            <span>{tierName}</span>
          </div>
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="form-label" style={{ margin: 0 }}>Core Stats — Auto by Level</label>
          </div>
          <div className="stats-input-grid">
            <div>
              <div className="stat-label" style={{ marginBottom: 4 }}>HP</div>
              <div className="stat-auto">{autoStats.hp.toLocaleString()}</div>
            </div>
            <div>
              <div className="stat-label" style={{ marginBottom: 4 }}>Mana</div>
              <div className="stat-auto">{autoStats.mana.toLocaleString()}</div>
            </div>
            <div>
              <div className="stat-label" style={{ marginBottom: 4 }}>Speed</div>
              <div className="stat-auto">{autoStats.speed.toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="atk-note">⚔ ATK is determined by equipped skills — no fixed value</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Lore</label>
          <textarea className="form-textarea" style={{ minHeight: 70 }} placeholder="Backstory, notes..." value={f.lore} onChange={e => set('lore', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <MagnetBtn className="btn btn-outline" onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!f.name.trim()) return; onCreate({ ...f, ...calcStats(f.level) }); onClose() }}>Create</MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── CHAR STAT MODAL (per-chapter) ──────────────────────────────────────────
function CharStatModal({ char, chapter, onClose, onSave }) {
  const ex = char.chapterStats?.[chapter.id] || {}
  const [level, setLevel] = useState(ex.level || char.level || 1)
  const autoStats = calcStats(level)
  const tierName = getTierName(level)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">{char.name} — {chapter.title}</div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Chapter-specific level. Stats auto-calculate.</p>
        <div className="form-group">
          <label className="form-label">Level</label>
          <input type="number" className="form-number" value={level} min={1} max={100}
            onChange={e => setLevel(Math.max(1, Math.min(100, +e.target.value)))} />
          <div className="tier-badge" style={{ marginTop: 8 }}><span>⚔</span><span>{tierName}</span></div>
        </div>
        <div className="stats-input-grid" style={{ marginTop: 4 }}>
          {[['HP', autoStats.hp], ['Mana', autoStats.mana], ['Speed', autoStats.speed]].map(([label, val]) => (
            <div key={label}>
              <div className="stat-label" style={{ marginBottom: 4 }}>{label}</div>
              <div className="stat-auto">{val.toLocaleString()}</div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="atk-note" style={{ fontSize: 10 }}>⚔ ATK via skills</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <MagnetBtn className="btn btn-outline" onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-gold" style={{ flex: 1 }} onClick={() => { onSave(chapter.id, { level, ...calcStats(level) }); onClose() }}>Save</MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── PUBLISH MODAL ──────────────────────────────────────────────────────────
function PublishModal({ stories, onClose, onPublish }) {
  const [sel, setSel] = useState(null)
  const [loading, setLoading] = useState(false)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">⚔ Publish to Online</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
          Publishing updates existing entry if already published — no duplicates.
        </p>
        {stories.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No stories in library yet.</div>}
        {stories.map(s => (
          <div key={s.id} className="ch-item"
            style={sel === s.id ? { borderColor: 'var(--gold)', background: 'rgba(201,168,76,.08)', boxShadow: '0 0 15px rgba(201,168,76,0.15)' } : {}}
            onClick={() => setSel(s.id)}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: sel === s.id ? 'var(--gold2)' : 'var(--text)' }}>{s.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              {s.genre} · {s.type} · {s.chapters?.length || 0} chapters · {s.characters?.length || 0} characters
              {s.firebaseId && <span style={{ color: 'var(--gold)', marginLeft: 8 }}>● Published</span>}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <MagnetBtn className="btn btn-outline" onClick={onClose}>Cancel</MagnetBtn>
          <MagnetBtn className="btn btn-gold" style={{ flex: 1 }} disabled={!sel || loading}
            onClick={async () => { setLoading(true); await onPublish(sel); setLoading(false) }}>
            {loading ? '⟳ Publishing...' : 'Publish ✦'}
          </MagnetBtn>
        </div>
      </div>
    </div>
  )
}

// ── PLAIN EDITOR ───────────────────────────────────────────────────────────
function PlainEditor({ value, onChange }) {
  const [v, sv] = useState(value)
  const timer = useRef(null)
  const wc = v.trim() ? v.trim().split(/\s+/).length : 0
  const handle = e => { sv(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(() => onChange(e.target.value), 900) }
  return (
    <>
      <textarea className="editor-area" placeholder="Begin your tale..." value={v} onChange={handle} style={{ minHeight: 360 }} />
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', padding: '4px 16px 0', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>{wc} words</div>
    </>
  )
}

// ── STORY LIST ─────────────────────────────────────────────────────────────
function StoryList({ stories, onOpen }) {
  return (
    <div className="screen-fade">
      <div className="screen-header"><h2>Your Library</h2></div>
      {stories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <div className="empty-title">No Stories Yet</div>
          <div className="empty-desc">Tap ✦ to forge your first tale.</div>
        </div>
      ) : stories.map(s => (
        <AntiCard key={s.id} className="card story-card stagger-item" onClick={() => onOpen(s)}>
          <div className="card-title">{s.title}</div>
          <div className="card-sub">{s.genre}</div>
          <span className={`type-badge ${s.type === 'chapters' ? 'b-chapters' : 'b-plain'}`}>
            {s.type === 'chapters' ? `⚔ ${s.chapters?.length || 0} Chapters` : '📜 Plain'}
          </span>
          {s.firebaseId && <span style={{ fontSize: 9, color: 'var(--gold)', fontFamily: 'Cinzel,serif', letterSpacing: 1, marginLeft: 8 }}>● LIVE</span>}
          {s.type === 'chapters' && s.chapters?.length > 0 && (
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: `${s.chapters.filter(c => c.completed).length / s.chapters.length * 100}%` }} />
            </div>
          )}
          <div className="card-body" style={{ fontSize: 13 }}>{(s.description || '').slice(0, 100)}{s.description?.length > 100 ? '...' : ''}</div>
        </AntiCard>
      ))}
    </div>
  )
}

// ── STORY SCREEN ───────────────────────────────────────────────────────────
function StoryScreen({ story, onBack, onChapter, onChar, onEdit, setModal, setDelTarget, onDeleteStory }) {
  const [editDesc, setEditDesc] = useState(false)
  const [desc, setDesc] = useState(story.description || '')
  const isLocked = idx => idx > 0 && !story.chapters[idx - 1]?.completed

  return (
    <div className="screen-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{story.title}</h2>
        <MagnetBtn className="btn btn-sm btn-danger" onClick={() => { setDelTarget({ label: story.title, fn: onDeleteStory }); setModal('confirm') }}>🗑</MagnetBtn>
      </div>

      <AntiCard className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Synopsis</div>
          <MagnetBtn className="btn btn-outline btn-sm" onClick={() => { if (editDesc) onEdit({ description: desc }); setEditDesc(!editDesc) }}>
            {editDesc ? 'Save' : 'Edit'}
          </MagnetBtn>
        </div>
        {editDesc
          ? <textarea className="form-textarea" style={{ marginTop: 10 }} value={desc} onChange={e => setDesc(e.target.value)} />
          : <div className="card-body">{story.description || <span style={{ color: 'var(--text3)' }}>No synopsis yet...</span>}</div>
        }
      </AntiCard>

      <div className="section-label">Characters</div>
      {(story.characters || []).map(c => (
        <AntiCard key={c.id} className="card char-card stagger-item" onClick={() => onChar(c)}>
          <div className="char-row">
            <div className="char-avatar">{(c.name || '?')[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="card-title">{c.name}</div>
              <div className="card-sub">{c.role} · {c.archetype}</div>
              <div className="char-badges">
                {(c.affinities || []).map(a => <span key={a} className="badge" style={{ color: AFF_CLR[a] || 'var(--text2)', borderColor: AFF_CLR[a] || 'var(--border)' }}>{a}</span>)}
                {c.grade && <span className="badge" style={{ color: GRADE_CLR[c.grade] || 'var(--gold)', borderColor: GRADE_CLR[c.grade] || 'var(--gold)' }}>{c.grade}</span>}
              </div>
            </div>
          </div>
        </AntiCard>
      ))}
      <div style={{ padding: '0 16px 10px' }}>
        <MagnetBtn className="btn btn-outline btn-full" onClick={() => setModal('newChar')}>+ Add Character</MagnetBtn>
      </div>

      {story.type === 'chapters' ? (
        <>
          <div className="section-label">Chapters</div>
          {(story.chapters || []).map((ch, idx) => {
            const locked = isLocked(idx)
            return (
              <div key={ch.id} className={`ch-item stagger-item ${locked ? 'locked-ch' : ''}`} onClick={() => !locked && onChapter(ch)}>
                {locked && <><div className="fog-particles" /><div className="fog-overlay"><div className="fog-icon">🌫</div><div className="fog-text">Fog of War — Complete Chapter {idx} to unlock</div></div></>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase' }}>Chapter {idx + 1}</div>
                    <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: locked ? 'var(--text3)' : 'var(--gold2)', marginTop: 2 }}>{ch.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{ch.parts?.length || 0} parts · {ch.completed ? '✦ Complete' : 'In Progress'}</div>
                  </div>
                  <div style={{ fontSize: 22, color: locked ? 'var(--text3)' : ch.completed ? 'var(--gold2)' : 'var(--text2)', filter: ch.completed ? 'drop-shadow(0 0 6px var(--gold))' : 'none' }}>
                    {locked ? '🔒' : ch.completed ? '✦' : '▶'}
                  </div>
                </div>
              </div>
            )
          })}
          {(!story.chapters || story.chapters.length === 0) && <div style={{ padding: '0 16px 10px', color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>No chapters yet. Tap + to begin.</div>}
        </>
      ) : (
        <>
          <div className="section-label">Content</div>
          <PlainEditor value={story.content || ''} onChange={v => onEdit({ content: v })} />
        </>
      )}
    </div>
  )
}

// ── CHAPTER SCREEN ─────────────────────────────────────────────────────────
function ChapterScreen({ story, chapter, onBack, onPart, onToggleComplete, setModal, onUpdateChapter, setDelTarget, onDeleteChapter }) {
  const [edit, setEdit] = useState(false)
  const [content, setContent] = useState(chapter.content || '')
  const wc = content.trim() ? content.trim().split(/\s+/).length : 0

  return (
    <div className="screen-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{chapter.title}</h2>
        <MagnetBtn className="btn btn-sm btn-danger" onClick={() => { setDelTarget({ label: chapter.title, fn: onDeleteChapter }); setModal('confirm') }}>🗑</MagnetBtn>
      </div>
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <MagnetBtn className={`btn btn-sm ${chapter.completed ? 'btn-gold' : 'btn-outline'}`} onClick={onToggleComplete}>
          {chapter.completed ? '✦ Completed' : 'Mark Complete'}
        </MagnetBtn>
        <MagnetBtn className="btn btn-sm btn-outline" onClick={() => setModal('newPart')}>+ Add Part</MagnetBtn>
      </div>
      <div className="section-label">Chapter Writing</div>
      {edit ? (
        <div style={{ padding: '0 16px' }}>
          <textarea className="editor-area" style={{ margin: 0, width: '100%', minHeight: 240 }} value={content} onChange={e => setContent(e.target.value)} autoFocus />
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 4, fontFamily: 'Cinzel,serif' }}>{wc} words</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <MagnetBtn className="btn btn-gold btn-sm" onClick={() => { onUpdateChapter({ content }); setEdit(false) }}>Save</MagnetBtn>
            <MagnetBtn className="btn btn-outline btn-sm" onClick={() => setEdit(false)}>Cancel</MagnetBtn>
          </div>
        </div>
      ) : (
        <AntiCard className="card" onClick={() => setEdit(true)} style={{ cursor: 'text' }}>
          {chapter.content ? <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)' }}>{chapter.content}</p> : <p style={{ color: 'var(--text3)', fontSize: 14 }}>Tap to write chapter content...</p>}
        </AntiCard>
      )}
      {chapter.parts?.length > 0 && <>
        <div className="section-label" style={{ marginTop: 6 }}>Parts</div>
        {chapter.parts.map(p => (
          <div key={p.id} className="part-item stagger-item" onClick={() => onPart(p)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{p.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{p.content ? p.content.split(/\s+/).filter(Boolean).length + ' words' : 'Empty'} →</span>
            </div>
          </div>
        ))}
      </>}
    </div>
  )
}

// ── PART SCREEN ────────────────────────────────────────────────────────────
function PartScreen({ part, onBack, onUpdate }) {
  const [v, sv] = useState(part.content || '')
  const timer = useRef(null)
  const wc = v.trim() ? v.trim().split(/\s+/).length : 0
  const handle = e => { sv(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(() => onUpdate({ content: e.target.value }), 900) }
  return (
    <div className="screen-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>{part.title}</h2>
      </div>
      <textarea className="editor-area" style={{ minHeight: 420 }} placeholder="Write this part..." value={v} onChange={handle} autoFocus />
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', padding: '4px 16px 0', fontFamily: 'Cinzel,serif' }}>{wc} words</div>
    </div>
  )
}

// ── CHAR DETAIL SCREEN ─────────────────────────────────────────────────────
function CharDetailScreen({ story, char, onBack, setModal, setStatChapter, setDelTarget, onDeleteChar, onUpdateChar }) {
  const [showAddSkill, setShowAddSkill] = useState(false)
  const stats = calcStats(char.level || 1)
  const tierName = getTierName(char.level || 1)

  const addSkill = (skill) => {
    onUpdateChar({ skills: [...(char.skills || []), skill] })
  }
  const removeSkill = (skillId) => {
    onUpdateChar({ skills: (char.skills || []).filter(s => s.id !== skillId) })
  }

  return (
    <div className="screen-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Character</h2>
        <MagnetBtn className="btn btn-sm btn-danger" onClick={() => { setDelTarget({ label: char.name, fn: onDeleteChar }); setModal('confirm') }}>🗑</MagnetBtn>
      </div>

      {/* Avatar */}
      <div style={{ textAlign: 'center', padding: '16px 16px 8px' }}>
        <div className="char-detail-avatar">{(char.name || '?')[0].toUpperCase()}</div>
        <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 19, color: 'var(--gold2)', background: 'linear-gradient(90deg,var(--gold),var(--gold3),#fff,var(--gold3),var(--gold))', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 4s linear infinite' }}>{char.name}</div>
        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 3, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 3 }}>{char.role}</div>
        <div className="tier-badge" style={{ justifyContent: 'center', marginTop: 6 }}>⚔ Lv.{char.level || 1} — {tierName}</div>
      </div>

      {/* Identity */}
      <AntiCard className="card">
        <div className="card-title">Identity</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
          <div><div className="stat-label">Archetype</div><div style={{ color: 'var(--gold2)', fontFamily: 'Cinzel,serif', marginTop: 3, fontSize: 13 }}>{char.archetype}</div></div>
          <div><div className="stat-label">Grade</div><div style={{ color: GRADE_CLR[char.grade] || 'var(--gold)', fontFamily: 'Cinzel,serif', marginTop: 3, fontSize: 13, textShadow: `0 0 10px ${GRADE_CLR[char.grade] || 'var(--gold)'}` }}>{char.grade}</div></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div className="stat-label">Affinities</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
            {(char.affinities || []).map(a => <span key={a} className="badge" style={{ color: AFF_CLR[a], borderColor: AFF_CLR[a], boxShadow: `0 0 8px ${AFF_CLR[a]}40` }}>{a}</span>)}
            {(!char.affinities || char.affinities.length === 0) && <span style={{ color: 'var(--text3)', fontSize: 13 }}>None assigned</span>}
          </div>
        </div>
      </AntiCard>

      {/* Base Stats */}
      <AntiCard className="card">
        <div className="card-title">Base Stats</div>
        <div className="stats-grid" style={{ marginTop: 10 }}>
          <div className="stat-box"><div className="stat-label">HP</div><div className="stat-val"><CountUp value={stats.hp} /></div></div>
          <div className="stat-box"><div className="stat-label">Mana</div><div className="stat-val"><CountUp value={stats.mana} /></div></div>
          <div className="stat-box"><div className="stat-label">Speed</div><div className="stat-val"><CountUp value={stats.speed} /></div></div>
          <div className="stat-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="atk-note" style={{ padding: '4px 8px' }}>⚔ ATK is skill-based — no fixed stat</div>
          </div>
        </div>
      </AntiCard>

      {/* Lore */}
      {char.lore && <AntiCard className="card"><div className="card-title">Lore</div><div className="card-body">{char.lore}</div></AntiCard>}

      {/* SKILLS */}
      <div className="section-label">Skills</div>
      <div style={{ padding: '0 16px 8px' }}>
        {(char.skills || []).length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '14px 0' }}>No skills yet. Add a skill below.</div>
        )}
        {(char.skills || []).map(skill => (
          <div key={skill.id} className="skill-item" style={{ '--element-clr': AFF_CLR[skill.element] || 'var(--gold)' }}>
            <div style={{ flex: 1 }}>
              <div className="skill-name">{skill.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                <span className="skill-element" style={{ color: AFF_CLR[skill.element] || 'var(--gold)', borderColor: AFF_CLR[skill.element] || 'var(--gold)' }}>{skill.element}</span>
                <span className="skill-lvl">Lv.{skill.level}</span>
              </div>
            </div>
            <button onClick={() => removeSkill(skill.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: '2px 6px', transition: 'color 0.2s' }}
              onMouseOver={e => e.target.style.color = '#ff6b6b'} onMouseOut={e => e.target.style.color = 'var(--text3)'}>×</button>
          </div>
        ))}
        <MagnetBtn className="btn btn-outline btn-full" style={{ marginTop: 8 }} onClick={() => setShowAddSkill(true)}>+ Add Skill</MagnetBtn>
      </div>

      {/* Chapter Progression */}
      {story.type === 'chapters' && story.chapters?.length > 0 && (
        <>
          <div className="section-label">Chapter Progression</div>
          {story.chapters.map((ch, idx) => {
            const prevOk = idx === 0 || story.chapters[idx - 1]?.completed
            const cStats = char.chapterStats?.[ch.id]
            return (
              <div key={ch.id} className="ch-item stagger-item" style={{ margin: '0 16px 8px', position: 'relative' }}>
                {!prevOk && <><div className="fog-particles" /><div className="fog-overlay"><div className="fog-icon">🌫</div><div className="fog-text">Unlocks after Chapter {idx}</div></div></>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase' }}>Ch.{idx + 1} · {ch.title}</div>
                    {cStats && (
                      <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                        {[['Lv', cStats.level], ['HP', cStats.hp?.toLocaleString()], ['Spd', cStats.speed]].map(([k, v]) => (
                          <div key={k} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 8, color: 'var(--text3)', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>{k}</div>
                            <div style={{ fontSize: 14, color: 'var(--gold2)', fontFamily: 'Cinzel,serif', fontWeight: 700 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!cStats && prevOk && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>No chapter stats yet</div>}
                  </div>
                  {prevOk && (
                    <MagnetBtn className="btn btn-outline btn-sm" onClick={() => { setStatChapter(ch); setModal('charStat') }}>
                      {cStats ? 'Edit' : '+ Stats'}
                    </MagnetBtn>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {showAddSkill && <AddSkillModal onClose={() => setShowAddSkill(false)} onAdd={addSkill} />}
    </div>
  )
}

// ── ONLINE TAB ─────────────────────────────────────────────────────────────
function OnlineTab({ online, stories, setModal, onStoriesUpdate }) {
  const [published, setPublished] = useState([])
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(null)

  const load = async () => {
    if (!online || !db) return
    setLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'published_stories'), orderBy('publishedAt', 'desc')))
      setPublished(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.warn(e) }
    setLoading(false)
  }

  useEffect(() => { if (online) load() }, [online])

  if (!online) return (
    <div className="empty-state">
      <div className="empty-icon">📡</div>
      <div className="empty-title">No Connection</div>
      <div className="empty-desc">Online mode needs an active internet connection.</div>
    </div>
  )

  if (reading) return (
    <div className="screen-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={() => setReading(null)}>←</button>
        <h2>{reading.title}</h2>
      </div>
      {reading.characters?.length > 0 && <>
        <div className="section-label">Characters</div>
        {reading.characters.map(c => (
          <AntiCard key={c.id} className="card stagger-item">
            <div className="char-row">
              <div className="char-avatar">{(c.name || '?')[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div className="card-title">{c.name}</div>
                <div className="card-sub">{c.role} · {c.archetype} · Lv.{c.level || 1}</div>
                <div className="char-badges">
                  {(c.affinities || []).map(a => <span key={a} className="badge" style={{ color: AFF_CLR[a] || 'var(--text2)', borderColor: AFF_CLR[a] || 'var(--border)' }}>{a}</span>)}
                  {c.grade && <span className="badge" style={{ color: GRADE_CLR[c.grade] || 'var(--gold)', borderColor: GRADE_CLR[c.grade] || 'var(--gold)' }}>{c.grade}</span>}
                </div>
                {c.skills?.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {c.skills.map(sk => (
                      <span key={sk.id} style={{ fontSize: 10, color: AFF_CLR[sk.element] || 'var(--gold)', border: `1px solid ${AFF_CLR[sk.element] || 'var(--gold)'}`, borderRadius: 10, padding: '1px 7px', fontFamily: 'Cinzel,serif' }}>
                        {sk.name} {sk.element} Lv.{sk.level}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AntiCard>
        ))}
      </>}
      {reading.chapters?.length > 0 && <>
        <div className="section-label">Chapters</div>
        {reading.chapters.map((ch, idx) => (
          <AntiCard key={ch.id} className="card stagger-item">
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: 'var(--text3)', letterSpacing: 2 }}>CHAPTER {idx + 1}</div>
            <div className="card-title" style={{ marginTop: 3 }}>{ch.title}</div>
            {ch.content && <div className="card-body">{ch.content}</div>}
            {ch.parts?.map(p => (
              <div key={p.id} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: 'var(--gold)', marginBottom: 5 }}>{p.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text2)' }}>{p.content}</div>
              </div>
            ))}
          </AntiCard>
        ))}
      </>}
    </div>
  )

  return (
    <div className="screen-fade">
      <div className="online-hero">
        <h2>EvoTales Online</h2>
        <p>Share your stories or discover legends from across the realm.</p>
      </div>
      <AntiCard className="online-btn stagger-item" onClick={() => setModal('publish')}>
        <div className="online-btn-icon">⚔</div>
        <div>
          <div className="online-btn-title">Publish Your Story</div>
          <div className="online-btn-desc">Updates existing — no duplicates ever created.</div>
        </div>
      </AntiCard>
      <AntiCard className="online-btn stagger-item" onClick={load}>
        <div className="online-btn-icon">📖</div>
        <div>
          <div className="online-btn-title">Discover Stories</div>
          <div className="online-btn-desc">{loading ? '⟳ Loading...' : `${published.length} tales. Tap to refresh.`}</div>
        </div>
      </AntiCard>
      {published.length > 0 && <>
        <div className="section-label">Published Stories</div>
        {published.map(s => (
          <AntiCard key={s.id} className="pub-card stagger-item" onClick={() => setReading(s)}>
            <div className="card-title">{s.title}</div>
            <div className="card-sub">{s.genre}</div>
            <div className="card-body" style={{ fontSize: 13 }}>{(s.description || '').slice(0, 120)}{s.description?.length > 120 ? '...' : ''}</div>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text3)', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>
              {s.characters?.length || 0} characters · {s.chapters?.length || 0} chapters
            </div>
          </AntiCard>
        ))}
      </>}
    </div>
  )
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('library')
  const [screen, setScreen] = useState('home')
  const [stories, setStories] = useState(() => LS.get('evo_stories', []))
  const [activeStory, setActiveStory] = useState(null)
  const [activeChapter, setActiveChapter] = useState(null)
  const [activePart, setActivePart] = useState(null)
  const [activeChar, setActiveChar] = useState(null)
  const [statChapter, setStatChapter] = useState(null)
  const [modal, setModal] = useState(null)
  const [delTarget, setDelTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)

  useClickSpark()

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const saveStories = s => { setStories(s); LS.set('evo_stories', s) }
  const showToast = msg => setToast(msg)

  const story = stories.find(s => s.id === activeStory?.id)
  const chapter = story?.chapters?.find(c => c.id === activeChapter?.id)
  const part = chapter?.parts?.find(p => p.id === activePart?.id)
  const char = story?.characters?.find(c => c.id === activeChar?.id)

  const patchStory = (id, patch) => saveStories(stories.map(s => s.id === id ? { ...s, ...patch } : s))
  const createStory = data => { saveStories([{ id: uid(), ...data, chapters: [], characters: [], createdAt: Date.now() }, ...stories]); showToast('Story created') }
  const deleteStory = id => { saveStories(stories.filter(s => s.id !== id)); setScreen('home'); setActiveStory(null); showToast('Story deleted') }

  const patchChapter = (sId, cId, patch) => { const s = stories.find(x => x.id === sId); patchStory(sId, { chapters: s.chapters.map(c => c.id === cId ? { ...c, ...patch } : c) }) }
  const createChapter = (title, sId) => { const s = stories.find(x => x.id === sId); patchStory(sId, { chapters: [...s.chapters, { id: uid(), title, parts: [], content: '', completed: false }] }); showToast('Chapter added') }
  const deleteChapter = (sId, cId) => { const s = stories.find(x => x.id === sId); patchStory(sId, { chapters: s.chapters.filter(c => c.id !== cId) }); setScreen('story'); setActiveChapter(null); showToast('Chapter deleted') }

  const patchPart = (sId, cId, pId, patch) => { const s = stories.find(x => x.id === sId); const ch = s.chapters.find(c => c.id === cId); patchChapter(sId, cId, { parts: ch.parts.map(p => p.id === pId ? { ...p, ...patch } : p) }) }
  const createPart = (title, sId, cId) => { const s = stories.find(x => x.id === sId); const ch = s.chapters.find(c => c.id === cId); patchChapter(sId, cId, { parts: [...ch.parts, { id: uid(), title, content: '' }] }); showToast('Part added') }

  const patchChar = (sId, charId, patch) => { const s = stories.find(x => x.id === sId); patchStory(sId, { characters: s.characters.map(c => c.id === charId ? { ...c, ...patch } : c) }) }
  const createChar = (data, sId) => { const s = stories.find(x => x.id === sId); patchStory(sId, { characters: [...s.characters, { id: uid(), ...data, chapterStats: {}, skills: [] }] }); showToast('Character created') }
  const deleteChar = (sId, charId) => { const s = stories.find(x => x.id === sId); patchStory(sId, { characters: s.characters.filter(c => c.id !== charId) }); setScreen('story'); setActiveChar(null); showToast('Character removed') }

  // ── UPSERT PUBLISH: update existing Firestore doc if already published ──
  const publishStory = async (sId) => {
    if (!db) { showToast('Firebase unavailable'); return }
    const s = stories.find(x => x.id === sId)
    const payload = {
      title: s.title, genre: s.genre, description: s.description,
      type: s.type, chapters: s.chapters || [], characters: s.characters || [],
      publishedAt: s.firebaseId ? s.publishedAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    }
    try {
      if (s.firebaseId) {
        // Update existing document
        await updateDoc(doc(db, 'published_stories', s.firebaseId), payload)
        showToast('Story updated online ✦')
      } else {
        // Check by title first to avoid duplicates from old publishes
        const existing = await getDocs(query(collection(db, 'published_stories'), where('title', '==', s.title)))
        if (!existing.empty) {
          const docId = existing.docs[0].id
          await updateDoc(doc(db, 'published_stories', docId), payload)
          patchStory(sId, { firebaseId: docId })
          showToast('Story updated online ✦')
        } else {
          const ref = await addDoc(collection(db, 'published_stories'), payload)
          patchStory(sId, { firebaseId: ref.id })
          showToast('Published! ✦')
        }
      }
      setModal(null)
    } catch (e) { showToast('Publish failed: ' + e.message) }
  }

  const switchTab = t => { setTab(t); setScreen('home'); setActiveStory(null); setActiveChapter(null); setActivePart(null); setActiveChar(null) }
  const showFab = tab === 'library' && (screen === 'home' || (screen === 'story' && story?.type === 'chapters') || screen === 'chapter')
  const fabAction = () => { if (screen === 'home') setModal('newStory'); else if (screen === 'story') setModal('newChapter'); else if (screen === 'chapter') setModal('newPart') }

  const renderScreen = () => {
    if (screen === 'home') return <StoryList stories={stories} onOpen={s => { setActiveStory(s); setScreen('story') }} />
    if (screen === 'story' && story) return <StoryScreen story={story} onBack={() => setScreen('home')} onChapter={ch => { setActiveChapter(ch); setScreen('chapter') }} onChar={c => { setActiveChar(c); setScreen('charDetail') }} onEdit={patch => patchStory(story.id, patch)} setModal={setModal} setDelTarget={setDelTarget} onDeleteStory={() => deleteStory(story.id)} />
    if (screen === 'chapter' && chapter) return <ChapterScreen story={story} chapter={chapter} onBack={() => setScreen('story')} onPart={p => { setActivePart(p); setScreen('part') }} onToggleComplete={() => patchChapter(story.id, chapter.id, { completed: !chapter.completed })} setModal={setModal} onUpdateChapter={patch => patchChapter(story.id, chapter.id, patch)} setDelTarget={setDelTarget} onDeleteChapter={() => deleteChapter(story.id, chapter.id)} />
    if (screen === 'part' && part) return <PartScreen part={part} onBack={() => setScreen('chapter')} onUpdate={patch => patchPart(story.id, chapter.id, part.id, patch)} />
    if (screen === 'charDetail' && char) return <CharDetailScreen story={story} char={char} onBack={() => setScreen('story')} setModal={setModal} setStatChapter={setStatChapter} setDelTarget={setDelTarget} onDeleteChar={() => deleteChar(story.id, char.id)} onUpdateChar={patch => patchChar(story.id, char.id, patch)} />
    return null
  }

  return (
    <div className="app">
      <TargetCursor />
      <div className="app-bg" />
      <RuneField />

      <nav className="nav">
        <div>
          <div className="nav-logo">EvoTales</div>
          <div className="nav-sub">Forge Your Legend</div>
        </div>
        <div className={`status-badge ${online ? 's-online' : 's-offline'}`}>
          <div className="sdot" />{online ? 'Online' : 'Offline'}
        </div>
      </nav>

      <div className="tabs">
        {['library', 'online'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => switchTab(t)}>
            {t === 'library' ? '📚 Library' : '🌐 Online'}
          </button>
        ))}
      </div>

      <div className="content">
        {tab === 'library' ? renderScreen() : <OnlineTab online={online} stories={stories} setModal={setModal} onStoriesUpdate={saveStories} />}
      </div>

      {showFab && <MagnetBtn className="fab" onClick={fabAction}>{screen === 'home' ? '✦' : '+'}</MagnetBtn>}

      {modal === 'newStory' && <NewStoryModal onClose={() => setModal(null)} onCreate={createStory} />}
      {modal === 'newChapter' && story && <NewChapterModal onClose={() => setModal(null)} onCreate={t => createChapter(t, story.id)} />}
      {modal === 'newPart' && chapter && <NewPartModal onClose={() => setModal(null)} onCreate={t => createPart(t, story.id, chapter.id)} />}
      {modal === 'newChar' && story && <NewCharModal onClose={() => setModal(null)} onCreate={d => createChar(d, story.id)} />}
      {modal === 'charStat' && char && statChapter && <CharStatModal char={char} chapter={statChapter} onClose={() => setModal(null)} onSave={(cId, stats) => patchChar(story.id, char.id, { chapterStats: { ...char.chapterStats, [cId]: stats } })} />}
      {modal === 'publish' && <PublishModal stories={stories} onClose={() => setModal(null)} onPublish={publishStory} />}
      {modal === 'confirm' && delTarget && <ConfirmModal msg={`Delete "${delTarget.label}"? This cannot be undone.`} onClose={() => setModal(null)} onConfirm={() => { delTarget.fn(); setModal(null); setDelTarget(null) }} />}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
