import { useRef, useEffect } from 'react'
import { AFF_CLR, GRADE_CLR } from './constants.js'

const SKILL_TYPE_CLR = { Attack: '#ff4d4d', Buff: '#4caf50', Debuff: '#9b5de5' }

function CharCard({ card, onClick }) {
  const { name, level, grade, affinities, skills, stats } = card
  const gradeClr = GRADE_CLR[grade] || '#c9a84c'

  return (
    <div
      onClick={onClick}
      style={{
        width: 200, minHeight: 300, flexShrink: 0,
        background: 'linear-gradient(160deg,#1a1530 0%,#0d0a1a 100%)',
        border: '1px solid rgba(201,168,76,0.35)',
        borderRadius: 14, padding: 14, position: 'relative',
        overflow: 'hidden', userSelect: 'none', cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5),0 0 20px rgba(201,168,76,0.04)',
        transition: 'transform 0.2s,box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.03)'
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.6),0 0 30px rgba(201,168,76,0.18)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5),0 0 20px rgba(201,168,76,0.04)'
      }}
    >
      {/* shimmer top */}
      <div style={{ position:'absolute',top:0,left:'15%',right:'15%',height:1,background:'linear-gradient(90deg,transparent,#f0c060,transparent)' }} />

      {/* Avatar */}
      <div style={{ width:64,height:64,borderRadius:'50%',margin:'0 auto 8px',background:'radial-gradient(circle at 40% 35%,#9b3dab,#2d1550)',border:'2px solid '+gradeClr,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontFamily:'Cinzel,serif',color:'#f0c060',boxShadow:'0 0 20px rgba(123,45,139,0.5)' }}>
        {(name||'?')[0].toUpperCase()}
      </div>

      {/* Name */}
      <div style={{ textAlign:'center',fontFamily:'Cinzel,serif',fontSize:13,fontWeight:700,color:'#f0c060',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{name}</div>

      {/* Grade + Level */}
      <div style={{ display:'flex',justifyContent:'center',gap:8,marginBottom:8 }}>
        <span style={{ fontSize:9,fontFamily:'Cinzel,serif',color:gradeClr,textShadow:'0 0 8px '+gradeClr,letterSpacing:0.5 }}>{grade}</span>
        <span style={{ fontSize:9,fontFamily:'Cinzel,serif',color:'rgba(200,190,240,0.5)',letterSpacing:1 }}>LVL {level||1}</span>
      </div>

      <div style={{ height:1,background:'rgba(201,168,76,0.15)',marginBottom:8 }} />

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4,marginBottom:6 }}>
        {[['HP',(stats?.hp||0).toLocaleString()],['MP',(stats?.mana||0).toLocaleString()],['SPD',stats?.speed||0]].map(([k,v]) => (
          <div key={k} style={{ textAlign:'center',background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'4px 2px',border:'1px solid rgba(201,168,76,0.1)' }}>
            <div style={{ fontSize:7,fontFamily:'Cinzel,serif',color:'rgba(200,190,240,0.5)',letterSpacing:1 }}>{k}</div>
            <div style={{ fontSize:10,fontFamily:'Cinzel,serif',color:'#f0c060',fontWeight:700 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:8,color:'#4a4270',fontFamily:'Cinzel,serif',textAlign:'center',marginBottom:8 }}>⚔ ATK via skills</div>
      <div style={{ height:1,background:'rgba(201,168,76,0.1)',marginBottom:6 }} />

      {/* Affinities */}
      {(affinities||[]).length>0 && (
        <div style={{ display:'flex',flexWrap:'wrap',gap:3,marginBottom:6,justifyContent:'center' }}>
          {(affinities||[]).slice(0,4).map(a => (
            <span key={a} style={{ fontSize:8,padding:'1px 6px',borderRadius:10,border:'1px solid '+(AFF_CLR[a]||'#c9a84c'),color:AFF_CLR[a]||'#c9a84c',background:(AFF_CLR[a]||'#c9a84c')+'15',fontFamily:'Cinzel,serif' }}>{a}</span>
          ))}
        </div>
      )}

      {/* Skills */}
      <div style={{ fontSize:8,fontFamily:'Cinzel,serif',color:'rgba(200,190,240,0.5)',letterSpacing:1,marginBottom:4 }}>SKILLS</div>
      {!(skills||[]).length
        ? <div style={{ fontSize:10,color:'#3d3465',textAlign:'center',fontFamily:'Cinzel,serif' }}>No skills</div>
        : (skills||[]).slice(0,3).map(sk => (
          <div key={sk.id||sk.name} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3,padding:'2px 0 2px 6px',borderLeft:'2px solid '+(AFF_CLR[sk.element]||'#c9a84c') }}>
            <span style={{ fontSize:9,color:'#e8e0ff',fontFamily:'Cinzel,serif',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{sk.name}</span>
            <span style={{ fontSize:8,color:SKILL_TYPE_CLR[sk.type]||'#c9a84c',fontFamily:'Cinzel,serif',marginLeft:4,whiteSpace:'nowrap' }}>Lv.{sk.level}</span>
          </div>
        ))
      }
      {(skills||[]).length>3 && (
        <div style={{ fontSize:9,color:'#c9a84c',textAlign:'center',fontFamily:'Cinzel,serif',marginTop:4,opacity:0.7 }}>+{skills.length-3} more — tap to view all</div>
      )}

      {/* click hint */}
      <div style={{ position:'absolute',bottom:8,right:10,fontSize:8,color:'rgba(201,168,76,0.4)',fontFamily:'Cinzel,serif' }}>tap for details ›</div>

      {/* bottom grade glow */}
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:40,background:'linear-gradient(to top,'+gradeClr+'08,transparent)',pointerEvents:'none' }} />
    </div>
  )
}

export default function CharacterGallery({ cards = [], onCharClick }) {
  const trackRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollStart = useRef(0)
  const moved = useRef(0)
  const velRef = useRef(0)
  const lastX = useRef(0)
  const rafRef = useRef(null)

  const onDown = (e) => {
    isDragging.current = true
    moved.current = 0
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    startX.current = cx
    lastX.current = cx
    scrollStart.current = trackRef.current.scrollLeft
    velRef.current = 0
    cancelAnimationFrame(rafRef.current)
    if (trackRef.current) trackRef.current.style.cursor = 'grabbing'
  }

  const onMove = (e) => {
    if (!isDragging.current) return
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    velRef.current = cx - lastX.current
    lastX.current = cx
    const walk = startX.current - cx
    moved.current = Math.abs(walk)
    trackRef.current.scrollLeft = scrollStart.current + walk
  }

  const onUp = (e) => {
    const wasDrag = moved.current > 5
    isDragging.current = false
    if (trackRef.current) trackRef.current.style.cursor = 'grab'
    // momentum
    const decel = () => {
      velRef.current *= 0.9
      if (trackRef.current) trackRef.current.scrollLeft -= velRef.current
      if (Math.abs(velRef.current) > 0.5) rafRef.current = requestAnimationFrame(decel)
    }
    rafRef.current = requestAnimationFrame(decel)
    return wasDrag
  }

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  if (!cards.length) return null

  return (
    <div style={{ position:'relative',width:'100%',overflow:'hidden' }}>
      {/* fade edges */}
      <div style={{ position:'absolute',left:0,top:0,bottom:0,width:40,background:'linear-gradient(90deg,var(--bg),transparent)',zIndex:2,pointerEvents:'none' }} />
      <div style={{ position:'absolute',right:0,top:0,bottom:0,width:40,background:'linear-gradient(270deg,var(--bg),transparent)',zIndex:2,pointerEvents:'none' }} />

      <div
        ref={trackRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={() => { if (isDragging.current) onUp() }}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
        style={{
          display:'flex',gap:16,overflowX:'scroll',padding:'12px 40px 20px',
          cursor:'grab',scrollbarWidth:'none',WebkitOverflowScrolling:'touch',
          userSelect:'none',msOverflowStyle:'none',
        }}
      >
        {cards.map((card, i) => (
          <CharCard
            key={card.name+'-'+i}
            card={card}
            onClick={() => {
              // only fire click if not a drag
              if (moved.current < 6 && onCharClick) onCharClick(card)
            }}
          />
        ))}
      </div>
    </div>
  )
}
