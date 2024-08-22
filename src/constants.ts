import { BaseUrl } from './types'

export const BASE_URLS_BY_ENV: Record<string, BaseUrl> = {
  PROD: {
    apiBaseUrl: 'https://api.chassy.io/v1',
    frontendBaseUrl: 'https://console.chassy.io'
  },
  STAGE: {
    apiBaseUrl: 'https://api.stage.chassy.dev/v1',
    frontendBaseUrl: 'https://console.stage.chassy.dev'
  },
  DEV: {
    apiBaseUrl: 'https://api.test.chassy.dev/v1',
    frontendBaseUrl: 'https://console.test.chassy.dev'
  }
}

export const RETRY_IN_SECONDS = 30
