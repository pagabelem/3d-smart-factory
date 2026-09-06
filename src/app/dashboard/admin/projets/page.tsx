/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import ModalConfirm from "@/src/components/ModalConfirm"

interface Project {
  id: string
  name: string
  description: string
  status: string
  summaryIA: string | null
  scoreActivite: number | null
  createdAt: string
  owner: { name: string; email: string }
  teams: { id: string; name: string; members: { user: { name: string } }[] }[]
  tasks: { id: string; status: string }[]
  gitRepos: { id: string; name: string; url: string }[]
}

export default function AdminProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    ownerId: "",
    gitUrl: "",
  })
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchUsers()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/projects")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?role=ENCADRANT")
      if (!res.ok) {
        console.error("Erreur API users:", res.status)
        return
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la création")
      }
      setShowForm(false)
      setNewProject({ name: "", description: "", ownerId: "", gitUrl: "" })
      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    }
  }

  const confirmDelete = (id: string) => {
    setProjectToDelete(id)
    setModalOpen(true)
  }

  const handleDelete = async () => {
    if (!projectToDelete) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/projects/${projectToDelete}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }
      setModalOpen(false)
      setProjectToDelete(null)
      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setDeleting(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement des projets...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Projets</h1>
          <p className="text-gray-600 mt-1">Gérez tous les projets de la plateforme</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? "Annuler" : "+ Nouveau Projet"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Créer un nouveau projet</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <input
              type="text"
              placeholder="Nom du projet"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <select
              value={newProject.ownerId}
              onChange={(e) => setNewProject({ ...newProject, ownerId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionner un encadrant</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <div>
              <input
                type="url"
                placeholder="https://github.com/... ou https://gitlab.com/..."
                value={newProject.gitUrl}
                onChange={(e) => setNewProject({ ...newProject, gitUrl: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL du dépôt GitHub ou GitLab (optionnel)
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Créer le projet
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {projects.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
            <p>Aucun projet créé pour le moment</p>
            <p className="text-sm">Créez votre premier projet pour commencer</p>
          </div>
        ) : (
          projects.map((project) => {
            const completedTasks = project.tasks?.filter(t => t.status === "TERMINE").length || 0
            const totalTasks = project.tasks?.length || 0
            const hasGitRepo = project.gitRepos && project.gitRepos.length > 0
            const gitUrl = hasGitRepo ? project.gitRepos[0].url : ""

            return (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-semibold">{project.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      {project.scoreActivite !== null && (
                        <span className="text-sm text-gray-500">
                          {project.scoreActivite}% d'activité
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{project.description || "Aucune description"}</p>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm items-center">
                      <span className="text-gray-500">
                        {project.owner?.name || "Sans responsable"}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">
                        {project.teams?.length || 0} équipes
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">
                        {completedTasks}/{totalTasks} tâches terminées
                      </span>
                      <span className="text-gray-400">|</span>
                      {hasGitRepo ? (
                        <a href={gitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Dépôt Git
                        </a>
                      ) : (
                        <span className="text-gray-400">Aucun dépôt lié</span>
                      )}
                    </div>

                    {project.summaryIA && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                        <span className="font-medium">Résumé IA :</span> {project.summaryIA}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 ml-4">
                    <Link
                      href={`/dashboard/admin/projets/${project.id}`}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
                    >
                      Détails
                    </Link>
                    <button
                      onClick={() => confirmDelete(project.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <ModalConfirm
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setProjectToDelete(null)
        }}
        onConfirm={handleDelete}
        title="Supprimer le projet"
        message="Etes-vous sur de vouloir supprimer ce projet ? Cette action est irreversible."
        confirmText="Supprimer definitivement"
        cancelText="Annuler"
        confirmColor="red"
        loading={deleting}
      />
    </div>
  )
}