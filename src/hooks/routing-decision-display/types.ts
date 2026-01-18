export interface RoutingDecisionDisplayHookInput {
  sessionID: string
  messageID?: string
}

export interface RoutingDecisionDisplayHookOutput {
  parts: Array<{ type: string; text?: string }>
}