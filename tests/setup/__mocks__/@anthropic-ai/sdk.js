// Mock Anthropic SDK

const mockAnthropic = {
  messages: {
    create: jest.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            professionMatch: 85,
            recognitionProbability: 75,
            requiredSteps: ['Submit documents', 'Take exam'],
            estimatedDuration: '6-12 months',
            additionalQualifications: [],
            recommendations: ['Study German regulations']
          })
        }
      ]
    })
  }
}

// Mock the constructor
function Anthropic() {
  return mockAnthropic
}

// Add static methods if needed
Anthropic.prototype = mockAnthropic

module.exports = Anthropic
module.exports.default = Anthropic