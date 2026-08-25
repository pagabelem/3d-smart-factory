/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  commits: number
  tasks: { total: number; done: number }
  lastActivity: string
}

interface Team {
  id: string
  name: string
  project: string
  members: TeamMember[]
}

export default function EncadrantEquipePage() {
  const { data: session } = useSession()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/encadrant/team")
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur de chargement")
      }
      const data = await res.json()
      setTeam(data)
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
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de votre équipe...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl">
        ❌ {error}
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-gray-700">Aucune équipe</h2>
        <p className="text-gray-500 mt-2">Vous n'êtes pas encore assigné à une équipe.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👥 Mon équipe</h1>
        <p className="text-gray-500 mt-1">
          {team.name} - {team.project}
        </p>
      </div>

      {/* Statistiques de l'équipe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80">Membres</p>
          <p className="text-3xl font-bold mt-1">{team.members?.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80">Total commits</p>
          <p className="text-3xl font-bold mt-1">{team.members?.reduce((acc, m) => acc + (m.commits || 0), 0) || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-sm font-medium opacity-80">Tâches complétées</p>
          <p className="text-3xl font-bold mt-1">{team.members?.reduce((acc, m) => acc + (m.tasks?.done || 0), 0) || 0}</p>
        </div>
      </div>

      {/* Liste des membres */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Membre</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Commits</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Tâches</th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {team.members?.map((member) => {
                const progress = member.tasks?.total > 0 
                  ? Math.round((member.tasks.done / member.tasks.total) * 100) 
                  : 0
                
                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                          {member.name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-gray-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{member.email}</td>
                    <td className="px-6 py-4 text-center font-medium text-blue-600">{member.commits || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-gray-700">
                        {member.tasks?.done || 0}/{member.tasks?.total || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}