import { describe, it, expect } from "bun:test"
import { parseAnthropicTokenLimitError } from "./parser"

describe("parseAnthropicTokenLimitError", () => {
  it("should parse type validation error from string", () => {
    // This error contains service unavailable in the JSON, so should be detected as service unavailable
    const error = "AI_TypeValidationError: Type validation failed: Value: {\"code\":\"The service is currently unavailable\",\"error\":\"Service temporarily unavailable. The model is at capacity and currently cannot serve this request. Please try again later.\"}."

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "service_unavailable",
    })
  })

  it("should parse pure type validation error without service unavailable", () => {
    const error = "AI_TypeValidationError: Type validation failed: Value: {\"code\":\"invalid_request\",\"error\":\"Invalid request format\"}. Error: [{\"code\":\"invalid_union\",\"errors\":[[{\"expected\":\"array\",\"code\":\"invalid_type\"}]],\"path\":[],\"message\":\"Invalid input\"}]"

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "type_validation_error",
    })
  })

  it("should parse service unavailable error from string", () => {
    const error = "Service temporarily unavailable. The model is at capacity and currently cannot serve this request. Please try again later."

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "service_unavailable",
    })
  })

  it("should parse service unavailable from type validation wrapper", () => {
    const error = "AI_TypeValidationError: Type validation failed: Value: {\"code\":\"The service is currently unavailable\",\"error\":\"Service temporarily unavailable. The model is at capacity and currently cannot serve this request. Please try again later.\"}. Error: [{\"code\":\"invalid_union\",\"errors\":[[{\"expected\":\"array\",\"code\":\"invalid_type\",\"path\":[\"choices\"],\"message\":\"Invalid input: expected array, received undefined\"}]],\"path\":[],\"message\":\"Invalid input\"}]"

    const result = parseAnthropicTokenLimitError(error)

    // Should detect service unavailable even when wrapped in type validation error
    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "service_unavailable",
    })
  })

  it("should parse type validation error from object", () => {
    const error = {
      message: "Invalid input: expected array, received undefined for path [\"choices\"]",
      error: "Type validation failed"
    }

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "type_validation_error",
    })
  })

  it("should parse token limit error from string", () => {
    const error = "This model's maximum prompt length is 256000 but the request contains 262155 tokens."

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 262155,
      maxTokens: 256000,
      errorType: "token_limit_exceeded_string",
    })
  })

  it("should parse Bad Request with model's maximum prompt length", () => {
    const error = "Bad Request: This model's maximum prompt length is 256000 but the request contains 262155 tokens."

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 262155,
      maxTokens: 256000,
      errorType: "token_limit_exceeded_string",
    })
  })

  it("should parse non-empty content error", () => {
    const error = "all messages must have non-empty content"

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "non-empty content",
      messageIndex: undefined,
    })
  })

  it("should parse rate limit error as service unavailable", () => {
    const error = "Rate limit exceeded. Too many requests. Please try again later."

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "service_unavailable",
    })
  })

  it("should return null for non-matching errors", () => {
    const error = "Some other error message"

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toBeNull()
  })

  it("should handle complex error objects", () => {
    const error = {
      data: {
        responseBody: JSON.stringify({
          error: {
            message: "Invalid input: expected object, received string for path [\"error\"]"
          }
        })
      }
    }

    const result = parseAnthropicTokenLimitError(error)

    expect(result).toEqual({
      currentTokens: 0,
      maxTokens: 0,
      errorType: "type_validation_error",
    })
  })
})