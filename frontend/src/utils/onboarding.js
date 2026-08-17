const KEY = 'clarion.onboarding.v1'

const defaults = {
  welcomeDismissed: false,
  firstReportSeen: false,
  completedDemo: false,
}

export function getOnboarding() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...defaults }
  }
}

export function patchOnboarding(patch) {
  const next = { ...getOnboarding(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function markDemoCompleted() {
  return patchOnboarding({ completedDemo: true })
}

export function dismissWelcome() {
  return patchOnboarding({ welcomeDismissed: true })
}

export function markFirstReportSeen() {
  return patchOnboarding({ firstReportSeen: true })
}
