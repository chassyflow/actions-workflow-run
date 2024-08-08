/* eslint-disable no-shadow */
export enum WorkflowStatuses {
  SUCCESS = 'SUCCESS',
  IN_PROGRESS = 'IN_PROGRESS',
  CONFIG_ERROR = 'CONFIG_ERROR',
  CHASSY_ERROR = 'CHASSY_ERROR',
  EXECUTION_ERROR = 'EXECUTION_ERROR'
}

export type Package = {
  id: string
  sha256: string
  createTimestamp: string
  name: string
  tags?: {
    key: string
    value: string
  }[]
  type: 'CONTAINER' | 'FILE' | 'ARCHIVE' | 'RFSIMAGE' | 'FIRMWARE'
  packageClass: 'EXECUTABLE' | 'CONFIG' | 'DATA'
  access?: 'PUBLIC' | 'PRIVATE'
  status: 'PENDING' | 'AVAILABLE' | 'FAILED'
  accessURI?: string
}

export type Release = {
  id: string
  createTimestamp: string
  name: string
  manifest?: Package[]
  manifestIds?: string[]
  versionInfo: string
}

export type WorkflowExecution = {
  packages?: Package[]
  releases?: Release[]
  deployments?: {
    id: string
    fleetId: string
    release: Release
    machines?: {
      id: string
      name?: string
      address?: string
      hostname?: string
    }[]
    expiryTimestamp: string
    status: 'PENDING' | 'INPROGRESS' | 'CANCELED' | 'FAILED' | 'COMPLETE'
  }[]
  status:
    | 'SUCCESS'
    | 'IN_PROGRESS'
    | 'CONFIG_ERROR'
    | 'CHASSY_ERROR'
    | 'EXECUTION_ERROR'
}

export type TokenData = {
  accessToken: string
  idToken: string
}
