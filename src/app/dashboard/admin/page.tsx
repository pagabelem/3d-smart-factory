/* eslint-disable react/no-unescaped-entities */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Stats {
  totalProjects: number
  totalStagiaires: number
  totalEncadrants: number
  commitsThisWeek: number
  activeProjects: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Chargement des statistiques...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Vue Globale - Administration
      </h1>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-blue-600">{stats?.totalProjects || 0}</div>
          <div className="text-gray-600">Projets actifs</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-green-600">{stats?.totalStagiaires || 0}</div>
          <div className="text-gray-600">Stagiaires</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-purple-600">{stats?.totalEncadrants || 0}</div>
          <div className="text-gray-600">Encadrants</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-orange-600">{stats?.commitsThisWeek || 0}</div>
          <div className="text-gray-600">Commits cette semaine</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-3xl font-bold text-indigo-600">{stats?.activeProjects || 0}</div>
          <div className="text-gray-600">Score moyen d'activité</div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Alertes IA récentes</h2>
        <div className="space-y-2">
          <div className="p-3 bg-yellow-50 rounded-lg">
            ⚠️ Projet "Backend" : aucun commit depuis 5 jours
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            ⚠️ Stagiaire Jean Dupont : baisse d'activité détectée
          </div>
        </div>
      </div>
    </div>
  )
}