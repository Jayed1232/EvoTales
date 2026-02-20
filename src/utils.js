export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export const LS = {
  get: (k, d = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)) } catch {}
  }
}
