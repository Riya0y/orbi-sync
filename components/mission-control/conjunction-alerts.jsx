'use client'

import { motion } from 'framer-motion'
import { Crosshair } from 'lucide-react'
import { RISK_LEVELS } from '@/lib/object-types'
import { formatCountdown, formatNumber } from '@/lib/format'

export function ConjunctionAlerts({ conjunctions, objectsById, activeId, onInspect, simTimeMs, epochMs }) {
  return (
    <motion.section
      aria-labelledby="alerts-heading"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="alerts-heading" className="font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">
          Close approach alerts
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Computed from simulated orbits
        </p>
      </div>

      {conjunctions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No close approaches inside the screening window.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {conjunctions.map((conj) => {
            const risk = RISK_LEVELS[conj.risk]
            const isActive = conj.id === activeId
            const tcaMs = epochMs + conj.tcaSecondsFromEpoch * 1000
            return (
              <li key={conj.id}>
                <button
                  type="button"
                  onClick={() => onInspect(conj.id)}
                  aria-pressed={isActive}
                  className={`group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-md border px-4 py-3 text-left backdrop-blur-xl transition-colors ${
                    isActive
                      ? 'border-foreground/20 bg-navy/80'
                      : 'border-border bg-space/50 hover:border-foreground/15 hover:bg-navy/60'
                  }`}
                >
                  <span className="relative flex size-2.5" aria-hidden="true">
                    {conj.risk === 'critical' && (
                      <span className={`absolute inset-0 animate-ping rounded-full ${risk.bgClass} opacity-70`} />
                    )}
                    <span className={`relative size-2.5 rounded-full ${risk.bgClass}`} />
                  </span>

                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${risk.textClass}`}>
                        {risk.label}
                      </span>
                      <span className="truncate font-mono text-sm text-foreground">
                        {objectsById[conj.objectA].name}
                        <span className="px-1.5 text-muted-foreground">×</span>
                        {objectsById[conj.objectB].name}
                      </span>
                    </span>
                    <span className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground sm:grid-cols-4">
                      <span>
                        <span className="sr-only">Time of closest approach: </span>
                        <span className="tabular-nums text-foreground/90">{formatCountdown(tcaMs, simTimeMs)}</span>
                      </span>
                      <span>
                        Miss <span className="tabular-nums text-foreground/90">{formatNumber(conj.missDistanceKm, 3)} km</span>
                      </span>
                      <span>
                        Δv <span className="tabular-nums text-foreground/90">{formatNumber(conj.relativeVelocityKmS, 2)} km/s</span>
                      </span>
                      <span title="Collision probability requires covariance (uncertainty) data, which the simulated dataset does not contain.">
                        Pc <span className="text-foreground/60">not available</span>
                      </span>
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-signal">
                    <Crosshair className="size-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Inspect</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </motion.section>
  )
}
