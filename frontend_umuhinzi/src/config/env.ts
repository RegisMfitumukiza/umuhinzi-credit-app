const env = {
  API_URL: import.meta.env.VITE_API_URL as string,
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || 'Umuhinzi Credit',
}

if (!env.API_URL) {
  throw new Error('VITE_API_URL is not defined. Check your .env file.')
}

export default env
