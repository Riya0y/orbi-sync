// Simplified orbital mechanics for the demo scenario.
// Every object follows a circular two-body orbit. This is intentionally simple:
// it is good enough to draw believable orbits and to find close approaches
// between our simulated objects, but it is NOT a flight-dynamics propagator.

export const EARTH_RADIUS_KM = 6378.137
export const EARTH_MU = 398600.4418 // km^3 / s^2

const DEG = Math.PI / 180

export function semiMajorAxisKm(orbit) {
  return EARTH_RADIUS_KM + orbit.altitudeKm
}

export function meanMotionRadPerSec(orbit) {
  const a = semiMajorAxisKm(orbit)
  return Math.sqrt(EARTH_MU / (a * a * a))
}

export function orbitalPeriodSeconds(orbit) {
  return (2 * Math.PI) / meanMotionRadPerSec(orbit)
}

export function circularVelocityKmS(orbit) {
  return Math.sqrt(EARTH_MU / semiMajorAxisKm(orbit))
}

function argumentOfLatitude(orbit, secondsSinceEpoch) {
  return orbit.argumentOfLatitudeDeg * DEG + meanMotionRadPerSec(orbit) * secondsSinceEpoch
}

// Position (km) in an Earth-centred inertial frame.
function eciFromAngle(orbit, u) {
  const r = semiMajorAxisKm(orbit)
  const i = orbit.inclinationDeg * DEG
  const raan = orbit.raanDeg * DEG
  const cosU = Math.cos(u)
  const sinU = Math.sin(u)
  const cosO = Math.cos(raan)
  const sinO = Math.sin(raan)
  const cosI = Math.cos(i)
  return {
    x: r * (cosO * cosU - sinO * sinU * cosI),
    y: r * (sinO * cosU + cosO * sinU * cosI),
    z: r * (sinU * Math.sin(i)),
  }
}

export function positionEci(orbit, secondsSinceEpoch) {
  return eciFromAngle(orbit, argumentOfLatitude(orbit, secondsSinceEpoch))
}

export function velocityEci(orbit, secondsSinceEpoch) {
  const u = argumentOfLatitude(orbit, secondsSinceEpoch)
  const v = circularVelocityKmS(orbit)
  const i = orbit.inclinationDeg * DEG
  const raan = orbit.raanDeg * DEG
  const cosU = Math.cos(u)
  const sinU = Math.sin(u)
  const cosO = Math.cos(raan)
  const sinO = Math.sin(raan)
  const cosI = Math.cos(i)
  return {
    x: v * (-cosO * sinU - sinO * cosU * cosI),
    y: v * (-sinO * sinU + cosO * cosU * cosI),
    z: v * (cosU * Math.sin(i)),
  }
}

// A full closed ring of points describing the orbit, used to draw the path.
export function orbitRingEci(orbit, segments = 180) {
  const points = []
  for (let k = 0; k <= segments; k++) {
    points.push(eciFromAngle(orbit, (k / segments) * 2 * Math.PI))
  }
  return points
}

function distanceKm(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function separationAt(objA, objB, t) {
  return distanceKm(positionEci(objA.orbit, t), positionEci(objB.orbit, t))
}

// Golden-section search for the exact minimum separation inside [lo, hi].
function refineMinimum(objA, objB, lo, hi) {
  const ratio = (Math.sqrt(5) - 1) / 2
  let a = lo
  let b = hi
  let c = b - ratio * (b - a)
  let d = a + ratio * (b - a)
  for (let iter = 0; iter < 60; iter++) {
    if (separationAt(objA, objB, c) < separationAt(objA, objB, d)) b = d
    else a = c
    c = b - ratio * (b - a)
    d = a + ratio * (b - a)
  }
  const t = (a + b) / 2
  return { t, missKm: separationAt(objA, objB, t) }
}

export function classifyRisk(missKm, thresholds) {
  if (missKm < thresholds.critical) return 'critical'
  if (missKm < thresholds.warning) return 'warning'
  return 'monitor'
}

// Screens every pair of objects for close approaches inside the time window.
// Each pair is reported once, using its closest encounter.
export function screenConjunctions(objects, epochIso, screening) {
  const epochMs = Date.parse(epochIso)
  const windowSeconds = screening.windowHours * 3600
  const step = screening.coarseStepSeconds
  const results = []

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      const objA = objects[i]
      const objB = objects[j]
      let best = null
      let encounters = 0
      let prev = separationAt(objA, objB, 0)
      let curr = separationAt(objA, objB, step)

      for (let t = step; t < windowSeconds; t += step) {
        const next = separationAt(objA, objB, t + step)
        const isLocalMinimum = curr <= prev && curr <= next
        if (isLocalMinimum && curr < 400) {
          const refined = refineMinimum(objA, objB, t - step, t + step)
          if (refined.missKm < screening.reportThresholdKm) {
            encounters++
            if (!best || refined.missKm < best.missKm) best = refined
          }
        }
        prev = curr
        curr = next
      }

      if (best) {
        const va = velocityEci(objA.orbit, best.t)
        const vb = velocityEci(objB.orbit, best.t)
        results.push({
          id: `cnj-${objA.id}-${objB.id}`,
          objectA: objA.id,
          objectB: objB.id,
          tcaIso: new Date(epochMs + best.t * 1000).toISOString(),
          tcaSecondsFromEpoch: best.t,
          missDistanceKm: best.missKm,
          relativeVelocityKmS: Math.hypot(va.x - vb.x, va.y - vb.y, va.z - vb.z),
          encountersInWindow: encounters,
          risk: classifyRisk(best.missKm, screening.riskThresholdsKm),
          // Collision probability needs covariance (uncertainty) data that this
          // simulated dataset does not have, so we deliberately leave it empty.
          collisionProbability: null,
          source: 'computed-from-simulated-orbits',
        })
      }
    }
  }

  const order = { critical: 0, warning: 1, monitor: 2 }
  return results.sort((a, b) => order[a.risk] - order[b.risk] || a.tcaSecondsFromEpoch - b.tcaSecondsFromEpoch)
}

// Greenwich Mean Sidereal Time (radians) — used to turn inertial positions
// into latitude / longitude for the information panel.
export function gmstRadians(date) {
  const jd = date.getTime() / 86400000 + 2440587.5
  const t = (jd - 2451545.0) / 36525
  let gmstDeg =
    280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000
  gmstDeg = ((gmstDeg % 360) + 360) % 360
  return gmstDeg * DEG
}

export function subSatellitePoint(orbit, secondsSinceEpoch, date) {
  const p = positionEci(orbit, secondsSinceEpoch)
  const r = Math.hypot(p.x, p.y, p.z)
  const lat = Math.asin(p.z / r) / DEG
  let lon = (Math.atan2(p.y, p.x) - gmstRadians(date)) / DEG
  lon = ((((lon + 180) % 360) + 360) % 360) - 180
  return { latDeg: lat, lonDeg: lon, altitudeKm: r - EARTH_RADIUS_KM }
}
