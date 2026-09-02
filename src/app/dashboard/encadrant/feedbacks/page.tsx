/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

interface Stagiaire {
  id: string
  name: string
  email: string
  commits: number
  tasksDone: number
  tasksTotal: number
  progress: number
}

interface Feedback {
  stagiaireId: string
  stagiaireName: string
  contenu: string
  generatedAt: string
}

export default function EncadrantFeedbacksPage() {
  const { data: session } = useSession()
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [selectedStagiaire, setSelectedStagiaire] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/encadrant/stagiaires-with-stats")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setStagiaires(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const generateFeedback = async (stagiaireId: string) => {
    setGenerating(true)
    setError("")
    setSelectedStagiaire(stagiaireId)
    try {
      const res = await fetch("/api/encadrant/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stagiaireId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la génération")
      }

      const data = await res.json()
      
      // Ajouter le feedback à la liste
      setFeedbacks((prev) => {
        const existing = prev.findIndex(f => f.stagiaireId === stagiaireId)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = data
          return updated
        }
        return [...prev, data]
      })
      
      setSelectedStagiaire(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setGenerating(false)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-emerald-500"
    if (progress >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement des stagiaires...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🤖 Feedbacks IA</h1>
        <p className="text-gray-500 mt-1">
          Générez des feedbacks personnalisés pour vos stagiaires
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {/* Liste des stagiaires */}
      <div className="space-y-4">
        {stagiaires.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-500">Aucun stagiaire dans votre équipe</p>
          </div>
        ) : (
          stagiaires.map((stagiaire) => {
            const feedback = feedbacks.find(f => f.stagiaireId === stagiaire.id)
            const isGenerating = generating && selectedStagiaire === stagiaire.id

            return (
              <div key={stagiaire.id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                        {stagiaire.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{stagiaire.name}</h3>
                        <p className="text-sm text-gray-500">{stagiaire.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Commits</p>
                        <p className="text-xl font-bold text-blue-600">{stagiaire.commits || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Tâches</p>
                        <p className="text-xl font-bold text-green-600">
                          {stagiaire.tasksDone || 0}/{stagiaire.tasksTotal || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Progression</p>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(stagiaire.progress || 0)} rounded-full transition-all duration-500`}
                              style={{ width: `${stagiaire.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{stagiaire.progress || 0}%</span>
                        </div>
                      </div>
                    </div>

                    {feedback && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-blue-700">🤖 Feedback IA</span>
                          <span className="text-xs text-gray-400">
                            {new Date(feedback.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
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
                    )}
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => generateFeedback(stagiaire.id)}
                      disabled={isGenerating}
                      className={`
                        px-4 py-2 rounded-xl font-medium transition flex items-center gap-2
                        ${feedback 
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                        }
                        disabled:opacity-50
                      `}
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Génération...
                        </>
                      ) : (
                        feedback ? '🔄 Régénérer' : '🤖 Générer'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}