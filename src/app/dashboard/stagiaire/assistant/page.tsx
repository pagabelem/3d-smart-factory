/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */


"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function StagiaireAssistantPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Charger l'historique au démarrage
  useEffect(() => {
    loadConversation()
  }, [])

  const loadConversation = async () => {
    try {
      const res = await fetch("/api/stagiaire/conversations")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      
      if (data.conversationId) {
        setConversationId(data.conversationId)
        const loadedMessages = data.messages.map((m: any, index: number) => ({
          id: index.toString(),
          role: m.role,
          content: m.content,
          timestamp: new Date(),
        }))
        setMessages(loadedMessages)
      } else {
        // Message de bienvenue
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `👋 **Bonjour ${session?.user?.name} !** Je suis votre assistant IA. 

Je peux vous aider avec :

📊 **Votre progression**  
💻 **Vos commits**  
📝 **Vos tâches**  
🎯 **Vos objectifs**  

Posez-moi une question !`,
            timestamp: new Date(),
          },
        ])
      }
    } catch (err) {
      console.error(err)
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "👋 Bonjour ! Je suis votre assistant IA. Posez-moi une question sur votre progression !",
          timestamp: new Date(),
        },
      ])
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/stagiaire/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          conversationId: conversationId,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur de réponse")
      }

      const data = await res.json()
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "❌ Désolé, une erreur est survenue. Veuillez réessayer.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">🤖 Assistant IA</h1>
        <p className="text-gray-500 mt-1">Posez vos questions sur votre progression, vos projets et plus encore</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4">
          ❌ {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg font-bold">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>,
                        p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 text-sm">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 text-sm">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-blue-400 pl-3 py-1 bg-blue-50 rounded-r-lg">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                )}
                <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Posez votre question..."
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? "⏳" : "📤"}
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {[
          "Comment puis-je améliorer ma progression ?",
          "Quels sont mes points faibles ?",
          "Résume mon activité de la semaine",
          "Comment gagner plus de XP ?",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}