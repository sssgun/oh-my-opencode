export interface ParsedTokenLimitError {
  currentTokens: number
  maxTokens: number
  requestId?: string
  errorType: string
  providerID?: string
  modelID?: string
  messageIndex?: number
}

export interface RetryState {
  attempt: number
  lastAttemptTime: number
}

export interface TruncateState {
  truncateAttempt: number
  lastTruncatedPartId?: string
}

export interface AutoCompactState {
  pendingCompact: Set<string>
  errorDataBySession: Map<string, ParsedTokenLimitError>
  retryStateBySession: Map<string, RetryState>
  truncateStateBySession: Map<string, TruncateState>
  emptyContentAttemptBySession: Map<string, number>
  compactionInProgress: Set<string>
}

export const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelayMs: 30000,
  backoffFactor: 1,
  maxDelayMs: 150000,
} as const

export const TRUNCATE_CONFIG = {
  maxTruncateAttempts: 20,
  minOutputSizeToTruncate: 500,
  targetTokenRatio: 0.5,
  charsPerToken: 4,
} as const
