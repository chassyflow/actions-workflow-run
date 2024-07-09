export const BACKEND_BASE_URLS_BY_ENV: Record<string, string> = {
  PROD: 'https://api.chassy.io/v1',
  STAGE: 'https://api.stage.chassy.dev/v1',
  DEV: 'https://api.test.chassy.dev/v1'
}

export const RETRY_IN_SECONDS = 30
