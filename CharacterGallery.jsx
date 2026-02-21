import { useRef, useState, useEffect } from 'react'
import { AFF_CLR, GRADE_CLR } from './constants.js'

// ── PURE CSS HORIZONTAL DRAG CAROUSEL ─────────────────────────────────────
// No external dependencies — works everywhere

function CharCard({ card }) {
  const { name, level, grade, affinities, skills, stats } = card
  const gradeClr = GRADE_CLR[grade] || '#c9a84c'

  return (
    <div style={{
      width: 200, height: 320, flexShrink: 0,
      background: 'linear-gradient(160deg,#1a1530 0%,#0d0a1a 100%)',
      border: '1px solid rgba(201,168,76,0.4)',
      borderRadius: 14, padding: 14, position: 'relative',
      overflow: 'hidden', userSelect: 'none',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.05)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.6),0 0 30px rgba(201,168,76,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5),0 0 20px rgba(201,168,76,0.05)' }}
    >
      {/* Top gold shimmer line */}
      <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg,transparent,#f0c060,transparent)' }} />

      {/* Avatar */}
      <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 8px', background: 'radial-gradient(circle at 40% 35%,#9b3dab,#2d1550)', border: '2px solid rgba(201,168,76,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontFamily: 'Cinzel,serif', color: '#f0c060', boxShadow: '0 0 20px rgba(123,45,139,0.5)' }}>
        {(name || '?')[0].toUpperCase()}
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center', fontFamily: 'Cinzel,serif', fontSize: 13, fontWeight: 700, color: '#f0c060', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>

      {/* Grade + Level */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontFamily: 'Cinzel,serif', color: gradeClr, textShadow: `0 0 8px ${gradeClr}`, letterSpacing: 0.5 }}>{grade}</span>
        <span style={{ fontSize: 9, fontFamily: 'Cinzel,serif', color: 'var(--text3)', letterSpacing: 1 }}>LVL {level || 1}</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(201,168,76,0.15)', marginBottom: 8 }} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 6 }}>
        {[['HP', (stats?.hp || 0).toLocaleString()], ['MP', (stats?.mana || 0).toLocaleString()], ['SPD', stats?.speed || 0]].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '4px 2px', border: '1px solid rgba(201,168,76,0.1)' }}>
            <div style={{ fontSize: 7, fontFamily: 'Cinzel,serif', color: 'var(--text3)', letterSpacing: 1 }}>{k}</div>
            <div style={{ fontSize: 10, fontFamily: 'Cinzel,serif', color: '#f0c060', fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* ATK note */}
      <div style={{ fontSize: 8, color: '#4a4270', fontFamily: 'Cinzel,serif', textAlign: 'center', marginBottom: 8 }}>⚔ ATK via skills</div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(201,168,76,0.1)', marginBottom: 6 }} />

      {/* Affinities */}
      {(affinities || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6, justifyContent: 'center' }}>
          {(affinities || []).slice(0, 4).map(a => (
            <span key={a} style={{ fontSize: 8, padding: '1px 6px', borderRadius: 10, border: `1px solid ${AFF_CLR[a] || '#c9a84c'}`, color: AFF_CLR[a] || '#c9a84c', background: `${AFF_CLR[a]}15` || 'transparent', fontFamily: 'Cinzel,serif' }}>{a}</span>
          ))}
        </div>
      )}

      {/* Skills */}
      <div style={{ fontSize: 8, fontFamily: 'Cinzel,serif', color: 'var(--text3)', letterSpacing: 1, marginBottom: 4 }}>SKILLS</div>
      {(skills || []).length === 0
        ? <div style={{ fontSize: 10, color: '#3d3465', textAlign: 'center', fontFamily: 'Cinzel,serif' }}>No skills</div>
        : (skills || []).slice(0, 3).map(sk => (
          <div key={sk.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, padding: '2px 0 2px 6px', borderLeft: `2px solid ${AFF_CLR[sk.element] || '#c9a84c'}` }}>
            <span style={{ fontSize: 9, color: '#e8e0ff', fontFamily: 'Cinzel,serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sk.name}</span>
            <span style={{ fontSize: 8, color: AFF_CLR[sk.element] || '#c9a84c', fontFamily: 'Cinzel,serif', marginLeft: 4, whiteSpace: 'nowrap' }}>Lv.{sk.level}</span>
          </div>
        ))
      }
      {(skills || []).length > 3 && <div style={{ fontSize: 8, color: '#6b6390', textAlign: 'center', fontFamily: 'Cinzel,serif' }}>+{skills.length - 3} more</div>}

      {/* Bottom glow */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to top,${gradeClr}08,transparent)`, pointerEvents: 'none' }} />
    </div>
  )
}

export default function CharacterGallery({ cards = [] }) {
  const trackRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const velRef = useRef(0)
  const lastX = useRef(0)
  const rafRef = useRef(null)

  // Duplicate cards for infinite feel
  const displayCards = cards.length > 0 ? [...cards, ...cards, ...cards] : []

  const onDown = (e) => {
    isDragging.current = true
    startX.current = (e.touches ? e.touches[0].clientX : e.clientX)
    scrollLeft.current = trackRef.current.scrollLeft
    lastX.current = startX.current
    velRef.current = 0
    cancelAnimationFrame(rafRef.current)
    if (trackRef.current) trackRef.current.style.cursor = 'grabbing'
  }

  const onMove = (e) => {
    if (!isDragging.current) return
    const x = e.touches ? e.touches[0].clientX : e.clientX
    velRef.current = x - lastX.current
    lastX.current = x
    const walk = (startX.current - x) * 1.2
    trackRef.current.scrollLeft = scrollLeft.current + walk
  }

  const onUp = () => {
    isDragging.current = false
    if (trackRef.current) trackRef.current.style.cursor = 'grab'
    // Momentum
    const decel = () => {
      velRef.current *= 0.92
      if (trackRef.current) trackRef.current.scrollLeft -= velRef.current
      if (Math.abs(velRef.current) > 0.5) rafRef.current = requestAnimationFrame(decel)
    }
    rafRef.current = requestAnimationFrame(decel)
  }

  // Infinite scroll: reset position when near edges
  const onScroll = () => {
    if (!trackRef.current || cards.length === 0) return
    const el = trackRef.current
    const cardW = 216 // 200 + 16 gap
    const totalOneSet = cardW * cards.length
    // If scrolled past 2 sets, reset to 1 set mark
    if (el.scrollLeft >= totalOneSet * 2) el.scrollLeft -= totalOneSet
    // If scrolled before 1 set, reset to 1 set mark
    if (el.scrollLeft <= 0) el.scrollLeft += totalOneSet
  }

  useEffect(() => {
    const el = trackRef.current
    if (!el || cards.length === 0) return
    // Start in the middle set
    const cardW = 216
    el.scrollLeft = cardW * cards.length
    return () => cancelAnimationFrame(rafRef.current)
  }, [cards.length])

  if (!cards.length) return null

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(90deg,var(--bg),transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(270deg,var(--bg),transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <div
        ref={trackRef}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        onScroll={onScroll}
        style={{
          display: 'flex', gap: 16, overflowX: 'scroll', padding: '12px 40px 20px',
          cursor: 'grab', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          userSelect: 'none',
        }}
      >
        <style>{`.char-gallery-track::-webkit-scrollbar{display:none}`}</style>
        {displayCards.map((card, i) => <CharCard key={`${card.name}-${i}`} card={card} />)}
      </div>
    </div>
  )
}
