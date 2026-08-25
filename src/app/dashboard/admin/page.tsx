/* eslint-disable react/no-unescaped-entities */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Stats {
  totalProjects: number
  totalStagiaires: number
  totalEncadrants: number
  commitsThisWeek: number
  activeProjects: number
  projetsRecents: { id: string; name: string; status: string }[]
  stagiairesActifs: { id: string; name: string; commits: number }[]
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-xl text-gray-500">Chargement des statistiques...</div>
      </div>
    )
  }

  const statCards = [
    { label: "Projets actifs", value: stats?.totalProjects || 0, icon: "📁", color: "from-blue-500 to-blue-600" },
    { label: "Stagiaires", value: stats?.totalStagiaires || 0, icon: "👥", color: "from-green-500 to-green-600" },
    { label: "Encadrants", value: stats?.totalEncadrants || 0, icon: "👨‍🏫", color: "from-purple-500 to-purple-600" },
    { label: "Commits cette semaine", value: stats?.commitsThisWeek || 0, icon: "📝", color: "from-orange-500 to-orange-600" },
    { label: "Score moyen d'activité", value: `${stats?.activeProjects || 0}%`, icon: "📊", color: "from-indigo-500 to-indigo-600" },
  ]

  const projetsRecents = stats?.projetsRecents ?? []
  const stagiairesActifs = stats?.stagiairesActifs ?? []

  return (
    <div>
      {/* Bienvenue */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          👋 Bonjour {session?.user?.name}
        </h1>
        <p className="text-gray-500 mt-1">Voici un aperçu global de votre plateforme</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <span className="text-3xl opacity-80">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Section : Projets récents + Stagiaires actifs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Projets récents */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📁 Projets récents</h2>
            <Link href="/dashboard/admin/projets" className="text-sm text-blue-600 hover:underline">
              Voir tout →
            </Link>
          </div>
          {projetsRecents.length > 0 ? (
            <div className="space-y-3">
              {projetsRecents.slice(0, 4).map((projet) => (
                <div key={projet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div>
                    <p className="font-medium text-gray-800">{projet.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      projet.status === "ACTIF" ? "bg-green-100 text-green-700" :
                      projet.status === "EN_ATTENTE" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {projet.status}
                    </span>
                  </div>
                  <Link href={`/dashboard/admin/projets/${projet.id}`} className="text-blue-600 text-sm hover:underline">
                    Détails →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucun projet récent</p>
          )}
        </div>

        {/* Stagiaires actifs */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🏆 Stagiaires les plus actifs</h2>
            <Link href="/dashboard/admin/stagiaires" className="text-sm text-blue-600 hover:underline">
              Voir tout →
            </Link>
          </div>
          {stagiairesActifs.length > 0 ? (
            <div className="space-y-3">
              {stagiairesActifs.slice(0, 4).map((stagiaire, index) => (
                <div key={stagiaire.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400 w-6 text-center">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{stagiaire.name}</p>
                      <p className="text-xs text-gray-400">{stagiaire.commits || 0} commits</p>
                    </div>
                  </div>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min((stagiaire.commits || 0) * 2, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucune activité récente</p>
          )}
        </div>
      </div>

      {/* Alertes IA */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <h2 className="text-lg font-semibold text-gray-800">Alertes IA</h2>
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">2 nouvelles</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium text-yellow-800">Projet "Backend" : aucun commit depuis 5 jours</p>
              <p className="text-sm text-yellow-600 mt-0.5">Une relance est recommandée</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <span className="text-xl">📉</span>
            <div>
              <p className="font-medium text-orange-800">Stagiaire Jean Dupont : baisse d'activité détectée</p>
              <p className="text-sm text-orange-600 mt-0.5">-40% de commits cette semaine</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}