/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface StagiaireStats {
  totalXP: number
  niveau: number
  prochainNiveau: number
  badgesCount: number
  defisReussis: number
  commitsCount: number
  tasksDone: number
  tasksTotal: number
  progression: number
  projets: { id: string; name: string; progress: number }[]
  activiteRecente: { date: string; commits: number; tasks: number }[]
}

export default function StagiaireDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<StagiaireStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/stats")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setStats(data)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
        ❌ {error}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎓</div>
        <h2 className="text-2xl font-bold text-gray-700">Bienvenue !</h2>
        <p className="text-gray-500 mt-2">Votre espace personnel est en cours de préparation.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          👋 Bonjour {session?.user?.name}
        </h1>
        <p className="text-gray-500 mt-1">Voici votre progression et vos objectifs</p>
      </div>

      {/* XP et Niveau */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl backdrop-blur-sm">
              ⭐
            </div>
            <div>
              <p className="text-sm opacity-80">Niveau {stats.niveau}</p>
              <p className="text-2xl font-bold">{stats.totalXP} XP</p>
              <div className="w-48 h-1.5 bg-white/30 rounded-full mt-1">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${(stats.totalXP / stats.prochainNiveau) * 100}%` }}
                />
              </div>
              <p className="text-xs opacity-70 mt-0.5">
                {stats.totalXP} / {stats.prochainNiveau} XP pour le niveau {stats.niveau + 1}
              </p>
            </div>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.badgesCount}</p>
              <p className="text-xs opacity-80">🏅 Badges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.defisReussis}</p>
              <p className="text-xs opacity-80">🎯 Défis</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.commitsCount}</p>
              <p className="text-xs opacity-80">📝 Commits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progression globale */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Ma progression</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Tâches complétées</span>
              <span>{stats.tasksDone} / {stats.tasksTotal}</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressColor(stats.progression)} rounded-full transition-all duration-500`}
                style={{ width: `${stats.progression}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-bold text-gray-700">{stats.progression}%</span>
        </div>
      </div>

      {/* Projets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📁 Mes projets</h2>
            <Link href="/dashboard/stagiaire/projets" className="text-sm text-blue-600 hover:underline">
              Voir tout →
            </Link>
          </div>
          {stats.projets.length > 0 ? (
            <div className="space-y-3">
              {stats.projets.slice(0, 3).map((projet) => (
                <div key={projet.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{projet.name}</p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1">
                      <div 
                        className={`h-full bg-gradient-to-r ${getProgressColor(projet.progress)} rounded-full transition-all duration-500`}
                        style={{ width: `${projet.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-500">{projet.progress}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucun projet assigné</p>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📈 Activité récente</h2>
          {stats.activiteRecente && stats.activiteRecente.length > 0 ? (
            <div className="space-y-2">
              {stats.activiteRecente.slice(0, 5).map((jour, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{new Date(jour.date).toLocaleDateString()}</span>
                  <div className="flex gap-4">
                    <span className="text-blue-600">📝 {jour.commits}</span>
                    <span className="text-green-600">✅ {jour.tasks}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucune activité récente</p>
          )}
        </div>
      </div>

      {/* Badges récents */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">🏅 Mes badges</h2>
          <Link href="/dashboard/stagiaire/badges" className="text-sm text-blue-600 hover:underline">
            Voir tout →
          </Link>
        </div>
        <div className="flex gap-3 flex-wrap">
          {stats.badgesCount > 0 ? (
            <div className="flex gap-2">
              {[...Array(Math.min(stats.badgesCount, 6))].map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl shadow-md">
                  🏅
                </div>
              ))}
              {stats.badgesCount > 6 && (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                  +{stats.badgesCount - 6}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucun badge pour le moment</p>
          )}
        </div>
      </div>
    </div>
  )
}