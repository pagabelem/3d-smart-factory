/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */


"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface ClassementStagiaire {
  id: string
  name: string
  totalXP: number
  badgesCount: number
  defisReussis: number
  commitsCount: number
  rank: number
}

export default function StagiairePodiumPage() {
  const { data: session } = useSession()
  const [classement, setClassement] = useState<ClassementStagiaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<"all" | "team">("team")

  useEffect(() => {
    fetchClassement()
  }, [filter])

  const fetchClassement = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/stagiaire/podium?filter=${filter}`)
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setClassement(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const getMedal = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `#${rank}`
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 border-yellow-400"
    if (rank === 2) return "bg-gray-100 border-gray-400"
    if (rank === 3) return "bg-orange-100 border-orange-400"
    return "bg-white border-gray-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement du classement...</p>
        </div>
      </div>
    )
  }

  const myRank = classement.findIndex(s => s.id === session?.user?.id) + 1 || 0

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🏆 Podium</h1>
          <p className="text-gray-500 mt-1">Votre classement parmi les stagiaires</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("team")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "team"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            👥 Mon équipe
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            🌍 Tous
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {/* Top 3 */}
      {classement.length > 0 && (
        <div className="flex justify-center items-end gap-6 mb-8">
          {classement.slice(0, 3).map((stagiaire, index) => (
            <div
              key={stagiaire.id}
              className={`flex flex-col items-center p-6 rounded-2xl border-2 ${getRankColor(index + 1)} w-40 ${
                stagiaire.id === session?.user?.id ? "ring-4 ring-blue-400" : ""
              }`}
            >
              <div className="text-5xl mb-2">{getMedal(index + 1)}</div>
              <div className="font-bold text-center text-gray-800">{stagiaire.name}</div>
              <div className="text-sm text-blue-600 font-semibold">{stagiaire.totalXP} XP</div>
              <div className="text-xs text-gray-400">{stagiaire.badgesCount} 🏅</div>
            </div>
          ))}
        </div>
      )}

      {/* Votre position */}
      {myRank > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="font-semibold text-gray-800">Votre position</p>
                <p className="text-sm text-gray-500">
                  {myRank === 1 ? "🥇 Vous êtes en tête !" : `Vous êtes #${myRank} sur ${classement.length}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {classement.find(s => s.id === session?.user?.id)?.totalXP || 0} XP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Classement complet */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stagiaire</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">XP</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Badges</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Défis</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Commits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classement.map((stagiaire, index) => {
                const isMe = stagiaire.id === session?.user?.id
                return (
                  <tr
                    key={stagiaire.id}
                    className={`transition ${isMe ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-700">{index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span>{isMe ? "👤" : ""}</span>
                        <span className={`font-medium ${isMe ? "text-blue-600" : "text-gray-800"}`}>
                          {stagiaire.name}
                          {isMe && " (vous)"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{stagiaire.totalXP}</td>
                    <td className="px-6 py-4 text-center">{stagiaire.badgesCount} 🏅</td>
                    <td className="px-6 py-4 text-center">{stagiaire.defisReussis} ✅</td>
                    <td className="px-6 py-4 text-center">{stagiaire.commitsCount} 📝</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {classement.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-gray-500">Aucun stagiaire dans le classement</p>
        </div>
      )}
    </div>
  )
}