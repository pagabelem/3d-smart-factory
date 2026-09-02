"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

interface Feedback {
  id: string
  contenu: string
  generatedAt: string
  encadrant: { name: string }
  projet: { name: string } | null
  vu: boolean
}

export default function StagiaireFeedbacksPage() {
  const { data: session } = useSession()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/stagiaire/feedbacks`)
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setFeedbacks(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/stagiaire/feedbacks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vu: true }),
      })
      setFeedbacks(prev => 
        prev.map(f => f.id === id ? { ...f, vu: true } : f)
      )
    } catch (err) {
      console.error("Erreur:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de vos feedbacks...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📋 Mes Feedbacks</h1>
        <p className="text-gray-500 mt-1">
          Consultez les retours de votre encadrant
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500">Aucun feedback pour le moment</p>
            <p className="text-sm text-gray-400">Votre encadrant vous fera des retours prochainement</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div 
              key={feedback.id} 
              className={`bg-white rounded-2xl shadow-md p-6 border transition ${
                feedback.vu 
                  ? 'border-gray-200' 
                  : 'border-blue-300 bg-blue-50/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">
                      Feedback de {feedback.encadrant?.name || "l'encadrant"}
                    </h3>
                    {!feedback.vu && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {feedback.projet?.name && `Projet: ${feedback.projet.name}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(feedback.generatedAt).toLocaleDateString()} à {new Date(feedback.generatedAt).toLocaleTimeString()}
                  </p>
                </div>
                {!feedback.vu && (
                  <button
                    onClick={() => markAsRead(feedback.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-xl prose prose-sm max-w-none">
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    p: ({ children }) => <p className="text-gray-700 text-sm leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="text-gray-800">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc pl-4 text-gray-700 text-sm">{children}</ul>,
                  }}
                >
                  {feedback.contenu}
                </ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}