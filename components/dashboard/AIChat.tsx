'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Plus,
  X,
  Mic,
  Paperclip,
  RotateCcw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  FileText,
  HelpCircle,
  AlertCircle
} from 'lucide-react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  attachments?: Array<{
    name: string
    type: string
    url: string
  }>
  suggestions?: string[]
  rating?: 'positive' | 'negative'
}

interface AIChatProps {
  onClose?: () => void
  isOpen?: boolean
  variant?: 'full' | 'modal' | 'embedded'
  initialMessage?: string
  context?: any
}

const quickPrompts = [
  { id: '1', text: 'What documents do I need for a work visa?', icon: FileText },
  { id: '2', text: 'How long does the visa process take?', icon: HelpCircle },
  { id: '3', text: 'Can you check my application status?', icon: AlertCircle },
  { id: '4', text: 'Help me prepare for my interview', icon: User }
]

export function AIChat({ 
  onClose,
  isOpen = true,
  variant = 'full',
  initialMessage,
  context
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI visa assistant. How can I help you with your visa application today?',
      role: 'assistant',
      timestamp: new Date(),
      suggestions: [
        'Start a new visa application',
        'Check required documents',
        'Get country-specific advice',
        'Understand the timeline'
      ]
    }
  ])
  const [input, setInput] = useState(initialMessage || '')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setTyping(true)

    try {
      // Simulate AI response in demo mode
      if (DemoService.isDemoMode()) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateDemoResponse(userMessage.content),
          role: 'assistant',
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, aiResponse])
      } else {
        // Call real AI API
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            newMessage: userMessage.content,
            context
          })
        })

        const data = await response.json()
        
        if (data.success) {
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: data.message,
            role: 'assistant',
            timestamp: new Date(),
            suggestions: data.suggestions
          }
          
          setMessages(prev => [...prev, aiResponse])
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setTyping(false)
    }
  }

  const generateDemoResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('document') || input.includes('require')) {
      return `For a visa application, you typically need:

1. **Passport** - Valid for at least 6 months beyond your intended stay
2. **Biometric Photos** - Recent passport-style photographs
3. **Financial Documents** - Bank statements, employment proof
4. **Travel Insurance** - Coverage for your entire stay
5. **Accommodation Proof** - Hotel bookings or invitation letter
6. **Purpose Documentation** - Employment contract, admission letter, etc.

Would you like me to help you check which documents you've already uploaded?`
    } else if (input.includes('status') || input.includes('application')) {
      return `I can see you have an active work visa application for Germany. Here's the current status:

📋 **Application Status**: In Progress
📍 **Current Stage**: Document Collection
✅ **Completed**: Personal Information
⏳ **Pending**: Document Verification
📅 **Next Step**: Upload financial documents

Your application is 40% complete. Would you like to continue where you left off?`
    } else if (input.includes('timeline') || input.includes('how long')) {
      return `The visa processing timeline varies by country and visa type:

🇩🇪 **Germany Work Visa**: 4-8 weeks
🇫🇷 **France Student Visa**: 2-3 weeks
🇬🇧 **UK Skilled Worker**: 3-8 weeks
🇺🇸 **USA B1/B2**: 2-6 months

These are average processing times. Premium/express services may be available for faster processing. 

Would you like country-specific timeline information?`
    } else if (input.includes('interview') || input.includes('prepare')) {
      return `I'll help you prepare for your visa interview! Here are key preparation tips:

**Common Questions:**
1. Purpose of visit and duration
2. Financial capability
3. Ties to home country
4. Previous travel history
5. Accommodation plans

**Preparation Checklist:**
✓ Review your application details
✓ Organize documents chronologically
✓ Practice common questions
✓ Dress professionally
✓ Arrive early

Would you like me to run a mock interview session with you?`
    } else {
      return `I understand you're asking about "${userInput}". Let me help you with that.

Based on your question, I can:
- Provide detailed visa requirements
- Help with document preparation
- Check your application progress
- Offer country-specific guidance

Could you please provide more details about what specific aspect you need help with?`
    }
  }

  const handleRateMessage = (messageId: string, rating: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ))
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    handleSendMessage()
  }

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleNewChat = () => {
    setMessages([{
      id: '1',
      content: 'Hello! I\'m your AI visa assistant. How can I help you with your visa application today?',
      role: 'assistant',
      timestamp: new Date(),
      suggestions: [
        'Start a new visa application',
        'Check required documents',
        'Get country-specific advice',
        'Understand the timeline'
      ]
    }])
  }

  if (!isOpen && variant === 'modal') return null

  const chatContent = (
    <>
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">AI Visa Assistant</h3>
            <p className="text-xs text-gray-500">Always here to help</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleNewChat}
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-[70%] space-y-2 ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                <div className={`rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Suggestions */}
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Actions */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleCopyMessage(message.content)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-2 ${message.rating === 'positive' ? 'text-green-600' : ''}`}
                      onClick={() => handleRateMessage(message.id, 'positive')}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-2 ${message.rating === 'negative' ? 'text-red-600' : ''}`}
                      onClick={() => handleRateMessage(message.id, 'negative')}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-gray-700" />
                </div>
              )}
            </div>
          ))}
          
          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map(prompt => {
              const Icon = prompt.icon
              return (
                <Button
                  key={prompt.id}
                  variant="outline"
                  className="justify-start text-sm"
                  onClick={() => handleQuickPrompt(prompt.text)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {prompt.text}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2"
        >
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            className="flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your visa..."
            disabled={loading}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            className="flex-shrink-0"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          <Sparkles className="h-3 w-3 inline mr-1" />
          AI-powered responses may occasionally be inaccurate
        </p>
      </div>
    </>
  )

  if (variant === 'embedded') {
    return <div className="flex flex-col h-[600px] bg-white rounded-lg border">{chatContent}</div>
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
          {chatContent}
        </div>
      </div>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      {chatContent}
    </Card>
  )
}