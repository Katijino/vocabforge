/**
 * SM-2 spaced repetition algorithm
 * grade: 0=Again, 2=Hard, 3=Good, 5=Easy
 */

export interface SrsState {
  ease_factor: number
  interval_days: number
  repetitions: number
  due_date: string
}

/** Applies an SM-2 grade to the current card state and returns the updated state with new due date. */
export function applyGrade(current: SrsState, grade: 0 | 2 | 3 | 5): SrsState {
  let { ease_factor, interval_days, repetitions } = current

  if (grade < 3) {
    // Failed — reset
    repetitions = 0
    interval_days = 1
  } else {
    // Passed
    if (repetitions === 0) {
      interval_days = 1
    } else if (repetitions === 1) {
      interval_days = 6
    } else {
      interval_days = Math.round(interval_days * ease_factor)
    }
    repetitions += 1
  }

  // Update ease factor (min 1.3)
  ease_factor = ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)
  ease_factor = Math.max(1.3, ease_factor)

  const due = new Date()
  due.setDate(due.getDate() + interval_days)
  const due_date = due.toISOString().split('T')[0]

  return { ease_factor, interval_days, repetitions, due_date }
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function defaultCard(word_id: string, user_id: string) {
  return {
    user_id,
    word_id,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    due_date: '9999-12-31',
    last_reviewed: null,
  }
}
