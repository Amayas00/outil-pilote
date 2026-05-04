import { startOfWeek, endOfWeek, addDays, addWeeks, format, isWeekend,
         isSameDay, parseISO, eachWeekOfInterval, getISOWeek, getYear } from 'date-fns'
import { fr } from 'date-fns/locale'

/** Build an array of {date, weekNum, year, isWeekend} for N weeks starting from date */
export function buildWeekRange(startDate, nbWeeks = 40) {
  const weeks = []
  for (let w = 0; w < nbWeeks; w++) {
    const weekStart = addWeeks(startOfWeek(startDate, { weekStartsOn: 1 }), w)
    const days = []
    for (let d = 0; d < 5; d++) { // Mon–Fri only
      const date = addDays(weekStart, d)
      days.push({
        date,
        iso: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEE', { locale: fr }),
        dayNum: format(date, 'd'),
        isToday: isSameDay(date, new Date()),
      })
    }
    weeks.push({
      weekNum: getISOWeek(weekStart),
      year: getYear(weekStart),
      startIso: format(weekStart, 'yyyy-MM-dd'),
      days,
    })
  }
  return weeks
}

/** Index planning entries by "collaborateurId-date-demiJournee" for O(1) lookup */
export function indexEntries(entries) {
  const idx = {}
  for (const e of entries) {
    idx[`${e.collaborateur}-${e.jour}-${e.demi_journee}`] = e
  }
  return idx
}

/** Get entry for a given cell */
export function getCellEntry(index, collabId, iso, demiJournee) {
  return index[`${collabId}-${iso}-${demiJournee}`] || null
}

/** Return Tailwind bg + text classes from motif code */
const MOTIF_COLORS = {
  CONGE:           { hex: '#16A34A', bg: '#F0FAF4' },
  MALADIE:         { hex: '#DC2626', bg: '#FFF5F5' },
  TEMPS_PARTIEL:   { hex: '#EA580C', bg: '#FFF7ED' },
  MISSION:         { hex: '#00008F', bg: '#E6E6FF' },
  REUNION:         { hex: '#9333EA', bg: '#FAF5FF' },
  GESTION:         { hex: '#B45309', bg: '#FFFBEB' },
  PAS_AFFECTATION: { hex: '#64748B', bg: '#F8FAFC' },
  FORMATION:       { hex: '#0891B2', bg: '#ECFEFF' },
  VISITE:          { hex: '#E11D48', bg: '#FFF1F2' },
  OFIS:            { hex: '#475569', bg: '#F1F5F9' },
}

export function getMotifStyle(code) {
  const c = MOTIF_COLORS[code] || { hex: '#64748B', bg: '#F8FAFC' }
  return { hex: c.hex, bg: `bg-[${c.bg}]`, dot: '', hexBg: c.bg }
}

export function formatWeekLabel(weekNum, year) {
  return `S${String(weekNum).padStart(2, '0')}`
}
