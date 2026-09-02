/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface ProjectDetail {
  id: string
  name: string
  description: string
  status: string
  summaryIA: string | null
  scoreActivite: number | null
  createdAt: string
  owner: { name: string; email: string }
  teams: { id: string; name: string; members: { user: { id: string; name: string } }[] }[]
  tasks: { id: string; title: string; status: string }[]
  gitRepos: { id: string; name: string; url: string }[]
}

export default function ProjectDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const id = params.id as string
  
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id])

  const fetchProject = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/projects/${id}`)
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement du projet...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-700">Projet non trouvé</h2>
        <p className="text-gray-500 mt-2">{error || "Le projet que vous cherchez n'existe pas."}</p>
        <Link href="/dashboard/admin/projets" className="inline-block mt-4 text-blue-600 hover:underline">
          ← Retour à la liste
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/dashboard/admin/projets" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Retour à la liste
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description || "Aucune description"}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-500">Responsable</div>
          <div className="text-lg font-semibold">{project.owner?.name || "Non assigné"}</div>
          <div className="text-sm text-gray-400">{project.owner?.email}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-500">Score d'activité</div>
          <div className="text-3xl font-bold text-blue-600">{project.scoreActivite || 0}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.scoreActivite || 0}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-500">Créé le</div>
          <div className="text-lg font-semibold">{new Date(project.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Résumé IA */}
      {project.summaryIA && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-700">🤖 Résumé IA</h3>
          <p className="text-gray-700 mt-1">{project.summaryIA}</p>
        </div>
      )}

      {/* Équipes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">👥 Équipes</h2>
        {project.teams.length === 0 ? (
          <p className="text-gray-500">Aucune équipe</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.teams.map((team) => (
              <div key={team.id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{team.name}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {team.members.length} membres
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {team.members.map((member) => (
                    <span key={member.user.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {member.user.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tâches */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📝 Tâches</h2>
        {project.tasks.length === 0 ? (
          <p className="text-gray-500">Aucune tâche</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {project.tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm">{task.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs
                  ${task.status === "TERMINE" ? "bg-green-100 text-green-700" : ""}
                  ${task.status === "EN_COURS" ? "bg-yellow-100 text-yellow-700" : ""}
                  ${task.status === "A_FAIRE" ? "bg-gray-100 text-gray-700" : ""}
                `}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dépôts Git */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">🔗 Dépôts Git</h2>
        {project.gitRepos.length === 0 ? (
          <p className="text-gray-500">Aucun dépôt Git lié</p>
        ) : (
          <ul className="space-y-2">
            {project.gitRepos.map((repo) => (
              <li key={repo.id} className="flex items-center gap-2">
                <span>📁</span>
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {repo.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}