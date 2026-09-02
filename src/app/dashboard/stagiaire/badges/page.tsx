
/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  earnedAt: string
}

export default function StagiaireBadgesPage() {
  const { data: session } = useSession()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalXP, setTotalXP] = useState(0)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/badges")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setBadges(Array.isArray(data) ? data : [])
      const total = data.reduce((acc: number, b: Badge) => acc + b.xpReward, 0)
      setTotalXP(total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de vos badges...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">🏅 Mes Badges</h1>
        <p className="text-gray-500 mt-1">Collectionnez des badges en accomplissant des défis</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {/* XP Total */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-6 text-white shadow-lg mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Total XP gagné</p>
            <p className="text-3xl font-bold">{totalXP} XP</p>
          </div>
          <div className="text-4xl">⭐</div>
        </div>
      </div>

      {/* Liste des badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🏅</div>
            <p className="text-gray-500">Aucun badge pour le moment</p>
            <p className="text-sm text-gray-400">Continuez à travailler pour débloquer des badges !</p>
          </div>
        ) : (
          badges.map((badge) => (
            <div key={badge.id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition text-center">
              <div className="text-5xl mb-3">{badge.icon}</div>
              <h3 className="font-semibold text-gray-800">{badge.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                  ⭐ {badge.xpReward} XP
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}