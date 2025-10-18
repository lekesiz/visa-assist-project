// Mock OpenAI SDK

const mockChatCompletions = {
  create: jest.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          isValid: true,
          extractedData: {},
          issues: [],
          suggestions: [],
          confidence: 95
        })
      }
    }]
  })
}

const mockOpenAI = {
  chat: {
    completions: mockChatCompletions
  }
}

// Mock the constructor
function OpenAI() {
  return mockOpenAI
}

// Add static methods if needed
OpenAI.prototype = mockOpenAI

module.exports = OpenAI
module.exports.default = OpenAI