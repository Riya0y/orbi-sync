// Single place where the UI gets its data.
// Today it reads local JSON files. When the backend is ready, replace the
// body of each function with a request to the real API — the components that
// use this data do not need to change.

import orbitalData from '@/data/orbital-objects.json'
import missionStatus from '@/data/mission-status.json'
import { screenConjunctions } from '@/lib/orbits'

export async function getOrbitalScenario() {
  return {
    meta: orbitalData.meta,
    objects: orbitalData.objects,
  }
}

export async function getMissionStatus() {
  return missionStatus
}

// Close approaches are calculated from the simulated orbits above.
// Later this will be replaced by conjunction results from the backend.
export async function getConjunctions(scenario, status) {
  return screenConjunctions(scenario.objects, scenario.meta.epoch, status.screening)
}
