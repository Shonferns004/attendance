export const PROJECTS = {
  maan: {
    id: 'maan',
    label: 'Mann Care Foundation',
    shortLabel: 'MannCare',
    template: 'manncar',
  },
  aflf: {
    id: 'aflf',
    label: 'Ashray For Life Foundation',
    shortLabel: 'Ashray',
    template: 'ashray',
  },
  bsct: {
    id: 'bsct',
    label: 'Being Sevak Foundation',
    shortLabel: 'BeingSevak',
    template: 'beingsevak',
  },
}

export const PROJECT_OPTIONS = [
  { value: '', label: '— Select NGO —' },
  ...Object.values(PROJECTS).map(p => ({
    value: p.id,
    label: p.label,
  })),
]
