export const DESIGNATION_LEVELS = {
  DIRECTOR: 6,
  PARTNER: 5,
  MANAGER: 4,
  SENIOR_CONSULTANT: 3,
  CONSULTANT: 2,
  ASSOCIATE_CONSULTANT: 1,
}

export const DESIGNATION_DISPLAY = {
  DIRECTOR: 'Director',
  PARTNER: 'Partner',
  MANAGER: 'Manager',
  SENIOR_CONSULTANT: 'Senior Consultant',
  CONSULTANT: 'Consultant',
  ASSOCIATE_CONSULTANT: 'Associate Consultant',
}

export const DESIGNATION_COLORS = {
  DIRECTOR: { bg: '#8E44AD', border: '#7D3C98', text: '#fff' },
  PARTNER: { bg: '#F39C12', border: '#E67E22', text: '#fff' },
  MANAGER: { bg: '#2E86C1', border: '#1A6BAF', text: '#fff' },
  SENIOR_CONSULTANT: { bg: '#16A085', border: '#0E7368', text: '#fff' },
  CONSULTANT: { bg: '#27AE60', border: '#1E8449', text: '#fff' },
  ASSOCIATE_CONSULTANT: { bg: '#E74C3C', border: '#C0392B', text: '#fff' },
}

export const DESIGNATION_BADGE_COLORS = {
  DIRECTOR: '#8E44AD',
  PARTNER: '#E67E22',
  MANAGER: '#2E86C1',
  SENIOR_CONSULTANT: '#16A085',
  CONSULTANT: '#27AE60',
  ASSOCIATE_CONSULTANT: '#E74C3C',
}

export const RELATIONSHIP_TYPE_DISPLAY = {
  REPORTING_PARTNER: 'Reporting Partner',
  ENGAGEMENT_PARTNER: 'Engagement Partner',
  REPORTING_MANAGER: 'Reporting Manager',
  ENGAGEMENT_MANAGER: 'Engagement Manager',
  INTERNAL_PRODUCT_DEVELOPMENT: 'Internal Product Dev',
  PEER: 'Peer',
  OTHERS: 'Others',
}

export const RELATIONSHIP_TYPES = [
  { value: 'REPORTING_PARTNER', label: 'Reporting Partner' },
  { value: 'ENGAGEMENT_PARTNER', label: 'Engagement Partner' },
  { value: 'REPORTING_MANAGER', label: 'Reporting Manager' },
  { value: 'ENGAGEMENT_MANAGER', label: 'Engagement Manager' },
  { value: 'INTERNAL_PRODUCT_DEVELOPMENT', label: 'Internal Product Dev' },
  { value: 'PEER', label: 'Peer' },
  { value: 'OTHERS', label: 'Others' },
]

export const CONNECTION_STATUS_DISPLAY = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const CONNECTION_STATUS_COLORS = {
  PENDING: '#F59E0B',
  APPROVED: '#10B981',
  REJECTED: '#EF4444',
}

export function getDesignationLevel(designation) {
  return DESIGNATION_LEVELS[designation] ?? 0
}

export function isSeniorTo(a, b) {
  return getDesignationLevel(a) > getDesignationLevel(b)
}

export function canGiveFeedback(giver, receiver) {
  return getDesignationLevel(giver) >= getDesignationLevel(receiver)
}

export function isManagerOrAbove(designation) {
  return getDesignationLevel(designation) >= 4
}

export function isPartnerOrAbove(designation) {
  return getDesignationLevel(designation) >= 5
}

export function canViewFeedback(viewerDesignation, targetDesignation) {
  return getDesignationLevel(viewerDesignation) > getDesignationLevel(targetDesignation)
}

export function getNodeColor(designation) {
  return DESIGNATION_COLORS[designation]?.bg ?? '#64748B'
}
