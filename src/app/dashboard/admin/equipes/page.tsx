/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Encadrant {
  id: string
  name: string
  email: string
}

interface Stagiaire {
  id: string
  name: string
  email: string
}

interface Project {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  projectId: string
  projectName: string
  encadrantId?: string
  encadrantName?: string
  membersCount: number
}

export default function AdminEquipesPage() {
  const { data: session } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [encadrants, setEncadrants] = useState<Encadrant[]>([])
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    encadrantId: "",
    stagiaireIds: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const [teamsRes, projectsRes, encadrantsRes, stagiairesRes] = await Promise.all([
        fetch("/api/admin/teams"),
        fetch("/api/admin/projects"),
        fetch("/api/admin/users?role=ENCADRANT"),
        fetch("/api/admin/users?role=STAGIAIRE"),
      ])

      if (!teamsRes.ok) throw new Error("Erreur chargement équipes")
      if (!projectsRes.ok) throw new Error("Erreur chargement projets")
      if (!encadrantsRes.ok) throw new Error("Erreur chargement encadrants")
      if (!stagiairesRes.ok) throw new Error("Erreur chargement stagiaires")

      const teamsData = await teamsRes.json()
      const projectsData = await projectsRes.json()
      const encadrantsData = await encadrantsRes.json()
      const stagiairesData = await stagiairesRes.json()

      setTeams(Array.isArray(teamsData) ? teamsData : [])
      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setEncadrants(Array.isArray(encadrantsData) ? encadrantsData : [])
      setStagiaires(Array.isArray(stagiairesData) ? stagiairesData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (!formData.name || !formData.projectId || !formData.encadrantId) {
      setError("Nom, projet et encadrant sont requis")
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la création")
      }

      setShowForm(false)
      setFormData({ name: "", projectId: "", encadrantId: "", stagiaireIds: [] })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  const deleteTeam = async (id: string) => {
    if (!confirm("Supprimer cette équipe ?")) return
    try {
      const res = await fetch(`/api/admin/teams/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Erreur lors de la suppression")
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement des équipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">👥 Gestion des Équipes</h1>
          <p className="text-gray-500 mt-1">Créez et gérez les équipes de stagiaires</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition"
        >
          {showForm ? "❌ Annuler" : "+ Nouvelle Équipe"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4">Créer une nouvelle équipe</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nom de l'équipe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un projet</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={formData.encadrantId}
              onChange={(e) => setFormData({ ...formData, encadrantId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un encadrant</option>
              {encadrants.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner les stagiaires
              </label>
              <select
                multiple
                value={formData.stagiaireIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                  setFormData({ ...formData, stagiaireIds: selected })
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
              >
                {stagiaires.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Maintenir Ctrl pour sélectionner plusieurs</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? "Création..." : "Créer l'équipe"}
            </button>
          </form>
        </div>
      )}

      {/* Liste des équipes */}
      <div className="grid grid-cols-1 gap-4">
        {teams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-500">Aucune équipe créée</p>
            <p className="text-sm text-gray-400">Créez votre première équipe</p>
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">{team.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {team.projectName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>👨‍🏫 Encadrant: {team.encadrantName || "Non assigné"}</span>
                    <span>👥 {team.membersCount || 0} membres</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="text-red-400 hover:text-red-600 transition p-2"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}