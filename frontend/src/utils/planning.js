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
const MOTIF_STYLES = {
  CONGE:           { bg: 'bg-green-500/20',  text: 'text-green-300',  dot: 'bg-green-400'  },
  MALADIE:         { bg: 'bg-red-500/20',    text: 'text-red-300',    dot: 'bg-red-400'    },
  TEMPS_PARTIEL:   { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-400' },
  MISSION:         { bg: 'bg-blue-500/20',   text: 'text-blue-300',   dot: 'bg-blue-400'   },
  REUNION:         { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-400' },
  GESTION:         { bg: 'bg-amber-900/30',  text: 'text-amber-300',  dot: 'bg-amber-500'  },
  PAS_AFFECTATION: { bg: 'bg-surface-5',     text: 'text-ink-3',      dot: 'bg-ink-4'      },
  FORMATION:       { bg: 'bg-cyan-500/20',   text: 'text-cyan-300',   dot: 'bg-cyan-400'   },
  VISITE:          { bg: 'bg-rose-500/20',   text: 'text-rose-300',   dot: 'bg-rose-400'   },
  OFIS:            { bg: 'bg-slate-600/20',  text: 'text-slate-300',  dot: 'bg-slate-400'  },
}

export function getMotifStyle(code) {
  return MOTIF_STYLES[code] || { bg: 'bg-surface-4', text: 'text-ink-2', dot: 'bg-ink-3' }
}

export function formatWeekLabel(weekNum, year) {
  return `S${String(weekNum).padStart(2, '0')}`
}
