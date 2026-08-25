/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

interface ActivityData {
  date: string
  commits: number
  tasks: number
  messages: number
}

interface AnalyseData {
  analyse: string
  stats: {
    totalCommits: number
    totalTasks: number
    activeUsers: number
  }
}

export default function AdminHeatmapPage() {
  const { data: session } = useSession()
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [analyse, setAnalyse] = useState<AnalyseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysing, setAnalysing] = useState(false)
  const [error, setError] = useState("")
  const [view, setView] = useState<"week" | "month" | "year">("week")

  useEffect(() => {
    fetchActivityData()
  }, [view])

  const fetchActivityData = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/heatmap?view=${view}`)
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setActivityData(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const generateAnalyse = async () => {
    setAnalysing(true)
    setError("")
    try {
      const res = await fetch("/api/admin/heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periode: view }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur de génération")
      }
      const data = await res.json()
      setAnalyse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setAnalysing(false)
    }
  }

  const getIntensity = (value: number) => {
    if (value === 0) return "bg-gray-100"
    if (value < 3) return "bg-green-200"
    if (value < 6) return "bg-green-400"
    if (value < 10) return "bg-green-600"
    return "bg-green-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement de la heatmap...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🔥 Heatmap d'Activité</h1>
          <p className="text-gray-600 mt-1">Visualisez et analysez l'activité des stagiaires</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["week", "month", "year"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as typeof view)}
              className={`px-4 py-2 rounded-lg transition ${
                view === v
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
            >
              {v === "week" ? "Semaine" : v === "month" ? "Mois" : "Année"}
            </button>
          ))}
          <button
            onClick={generateAnalyse}
            disabled={analysing}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {analysing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyse en cours...
              </>
            ) : (
              <>🤖 Analyser avec IA</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* Analyse IA - Version améliorée avec Markdown */}
      {analyse && (
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-200 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
              🤖
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Analyse IA des tendances
                </h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {view === "week" ? "Hebdomadaire" : view === "month" ? "Mensuelle" : "Annuelle"}
                </span>
              </div>
              
              <div className="prose prose-sm max-w-none bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-purple-100">
                <ReactMarkdown
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-700 mt-4 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-600 mt-3 mb-2">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc pl-6 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-2">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50 rounded-r-lg my-2">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {analyse.analyse}
                </ReactMarkdown>
              </div>

              {/* Statistiques en cartes */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-blue-100 shadow-sm">
                  <div className="text-sm text-gray-500 font-medium">📝 Commits</div>
                  <div className="text-2xl font-bold text-blue-600">{analyse.stats.totalCommits}</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-green-100 shadow-sm">
                  <div className="text-sm text-gray-500 font-medium">✅ Tâches terminées</div>
                  <div className="text-2xl font-bold text-green-600">{analyse.stats.totalTasks}</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100 shadow-sm">
                  <div className="text-sm text-gray-500 font-medium">👥 Stagiaires actifs</div>
                  <div className="text-2xl font-bold text-purple-600">{analyse.stats.activeUsers}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {activityData.map((item, index) => {
            const date = new Date(item.date)
            const day = date.getDay()
            const weekIndex = Math.floor(index / 7)
            const colIndex = day === 0 ? 6 : day - 1
            const position = weekIndex * 7 + colIndex
            
            return (
              <div
                key={index}
                className={`aspect-square rounded-lg ${getIntensity(item.commits + item.tasks + item.messages)} transition hover:scale-110 cursor-pointer relative group`}
                style={{ gridColumn: (position % 7) + 1, gridRow: Math.floor(position / 7) + 2 }}
                title={`${date.toLocaleDateString()}: ${item.commits} commits, ${item.tasks} tâches, ${item.messages} messages`}
              >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                  {date.toLocaleDateString()}<br/>
                  📝 {item.commits} commits
                </div>
              </div>
            )
          })}
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          <span className="text-sm text-gray-500 font-medium">Activité :</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
            <span className="text-xs text-gray-500">0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-200"></div>
            <span className="text-xs text-gray-500">1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-400"></div>
            <span className="text-xs text-gray-500">3-5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-600"></div>
            <span className="text-xs text-gray-500">6-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-800"></div>
            <span className="text-xs text-gray-500">10+</span>
          </div>
        </div>
      </div>
    </div>
  )
}