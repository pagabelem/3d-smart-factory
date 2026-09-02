/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface LeaderboardUser {
  id: string
  name: string
  email: string
  role: string
  totalXP: number
  badgesCount: number
  defisReussis: number
  commitsCount: number
  rank: number
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, stagiaire, encadrant

  useEffect(() => {
    fetchLeaderboard()
  }, [filter])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/leaderboard?filter=${filter}`)
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      console.error("Erreur:", error)
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

  const getBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 border-yellow-500"
    if (rank === 2) return "bg-gray-100 border-gray-400"
    if (rank === 3) return "bg-orange-100 border-orange-500"
    return "bg-white border-gray-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement du classement...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🏆 Classement Général</h1>
          <p className="text-gray-600 mt-1">Top des contributeurs sur la plateforme</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les utilisateurs</option>
          <option value="stagiaire">Stagiaires uniquement</option>
          <option value="encadrant">Encadrants uniquement</option>
        </select>
      </div>

      {/* Podium Top 3 */}
      {users.length > 0 && (
        <div className="flex justify-center items-end gap-8 mb-12">
          {users.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className={`flex flex-col items-center p-4 rounded-lg border-2 ${getBadgeColor(index + 1)} w-40`}
            >
              <div className="text-5xl mb-2">{getMedal(index + 1)}</div>
              <div className="font-bold text-center">{user.name}</div>
              <div className="text-sm text-gray-500">{user.totalXP || 0} XP</div>
              <div className="text-xs text-gray-400">{user.badgesCount || 0} 🏅</div>
            </div>
          ))}
        </div>
      )}

      {/* Tableau complet */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badges</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Défis réussis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <span className="font-medium">{index + 1}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : ''}
                    ${user.role === 'ENCADRANT' ? 'bg-blue-100 text-blue-700' : ''}
                    ${user.role === 'STAGIAIRE' ? 'bg-green-100 text-green-700' : ''}
                  `}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-blue-600">
                  {user.totalXP || 0} XP
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span>🏅</span>
                    <span>{user.badgesCount || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span>✅</span>
                    <span>{user.defisReussis || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span>📝</span>
                    <span>{user.commitsCount || 0}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}