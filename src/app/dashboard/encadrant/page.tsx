"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  progress: number
  lastCommit: string
  teamMembers: number
}

export default function EncadrantDashboard() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/encadrant/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Chargement de vos projets...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Bonjour {session?.user?.name}
      </h1>
      <p className="text-gray-600 mb-8">
        Projets dont vous êtes responsable
      </p>

      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <p className="text-gray-500 text-sm">
                  Équipe: {project.teamMembers} membres
                </p>
              </div>
              <Link
                href={`/dashboard/encadrant/projets/${project.id}`}
                className="text-blue-600 hover:underline"
              >
                Voir détails →
              </Link>
            </div>

            {/* Barre de progression */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progression</span>
                <span>{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span>📅 Dernier commit: {project.lastCommit}</span>
              <button className="text-blue-600 hover:underline">
                Générer rapport IA →
              </button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          Aucun projet assigné pour le moment.
        </div>
      )}
    </div>
  )
}