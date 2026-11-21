// Visual identity for each type of orbital object.
// `hex` is used by Cesium (3D scene); `className` values are used by Tailwind.

export const OBJECT_TYPES = {
  active: {
    label: 'Active satellite',
    shortLabel: 'Active',
    hex: '#38d6f0',
    textClass: 'text-obj-active',
    bgClass: 'bg-obj-active',
  },
  debris: {
    label: 'Space debris',
    shortLabel: 'Debris',
    hex: '#c9c1b3',
    textClass: 'text-obj-debris',
    bgClass: 'bg-obj-debris',
  },
  'rocket-body': {
    label: 'Rocket body',
    shortLabel: 'Rocket body',
    hex: '#8f9dff',
    textClass: 'text-obj-rocket',
    bgClass: 'bg-obj-rocket',
  },
}

export const RISK_LEVELS = {
  critical: { label: 'Critical', hex: '#f0444a', textClass: 'text-critical', bgClass: 'bg-critical' },
  warning: { label: 'Warning', hex: '#f5a524', textClass: 'text-warning', bgClass: 'bg-warning' },
  monitor: { label: 'Monitor', hex: '#34d399', textClass: 'text-safe', bgClass: 'bg-safe' },
}
