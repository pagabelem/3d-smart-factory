/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface GameStats {
  level: number
  xp: number
  xpNextLevel: number
  xpProgress: number
  totalXP: number
  badgesCount: number
  defisReussis: number
  streak: number
  tasksDone: number
  tasksTotal: number
  achievements: { id: string; name: string; icon: string; unlocked: boolean }[]
  dailyChallenges: { id: string; title: string; description: string; xpReward: number; completed: boolean }[]
}

export default function StagiaireJeuPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchGameStats()
  }, [])

  const fetchGameStats = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/jeu")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const completeChallenge = async (challengeId: string) => {
    try {
      const res = await fetch("/api/stagiaire/jeu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      })
      if (!res.ok) throw new Error("Erreur")
      await fetchGameStats()
    } catch (err) {
      setError("Erreur lors de la validation du défi")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement du mode jeu...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎮</div>
        <h2 className="text-2xl font-bold text-gray-700">Mode Jeu</h2>
        <p className="text-gray-500 mt-2">Gagnez de l'XP en accomplissant des défis !</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🎮 Mode Jeu</h1>
        <p className="text-gray-500 mt-1">Gagnez des points, débloquez des badges et progressez</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {/* Carte du joueur */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-lg mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl backdrop-blur-sm">
              {session?.user?.name?.charAt(0) || '🎮'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{session?.user?.name}</h2>
              <p className="text-sm opacity-80">Niveau {stats.level}</p>
            </div>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalXP}</p>
              <p className="text-xs opacity-80">⭐ XP Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.badgesCount}</p>
              <p className="text-xs opacity-80">🏅 Badges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.defisReussis}</p>
              <p className="text-xs opacity-80">🎯 Défis</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">🔥{stats.streak}</p>
              <p className="text-xs opacity-80">Jours d'affilée</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de progression XP */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progression vers le niveau {stats.level + 1}</span>
          <span className="text-sm text-gray-500">{stats.xp} / {stats.xpNextLevel} XP</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${stats.xpProgress}%` }}
          />
        </div>
      </div>

      {/* Défis quotidiens */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🎯</span>
          <h2 className="text-lg font-semibold text-gray-800">Défis quotidiens</h2>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">+{stats.dailyChallenges?.reduce((acc, c) => acc + (c.completed ? 0 : c.xpReward), 0) || 0} XP disponibles</span>
        </div>
        <div className="space-y-3">
          {stats.dailyChallenges?.length > 0 ? (
            stats.dailyChallenges.map((challenge) => (
              <div key={challenge.id} className={`flex items-center justify-between p-3 rounded-xl border ${challenge.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <p className={`font-medium ${challenge.completed ? 'text-green-600' : 'text-gray-700'}`}>
                    {challenge.title}
                  </p>
                  <p className="text-sm text-gray-500">{challenge.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-yellow-600">+{challenge.xpReward} XP</span>
                  {challenge.completed ? (
                    <span className="text-green-500">✅</span>
                  ) : (
                    <button
                      onClick={() => completeChallenge(challenge.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      🔥 Relever
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">Aucun défi disponible</p>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🏆</span>
          <h2 className="text-lg font-semibold text-gray-800">Succès</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.achievements?.map((achievement) => (
            <div key={achievement.id} className={`text-center p-3 rounded-xl border ${achievement.unlocked ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className="text-3xl">{achievement.icon}</div>
              <p className="text-xs font-medium text-gray-700 mt-1">{achievement.name}</p>
              {achievement.unlocked ? (
                <span className="text-xs text-green-600">✅</span>
              ) : (
                <span className="text-xs text-gray-400">🔒</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          {stats.achievements?.filter(a => a.unlocked).length || 0} / {stats.achievements?.length || 0} débloqués
        </div>
      </div>
    </div>
  )
}