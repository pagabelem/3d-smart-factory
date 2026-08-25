/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Alerte {
  id: string
  type: "INACTIVITE" | "DESENGAGEMENT" | "COMMIT_FLUIDE" | "INFO"
  message: string
  severity: "danger" | "warning" | "info"
  date: string
  stagiaire?: string
  stagiaireId?: string
  projet?: string
  resolved: boolean
}

interface Stats {
  totalAlertes: number
  alertesCritiques: number
  alertesResolues: number
  stagiairesInactifs: number
}

export default function EncadrantAlertesPage() {
  const { data: session } = useSession()
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<"all" | "danger" | "warning" | "info">("all")

  useEffect(() => {
    fetchAlertes()
  }, [])

  const fetchAlertes = async () => {
    setLoading(true)
    setError("")
    try {
      // Utiliser /alerts (avec un s)
      const res = await fetch("/api/encadrant/alerts")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setAlertes(Array.isArray(data) ? data : [])
      
      const total = data.length
      const critiques = data.filter((a: Alerte) => a.severity === "danger").length
      const resolues = data.filter((a: Alerte) => a.resolved).length
      const inactifs = data.filter((a: Alerte) => a.type === "INACTIVITE" && !a.resolved).length
      
      setStats({
        totalAlertes: total,
        alertesCritiques: critiques,
        alertesResolues: resolues,
        stagiairesInactifs: inactifs,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const resoudreAlerte = async (id: string) => {
    try {
      const res = await fetch(`/api/encadrant/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      })
      if (!res.ok) throw new Error("Erreur lors de la résolution")
      await fetchAlertes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "INACTIVITE": return "⏸️ Inactivité"
      case "DESENGAGEMENT": return "📉 Désengagement"
      case "COMMIT_FLUIDE": return "📝 Commit vague"
      default: return "ℹ️ Info"
    }
  }

  const filteredAlertes = alertes.filter(
    (a) => filter === "all" || a.severity === filter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement des alertes...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🔔 Alertes</h1>
          <p className="text-gray-500 mt-1">
            Surveillez l'activité de vos stagiaires
          </p>
        </div>
        <button
          onClick={fetchAlertes}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition flex items-center gap-2"
        >
          🔄 Rafraîchir
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total alertes</p>
            <p className="text-2xl font-bold text-gray-700">{stats.totalAlertes}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 border border-red-100">
            <p className="text-sm text-red-500">Critiques</p>
            <p className="text-2xl font-bold text-red-600">{stats.alertesCritiques}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-100">
            <p className="text-sm text-green-500">Résolues</p>
            <p className="text-2xl font-bold text-green-600">{stats.alertesResolues}</p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow-sm p-4 border border-orange-100">
            <p className="text-sm text-orange-500">Stagiaires inactifs</p>
            <p className="text-2xl font-bold text-orange-600">{stats.stagiairesInactifs}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "danger", "warning", "info"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "Toutes" : f === "danger" ? "🔴 Critique" : f === "warning" ? "⚠️ Attention" : "ℹ️ Info"}
          </button>
        ))}
      </div>

      {/* Liste des alertes */}
      <div className="space-y-3">
        {filteredAlertes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-gray-500">Aucune alerte pour le moment</p>
            <p className="text-sm text-gray-400">Tout est sous contrôle !</p>
          </div>
        ) : (
          filteredAlertes.map((alerte) => (
            <div
              key={alerte.id}
              className={`p-5 rounded-xl border ${getSeverityColor(alerte.severity)} transition ${
                alerte.resolved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getSeverityIcon(alerte.severity)}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">
                          {alerte.stagiaire || 'Stagiaire'}
                        </h3>
                        {alerte.projet && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            {alerte.projet}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {getTypeLabel(alerte.type)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{alerte.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alerte.date).toLocaleDateString()} - {new Date(alerte.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                {!alerte.resolved && (
                  <button
                    onClick={() => resoudreAlerte(alerte.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex-shrink-0 ml-4"
                  >
                    ✅ Résoudre
                  </button>
                )}
                {alerte.resolved && (
                  <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-lg text-sm ml-4">
                    Résolu
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}