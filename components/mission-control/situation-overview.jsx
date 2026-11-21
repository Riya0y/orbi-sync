'use client'

import { motion } from 'framer-motion'
import { formatNumber, formatUtc } from '@/lib/format'
import { RISK_LEVELS } from '@/lib/object-types'
import { SimulatedBadge } from './simulated-badge'

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
}

const STATUS_STYLES = {
  online: { label: 'Online', dot: 'bg-safe', text: 'text-safe' },
  nominal: { label: 'Nominal', dot: 'bg-safe', text: 'text-safe' },
  standby: { label: 'Standby', dot: 'bg-warning', text: 'text-warning' },
  degraded: { label: 'Degraded', dot: 'bg-warning', text: 'text-warning' },
  offline: { label: 'Offline', dot: 'bg-critical', text: 'text-critical' },
}

const SEVERITY_DOT = { info: 'bg-signal', warning: 'bg-warning', critical: 'bg-critical' }

export function SituationOverview({ status, conjunctions, objectsById, epochMs }) {
  const events = [
    ...status.events.map((e) => ({ ...e, timeMs: epochMs + e.offsetMinutes * 60_000 })),
    ...conjunctions.map((c) => ({
      id: `evt-${c.id}`,
      timeMs: epochMs,
      severity: c.risk === 'monitor' ? 'info' : c.risk,
      title: `${RISK_LEVELS[c.risk].label} close approach detected`,
      detail: `${objectsById[c.objectA].name} × ${objectsById[c.objectB].name} · miss ${formatNumber(c.missDistanceKm, 3)} km`,
    })),
  ].sort((a, b) => b.timeMs - a.timeMs)

  const reliability = status.dataReliability

  return (
    <section id="overview" aria-labelledby="overview-heading" className="relative border-t border-border px-5 py-24 sm:px-8 lg:px-10">
      <motion.div {...reveal} className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">Situation overview</p>
          <h2 id="overview-heading" className="mt-4 text-balance text-3xl font-medium tracking-tight sm:text-5xl">
            One shared picture of every object and every approach.
          </h2>
        </div>
        <SimulatedBadge label="Simulated scenario values" />
      </motion.div>

      <div className="mt-16 grid gap-14 lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-12">
        <motion.div {...reveal}>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Recent events</h3>
          <ol className="mt-5 border-l border-border">
            {events.map((event) => (
              <li key={event.id} className="relative pb-6 pl-6 last:pb-0">
                <span
                  className={`absolute -left-[4.5px] top-1.5 size-2 rounded-full ring-4 ring-space ${SEVERITY_DOT[event.severity]}`}
                  aria-hidden="true"
                />
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {formatUtc(event.timeMs, { withDate: false })} UTC
                </p>
                <p className="mt-1 text-sm text-foreground">{event.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{event.detail}</p>
              </li>
            ))}
          </ol>
        </motion.div>

        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Communication status</h3>
          <ul className="mt-5 divide-y divide-border border-y border-border">
            {status.communication.links.map((link) => {
              const s = STATUS_STYLES[link.status]
              return (
                <li key={link.id} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="text-sm text-foreground">{link.name}</span>
                  <span className={`flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] ${s.text}`}>
                    <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                    {s.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </motion.div>

        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.2 }}>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Data reliability</h3>
          <p className="mt-5 font-mono text-6xl font-light tabular-nums tracking-tight">
            {reliability.scorePercent}
            <span className="text-2xl text-muted-foreground">%</span>
          </p>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-electric to-signal"
              initial={{ width: 0 }}
              whileInView={{ width: `${reliability.scorePercent}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{reliability.basis}</p>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {reliability.sources.map((source) => {
              const s = STATUS_STYLES[source.status]
              return (
                <li key={source.name} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm text-foreground">{source.name}</span>
                  <span className={`font-mono text-[11px] uppercase tracking-[0.14em] ${s.text}`}>{s.label}</span>
                </li>
              )
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
