// Shared session storage key constants — defined once to avoid hardcoded strings
export const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'collabrix_token'
export const USER_KEY  = import.meta.env.VITE_USER_STORAGE_KEY  ?? 'collabrix_user'
