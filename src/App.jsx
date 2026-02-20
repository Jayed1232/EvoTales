import { useState, useEffect, useRef, useCallback } from 'react'
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './firebase.js'
import { uid, LS } from './utils.js'
import { ARCHETYPES, AFFINITIES, SPECIAL_AFFs, GRADES, ROLES, GENRES, AFF_CLR, GRADE_CLR } from './constants.js'

// ── RUNE FIELD (floating background particles) ─────────────────────────────
const RUNES = ['᚛','᚜','ᚐ','ᚑ','ᚒ','ᚓ','ᚔ','✦','✧','⚔','⚡','◈','⬡','⬢','△','▽','◇','✵','⊕','⊗','⊙','❋','✺','✹','⊛']
function RuneField() {
  const runes = useRef([])
  if (runes.current.length === 0) {
    runes.current = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      char: RUNES[Math.floor(Math.random() * RUNES.length)],
      left: Math.random() * 100,
      size: 10 + Math.random() * 14,
      duration: 14 + Math.random() * 20,
      delay: -(Math.random() * 20),
    }))
  }
  return (
    <div className="rune-field">
      {runes.current.map(r => (
        <div key={r.id} className="rune" style={{
          left: `${r.left}%`, fontSize: `${r.size}px`,
          animationDuration: `${r.duration}s`, animationDelay: `${r.delay}s`,
        }}>{r.char}</div>
      ))}
    </div>
  )
}

// ── COUNT UP STAT ──────────────────────────────────────────────────────────
function CountUpStat({ value, label }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const target = parseInt(value) || 0
    const start = performance.now()
    const duration = 800
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(target * ease))
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-val">{display}</div>
    </div>
  )
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
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Delete</button>
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
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!f.title.trim()) return; onCreate(f); onClose() }}>Create Story</button>
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
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!t.trim()) return; onCreate(t); onClose() }}>Add Chapter</button>
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
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!t.trim()) return; onCreate(t); onClose() }}>Add Part</button>
        </div>
      </div>
    </div>
  )
}

// ── NEW CHARACTER MODAL ────────────────────────────────────────────────────
function NewCharModal({ onClose, onCreate }) {
  const [f, sf] = useState({ name: '', role: 'Protagonist', archetype: 'Warrior', affinities: [], grade: '1st Grade', level: 1, health: 100, speed: 10, mana: 50, lore: '' })
  const set = (k, v) => sf(p => ({ ...p, [k]: v }))
  const togAff = a => set('affinities', f.affinities.includes(a) ? f.affinities.filter(x => x !== a) : [...f.affinities, a])
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
        <div className="form-group">
          <label className="form-label">Core Stats</label>
          <div className="stats-input-grid">
            {['level', 'health', 'speed', 'mana'].map(k => (
              <div key={k}>
                <div className="stat-label" style={{ marginBottom: 4 }}>{k}</div>
                <input type="number" className="form-number" value={f[k]} onChange={e => set(k, +e.target.value)} min={0} />
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Lore</label>
          <textarea className="form-textarea" style={{ minHeight: 70 }} placeholder="Backstory, notes..." value={f.lore} onChange={e => set('lore', e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => { if (!f.name.trim()) return; onCreate(f); onClose() }}>Create</button>
        </div>
      </div>
    </div>
  )
}

// ── CHAR STAT MODAL ────────────────────────────────────────────────────────
function CharStatModal({ char, chapter, onClose, onSave }) {
  const ex = char.chapterStats?.[chapter.id] || {}
  const [s, ss] = useState({ level: ex.level || char.level || 1, health: ex.health || char.health || 100, speed: ex.speed || char.speed || 10, mana: ex.mana || char.mana || 50 })
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">{char.name} — {chapter.title}</div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>Set chapter-specific stats for this character</p>
        <div className="stats-input-grid">
          {['level', 'health', 'speed', 'mana'].map(k => (
            <div key={k}>
              <div className="stat-label" style={{ marginBottom: 4 }}>{k}</div>
              <input type="number" className="form-number" value={s[k]} onChange={e => ss(p => ({ ...p, [k]: +e.target.value }))} min={0} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => { onSave(chapter.id, s); onClose() }}>Save Stats</button>
        </div>
      </div>
    </div>
  )
}

// ── PUBLISH MODAL ──────────────────────────────────────────────────────────
function PublishModal({ stories, onClose, onPublish }) {
  const [sel, setSel] = useState(null)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-drag" />
        <div className="modal-title">⚔ Publish to Online</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>Choose a story to share with all readers.</p>
        {stories.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No stories in your library yet.</div>}
        {stories.map(s => (
          <div key={s.id} className="ch-item"
            style={sel === s.id ? { borderColor: 'var(--gold)', background: 'rgba(201,168,76,.08)', boxShadow: '0 0 15px rgba(201,168,76,0.15)' } : {}}
            onClick={() => setSel(s.id)}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: sel === s.id ? 'var(--gold2)' : 'var(--text)' }}>{s.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{s.genre} · {s.type} · {s.chapters?.length || 0} chapters</div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" style={{ flex: 1 }} disabled={!sel} onClick={() => sel && onPublish(sel)}>Publish ✦</button>
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
      <textarea className="editor-area" placeholder="Begin your tale... Every legend starts with a single word." value={v} onChange={handle} style={{ minHeight: 360 }} />
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', padding: '4px 16px 0', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>
        {wc} {wc === 1 ? 'word' : 'words'}
      </div>
    </>
  )
}

// ── STORY LIST ─────────────────────────────────────────────────────────────
function StoryList({ stories }) {
  return (
    <div className="screen-fade">
      <div className="screen-header"><h2>Your Library</h2></div>
      {stories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <div className="empty-title">No Stories Yet</div>
          <div className="empty-desc">Tap ✦ to forge your first tale and begin your legend.</div>
        </div>
      ) : stories.map((s, i) => (
        <div key={s.id} className="card story-card stagger-item" data-i={i}
          onClick={() => null /* handled by parent */} id={`story-${s.id}`}>
          <div className="card-title">{s.title}</div>
          <div className="card-sub">{s.genre}</div>
          <span className={`type-badge ${s.type === 'chapters' ? 'b-chapters' : 'b-plain'}`}>
            {s.type === 'chapters' ? `⚔ ${s.chapters?.length || 0} Chapters` : '📜 Plain'}
          </span>
          {s.type === 'chapters' && s.chapters?.length > 0 && (
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: `${s.chapters.filter(c => c.completed).length / s.chapters.length * 100}%` }} />
            </div>
          )}
          <div className="card-body" style={{ fontSize: 13 }}>{(s.description || '').slice(0, 100)}{s.description?.length > 100 ? '...' : ''}</div>
        </div>
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
        <button className="btn btn-sm btn-danger" onClick={() => { setDelTarget({ label: story.title, fn: onDeleteStory }); setModal('confirm') }}>🗑</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Synopsis</div>
          <button className="btn btn-outline btn-sm" onClick={() => { if (editDesc) onEdit({ description: desc }); setEditDesc(!editDesc) }}>
            {editDesc ? 'Save' : 'Edit'}
          </button>
        </div>
        {editDesc
          ? <textarea className="form-textarea" style={{ marginTop: 10 }} value={desc} onChange={e => setDesc(e.target.value)} />
          : <div className="card-body">{story.description || <span style={{ color: 'var(--text3)' }}>No synopsis yet...</span>}</div>
        }
      </div>

      <div className="section-label">Characters</div>
      {(story.characters || []).map((c, i) => (
        <div key={c.id} className="card char-card stagger-item" onClick={() => onChar(c)}>
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
        </div>
      ))}
      <div style={{ padding: '0 16px 10px' }}>
        <button className="btn btn-outline btn-full" onClick={() => setModal('newChar')}>+ Add Character</button>
      </div>

      {story.type === 'chapters' ? (
        <>
          <div className="section-label">Chapters</div>
          {(story.chapters || []).map((ch, idx) => {
            const locked = isLocked(idx)
            return (
              <div key={ch.id} className={`ch-item stagger-item ${locked ? 'locked-ch' : ''}`} onClick={() => !locked && onChapter(ch)}>
                {locked && <><div className="fog-particles" /><div className="fog-overlay"><div className="fog-icon">🌫</div><div className="fog-text">Fog of War — Unlocks after Chapter {idx}</div></div></>}
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
        <button className="btn btn-sm btn-danger" onClick={() => { setDelTarget({ label: chapter.title, fn: onDeleteChapter }); setModal('confirm') }}>🗑</button>
      </div>
      <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${chapter.completed ? 'btn-gold' : 'btn-outline'}`} onClick={onToggleComplete}>
          {chapter.completed ? '✦ Completed' : 'Mark Complete'}
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => setModal('newPart')}>+ Add Part</button>
      </div>

      <div className="section-label">Chapter Writing</div>
      {edit ? (
        <div style={{ padding: '0 16px' }}>
          <textarea className="editor-area" style={{ margin: 0, width: '100%', minHeight: 240 }} value={content} onChange={e => setContent(e.target.value)} autoFocus />
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 4, fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>{wc} words</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-gold btn-sm" onClick={() => { onUpdateChapter({ content }); setEdit(false) }}>Save</button>
            <button className="btn btn-outline btn-sm" onClick={() => setEdit(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ cursor: 'text' }} onClick={() => setEdit(true)}>
          {chapter.content
            ? <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text)' }}>{chapter.content}</p>
            : <p style={{ color: 'var(--text3)', fontSize: 14 }}>Tap to write chapter content...</p>
          }
        </div>
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
function PartScreen({ story, chapter, part, onBack, onUpdate }) {
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
      <textarea className="editor-area" style={{ minHeight: 420 }} placeholder="Write this part of the story..." value={v} onChange={handle} autoFocus />
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', padding: '4px 16px 0', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>{wc} words</div>
    </div>
  )
}

// ── CHAR DETAIL SCREEN ─────────────────────────────────────────────────────
function CharDetailScreen({ story, char, onBack, setModal, setStatChapter, setDelTarget, onDeleteChar }) {
  return (
    <div className="screen-enter">
      <div className="screen-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>Character</h2>
        <button className="btn btn-sm btn-danger" onClick={() => { setDelTarget({ label: char.name, fn: onDeleteChar }); setModal('confirm') }}>🗑</button>
      </div>

      <div style={{ textAlign: 'center', padding: '16px 16px 8px' }}>
        <div className="char-detail-avatar">{(char.name || '?')[0].toUpperCase()}</div>
        <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 19, color: 'var(--gold2)', animation: 'shimmer 4s linear infinite', background: 'linear-gradient(90deg,var(--gold) 0%,var(--gold3) 40%,#fff 50%,var(--gold3) 60%,var(--gold) 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{char.name}</div>
        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 3, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 3 }}>{char.role}</div>
      </div>

      <div className="card">
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
      </div>

      <div className="card">
        <div className="card-title">Base Stats</div>
        <div className="stats-grid" style={{ marginTop: 10 }}>
          <CountUpStat value={char.level || 0} label="level" />
          <CountUpStat value={char.health || 0} label="health" />
          <CountUpStat value={char.speed || 0} label="speed" />
          <CountUpStat value={char.mana || 0} label="mana" />
        </div>
      </div>

      {char.lore && (
        <div className="card">
          <div className="card-title">Lore</div>
          <div className="card-body">{char.lore}</div>
        </div>
      )}

      {story.type === 'chapters' && story.chapters?.length > 0 && (
        <>
          <div className="section-label">Chapter Progression</div>
          {story.chapters.map((ch, idx) => {
            const prevOk = idx === 0 || story.chapters[idx - 1]?.completed
            const stats = char.chapterStats?.[ch.id]
            return (
              <div key={ch.id} className="ch-item stagger-item" style={{ margin: '0 16px 8px', position: 'relative' }}>
                {!prevOk && <><div className="fog-particles" /><div className="fog-overlay"><div className="fog-icon">🌫</div><div className="fog-text">Unlocks after Chapter {idx}</div></div></>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase' }}>Ch.{idx + 1} · {ch.title}</div>
                    {stats && (
                      <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                        {['level', 'health', 'speed', 'mana'].map(k => (
                          <div key={k} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 8, color: 'var(--text3)', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>{k}</div>
                            <div style={{ fontSize: 15, color: 'var(--gold2)', fontFamily: 'Cinzel,serif', fontWeight: 700 }}>{stats[k] || 0}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!stats && prevOk && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>No stats set yet</div>}
                  </div>
                  {prevOk && (
                    <button className="btn btn-outline btn-sm" onClick={() => { setStatChapter(ch); setModal('charStat') }}>
                      {stats ? 'Edit' : '+ Stats'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ── ONLINE TAB ─────────────────────────────────────────────────────────────
function OnlineTab({ online, stories, setModal }) {
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
      <div className="empty-desc">Online mode needs an active internet connection. Please check your network and try again.</div>
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
          <div key={c.id} className="card stagger-item">
            <div className="char-row">
              <div className="char-avatar">{(c.name || '?')[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div className="card-title">{c.name}</div>
                <div className="card-sub">{c.role} · {c.archetype}</div>
                <div className="char-badges">
                  {(c.affinities || []).map(a => <span key={a} className="badge" style={{ color: AFF_CLR[a] || 'var(--text2)', borderColor: AFF_CLR[a] || 'var(--border)' }}>{a}</span>)}
                  {c.grade && <span className="badge" style={{ color: GRADE_CLR[c.grade] || 'var(--gold)', borderColor: GRADE_CLR[c.grade] || 'var(--gold)' }}>{c.grade}</span>}
                </div>
                <div className="stats-grid" style={{ marginTop: 8 }}>
                  <CountUpStat value={c.level || 0} label="level" />
                  <CountUpStat value={c.health || 0} label="health" />
                  <CountUpStat value={c.speed || 0} label="speed" />
                  <CountUpStat value={c.mana || 0} label="mana" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </>}
      {reading.chapters?.length > 0 && <>
        <div className="section-label">Chapters</div>
        {reading.chapters.map((ch, idx) => (
          <div key={ch.id} className="card stagger-item">
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: 'var(--text3)', letterSpacing: 2 }}>CHAPTER {idx + 1}</div>
            <div className="card-title" style={{ marginTop: 3 }}>{ch.title}</div>
            {ch.content && <div className="card-body">{ch.content}</div>}
            {ch.parts?.map(p => (
              <div key={p.id} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: 'var(--gold)', marginBottom: 5 }}>{p.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text2)' }}>{p.content}</div>
              </div>
            ))}
          </div>
        ))}
      </>}
    </div>
  )

  return (
    <div className="screen-fade">
      <div className="online-hero">
        <h2>EvoTales Online</h2>
        <p>Share your stories or discover legends written by others across the realm.</p>
      </div>
      <div className="online-btn stagger-item" onClick={() => setModal('publish')}>
        <div className="online-btn-icon">⚔</div>
        <div>
          <div className="online-btn-title">Publish Your Story</div>
          <div className="online-btn-desc">Share a story from your library with all readers worldwide.</div>
        </div>
      </div>
      <div className="online-btn stagger-item" onClick={load}>
        <div className="online-btn-icon">📖</div>
        <div>
          <div className="online-btn-title">Discover Stories</div>
          <div className="online-btn-desc">{loading ? '⟳ Loading tales...' : `${published.length} published tales. Tap to refresh.`}</div>
        </div>
      </div>
      {published.length > 0 && <>
        <div className="section-label">Published Stories</div>
        {published.map(s => (
          <div key={s.id} className="pub-card stagger-item" onClick={() => setReading(s)}>
            <div className="card-title">{s.title}</div>
            <div className="card-sub">{s.genre}</div>
            <div className="card-body" style={{ fontSize: 13 }}>{(s.description || '').slice(0, 120)}{s.description?.length > 120 ? '...' : ''}</div>
            <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text3)', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>
              {s.characters?.length || 0} characters · {s.chapters?.length || 0} chapters
            </div>
          </div>
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
  const createChar = (data, sId) => { const s = stories.find(x => x.id === sId); patchStory(sId, { characters: [...s.characters, { id: uid(), ...data, chapterStats: {} }] }); showToast('Character created') }
  const deleteChar = (sId, charId) => { const s = stories.find(x => x.id === sId); patchStory(sId, { characters: s.characters.filter(c => c.id !== charId) }); setScreen('story'); setActiveChar(null); showToast('Character removed') }

  const publishStory = async sId => {
    if (!db) { showToast('Firebase unavailable'); return }
    const s = stories.find(x => x.id === sId)
    try {
      await addDoc(collection(db, 'published_stories'), {
        title: s.title, genre: s.genre, description: s.description,
        type: s.type, chapters: s.chapters || [], characters: s.characters || [],
        publishedAt: Date.now()
      })
      showToast('Published to Online')
      setModal(null)
    } catch (e) { showToast('Publish failed') }
  }

  const switchTab = t => { setTab(t); setScreen('home'); setActiveStory(null); setActiveChapter(null); setActivePart(null); setActiveChar(null) }

  const showFab = tab === 'library' && (screen === 'home' || (screen === 'story' && story?.type === 'chapters') || screen === 'chapter')
  const fabLabel = screen === 'home' ? '✦' : '+'
  const fabAction = () => {
    if (screen === 'home') setModal('newStory')
    else if (screen === 'story') setModal('newChapter')
    else if (screen === 'chapter') setModal('newPart')
  }

  // Story card click handler (delegated)
  const handleStoryClick = useCallback((e) => {
    const card = e.target.closest('[id^="story-"]')
    if (card) {
      const id = card.id.replace('story-', '')
      const s = stories.find(x => x.id === id)
      if (s) { setActiveStory(s); setScreen('story') }
    }
  }, [stories])

  const renderScreen = () => {
    if (screen === 'home') return <div onClick={handleStoryClick}><StoryList stories={stories} /></div>
    if (screen === 'story' && story) return <StoryScreen story={story} onBack={() => setScreen('home')} onChapter={ch => { setActiveChapter(ch); setScreen('chapter') }} onChar={c => { setActiveChar(c); setScreen('charDetail') }} onEdit={patch => patchStory(story.id, patch)} setModal={setModal} setDelTarget={setDelTarget} onDeleteStory={() => deleteStory(story.id)} />
    if (screen === 'chapter' && chapter) return <ChapterScreen story={story} chapter={chapter} onBack={() => setScreen('story')} onPart={p => { setActivePart(p); setScreen('part') }} onToggleComplete={() => patchChapter(story.id, chapter.id, { completed: !chapter.completed })} setModal={setModal} onUpdateChapter={patch => patchChapter(story.id, chapter.id, patch)} setDelTarget={setDelTarget} onDeleteChapter={() => deleteChapter(story.id, chapter.id)} />
    if (screen === 'part' && part) return <PartScreen story={story} chapter={chapter} part={part} onBack={() => setScreen('chapter')} onUpdate={patch => patchPart(story.id, chapter.id, part.id, patch)} />
    if (screen === 'charDetail' && char) return <CharDetailScreen story={story} char={char} onBack={() => setScreen('story')} setModal={setModal} setStatChapter={setStatChapter} setDelTarget={setDelTarget} onDeleteChar={() => deleteChar(story.id, char.id)} />
    return null
  }

  return (
    <div className="app">
      <div className="app-bg" />
      <RuneField />

      <nav className="nav">
        <div>
          <div className="nav-logo">EvoTales</div>
          <div className="nav-sub">Forge Your Legend</div>
        </div>
        <div className={`status-badge ${online ? 's-online' : 's-offline'}`}>
          <div className="sdot" />
          {online ? 'Online' : 'Offline'}
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
        {tab === 'library' ? renderScreen() : <OnlineTab online={online} stories={stories} setModal={setModal} />}
      </div>

      {showFab && <button className="fab" onClick={fabAction}>{fabLabel}</button>}

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
