/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface ProjectStats {
  id: string
  name: string
  description: string
  status: string
  progress: number
  members: number
  commits: number
  tasks: { total: number; done: number }
  lastActivity: string
}

interface Alert {
  id: string
  type: string
  message: string
  severity: "info" | "warning" | "danger"
  date: string
}

export default function EncadrantDashboard() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<ProjectStats[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalStagiaires: 0,
    totalCommits: 0,
    activeProjects: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [projectsRes, alertsRes] = await Promise.all([
        fetch("/api/encadrant/projects"),
        fetch("/api/encadrant/alerts"),
      ])

      const projectsData = await projectsRes.json()
      const alertsData = await alertsRes.json()

      setProjects(projectsData || [])
      setAlerts(alertsData || [])

      // Calculer les stats
      const totalProjects = projectsData?.length || 0
      const totalStagiaires = projectsData?.reduce((acc: number, p: ProjectStats) => acc + (p.members || 0), 0) || 0
      const totalCommits = projectsData?.reduce((acc: number, p: ProjectStats) => acc + (p.commits || 0), 0) || 0
      const activeProjects = projectsData?.filter((p: ProjectStats) => p.status === "ACTIF").length || 0

      setStats({ totalProjects, totalStagiaires, totalCommits, activeProjects })
    } catch (error) {
      console.error("Erreur chargement:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIF": return "bg-green-100 text-green-700"
      case "EN_ATTENTE": return "bg-yellow-100 text-yellow-700"
      case "TERMINE": return "bg-gray-100 text-gray-700"
      default: return "bg-blue-100 text-blue-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIF": return "🟢 Actif"
      case "EN_ATTENTE": return "🟡 En attente"
      case "TERMINE": return "⚪ Terminé"
      default: return status
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "danger": return "bg-red-50 border-red-200 text-red-700"
      case "warning": return "bg-yellow-50 border-yellow-200 text-yellow-700"
      default: return "bg-blue-50 border-blue-200 text-blue-700"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "danger": return "🔴"
      case "warning": return "⚠️"
      default: return "ℹ️"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de votre espace...</p>
        </div>
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
        <p className="text-gray-500 mt-1">Voici un aperçu de vos projets et de votre équipe</p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Projets supervisés</p>
              <p className="text-3xl font-bold mt-1">{stats.totalProjects}</p>
            </div>
            <span className="text-3xl opacity-80">📁</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Stagiaires</p>
              <p className="text-3xl font-bold mt-1">{stats.totalStagiaires}</p>
            </div>
            <span className="text-3xl opacity-80">👥</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Commits total</p>
              <p className="text-3xl font-bold mt-1">{stats.totalCommits}</p>
            </div>
            <span className="text-3xl opacity-80">📝</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Projets actifs</p>
              <p className="text-3xl font-bold mt-1">{stats.activeProjects}</p>
            </div>
            <span className="text-3xl opacity-80">🔥</span>
          </div>
        </div>
      </div>

      {/* Projets et Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projets */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📊 Vos projets</h2>
            <Link href="/dashboard/encadrant/equipe" className="text-sm text-emerald-600 hover:underline">
              Voir tout →
            </Link>
          </div>
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.slice(0, 4).map((project) => (
                <div key={project.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.description || "Aucune description"}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>👥 {project.members} membres</span>
                    <span>📝 {project.commits} commits</span>
                    <span>✅ {project.tasks?.done || 0}/{project.tasks?.total || 0} tâches</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                      <span>Progression</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Aucun projet assigné</p>
          )}
        </div>

        {/* Alertes */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">🔔 Alertes</h2>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {alerts.filter(a => a.severity === "danger").length} critiques
            </span>
          </div>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.message}</p>
                      <p className="text-xs opacity-70 mt-0.5">{new Date(alert.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">✅ Aucune alerte pour le moment</p>
          )}
        </div>
      </div>
    </div>
  )
}