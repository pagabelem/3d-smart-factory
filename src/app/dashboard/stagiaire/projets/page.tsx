/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */


"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface ProjetStagiaire {
  id: string
  name: string
  description: string
  status: string
  progress: number
  tasksDone: number
  tasksTotal: number
  commits: number
  lastActivity: string
  encadrant: string
}

export default function StagiaireProjetsPage() {
  const { data: session } = useSession()
  const [projets, setProjets] = useState<ProjetStagiaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchProjets()
  }, [])

  const fetchProjets = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/projets")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setProjets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "from-emerald-500 to-green-600"
    if (progress >= 50) return "from-blue-500 to-indigo-600"
    if (progress >= 25) return "from-yellow-500 to-orange-600"
    return "from-red-500 to-pink-600"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIF": return "🟢 Actif"
      case "EN_ATTENTE": return "🟡 En attente"
      case "TERMINE": return "✅ Terminé"
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de vos projets...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📁 Mes Projets</h1>
        <p className="text-gray-500 mt-1">Suivez l'avancement de vos projets</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {projets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-gray-500">Aucun projet assigné</p>
            <p className="text-sm text-gray-400">Votre encadrant vous assignera bientôt à un projet</p>
          </div>
        ) : (
          projets.map((projet) => (
            <div key={projet.id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-semibold text-gray-800">{projet.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {getStatusBadge(projet.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{projet.description || "Aucune description"}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Progression</p>
                      <p className="text-xl font-bold text-blue-600">{projet.progress}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Tâches</p>
                      <p className="text-xl font-bold text-green-600">
                        {projet.tasksDone}/{projet.tasksTotal}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Commits</p>
                      <p className="text-xl font-bold text-purple-600">{projet.commits}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Encadrant</p>
                      <p className="text-sm font-medium text-gray-700">{projet.encadrant}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Avancement</span>
                      <span>{projet.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${getProgressColor(projet.progress)} rounded-full transition-all duration-500`}
                        style={{ width: `${projet.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}