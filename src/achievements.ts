/**
 * Story achievements — light, story-flavoured badges (no stat tracking that
 * would overlap trackers like SimTracker). Unlocks slide in as a small card.
 */

export interface AchievementDef {
  id: string
  icon: string
  title: string
  desc: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_spark', icon: '✨', title: 'First Spark', desc: 'Send your first message with Lumi Flair.' },
  { id: 'storyteller_100', icon: '📜', title: 'Storyteller', desc: 'Send 100 messages.' },
  { id: 'saga_1000', icon: '📚', title: 'Saga Weaver', desc: 'Send 1,000 messages.' },
  { id: 'milestone', icon: '🎉', title: 'Milestone', desc: 'Reach a message milestone in a chat.' },
  { id: 'night_owl', icon: '🦉', title: 'Night Owl', desc: 'Chat between midnight and 4 AM.' },
  { id: 'early_bird', icon: '🌅', title: 'Early Bird', desc: 'Chat between 5 and 7 AM.' },
  { id: 'streak_3', icon: '🔥', title: 'Kindled', desc: 'Chat on 3 days in a row.' },
  { id: 'streak_7', icon: '☄️', title: 'Devoted', desc: 'Chat on 7 days in a row.' },
  { id: 'director', icon: '🎬', title: 'Action!', desc: 'The AI directs its first scene.' },
  { id: 'weather', icon: '🌦️', title: 'Weather Watcher', desc: 'Experience 4 different ambient scenes.' },
  { id: 'moods', icon: '🎭', title: 'Emotional Range', desc: 'See 5 different moods in one chat.' },
  { id: 'showstopper', icon: '🎆', title: 'Showstopper', desc: 'The AI triggers a screen effect.' },
  { id: 'choices_10', icon: '🧭', title: 'Pathfinder', desc: 'Pick 10 suggested choices.' },
  { id: 'shutterbug', icon: '📸', title: 'Shutterbug', desc: 'Create a Moment Card.' },
  { id: 'packrat', icon: '🎨', title: 'Set Dresser', desc: 'Apply a Flair Pack.' },
]

export interface AchievementData {
  unlocked: Record<string, number>
  sent: number
  choices: number
  scenes: string[]
  lastDay: string
  streak: number
  moodsByChat: Record<string, string[]>
}

export const EMPTY_ACHIEVEMENTS: AchievementData = {
  unlocked: {},
  sent: 0,
  choices: 0,
  scenes: [],
  lastDay: '',
  streak: 0,
  moodsByChat: {},
}

export function normalizeAchievements(raw: unknown): AchievementData {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<AchievementData>
  return {
    unlocked: r.unlocked && typeof r.unlocked === 'object' ? { ...r.unlocked } : {},
    sent: typeof r.sent === 'number' ? r.sent : 0,
    choices: typeof r.choices === 'number' ? r.choices : 0,
    scenes: Array.isArray(r.scenes) ? r.scenes.slice(0, 20) : [],
    lastDay: typeof r.lastDay === 'string' ? r.lastDay : '',
    streak: typeof r.streak === 'number' ? r.streak : 0,
    moodsByChat: r.moodsByChat && typeof r.moodsByChat === 'object' ? { ...r.moodsByChat } : {},
  }
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** Update counters for a sent message; returns newly earned ids. */
export function onSent(data: AchievementData, now = new Date()): string[] {
  const earned: string[] = ['first_spark']
  data.sent += 1
  if (data.sent >= 100) earned.push('storyteller_100')
  if (data.sent >= 1000) earned.push('saga_1000')
  const h = now.getHours()
  if (h < 4) earned.push('night_owl')
  if (h >= 5 && h < 7) earned.push('early_bird')
  const today = dayKey(now)
  if (data.lastDay !== today) {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    data.streak = data.lastDay === dayKey(y) ? data.streak + 1 : 1
    data.lastDay = today
  }
  if (data.streak >= 3) earned.push('streak_3')
  if (data.streak >= 7) earned.push('streak_7')
  return earned
}

export function onScene(data: AchievementData, scene: string): string[] {
  if (scene && scene !== 'off' && !data.scenes.includes(scene)) data.scenes.push(scene)
  return data.scenes.length >= 4 ? ['weather'] : []
}

export function onMood(data: AchievementData, chatId: string, label: string): string[] {
  if (!label) return []
  const list = data.moodsByChat[chatId] ?? []
  if (!list.includes(label)) list.push(label)
  data.moodsByChat[chatId] = list.slice(-12)
  const chats = Object.keys(data.moodsByChat)
  if (chats.length > 40) delete data.moodsByChat[chats[0]]
  return list.length >= 5 ? ['moods'] : []
}

export const ACHIEVEMENT_CSS = `
.lf-unlock { position: fixed; top: 18px; right: 18px; z-index: 2147483001; pointer-events: none;
  display: flex; align-items: center; gap: 12px; padding: 12px 16px 12px 12px; min-width: 240px; max-width: 340px;
  border-radius: 14px; color: var(--lumiverse-text, #fff);
  background: color-mix(in srgb, var(--lumiverse-bg-elevated, #231e30) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--lf-c, #9370db) 55%, transparent);
  box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 22px color-mix(in srgb, var(--lf-c, #9370db) 35%, transparent);
  backdrop-filter: blur(10px);
  animation: lf-unlock-in .6s cubic-bezier(.2,1.3,.4,1) both, lf-unlock-out .5s ease 4.2s forwards; }
.lf-unlock .lf-unlock-ico { font-size: 28px; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px;
  background: color-mix(in srgb, var(--lf-c, #9370db) 18%, transparent); box-shadow: inset 0 0 12px color-mix(in srgb, var(--lf-c, #9370db) 30%, transparent); }
.lf-unlock small { display: block; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--lf-c, #9370db); font-weight: 700; }
.lf-unlock b { display: block; font-size: 14px; }
.lf-unlock span.lf-unlock-desc { display: block; font-size: 12px; color: var(--lumiverse-text-muted, #bbb); }
@keyframes lf-unlock-in { from { opacity: 0; transform: translateX(30px) scale(.95); } to { opacity: 1; transform: none; } }
@keyframes lf-unlock-out { to { opacity: 0; transform: translateY(-10px); } }

.lf-badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
.lf-badge-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 8px; border-radius: 10px; text-align: center;
  background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
.lf-badge-card .lf-badge-ico { font-size: 22px; filter: grayscale(1) opacity(.35); }
.lf-badge-card b { font-size: calc(12px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-muted); }
.lf-badge-card.lf-got { border-color: color-mix(in srgb, var(--lf-c, #9370db) 45%, transparent);
  box-shadow: inset 0 0 14px color-mix(in srgb, var(--lf-c, #9370db) 14%, transparent); }
.lf-badge-card.lf-got .lf-badge-ico { filter: none; }
.lf-badge-card.lf-got b { color: var(--lumiverse-text); }
`
