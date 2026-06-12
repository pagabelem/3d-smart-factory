/* eslint-disable react/no-unescaped-entities */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface MyProject {
  id: string
  name: string
  myCommits: number
  totalCommits: number
  score: number
  lastCommit: string
}

export default function StagiaireDashboard() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<MyProject[]>([])
  const [loading, setLoading] = useState(true)
  const [iaTip, setIaTip] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/stagiaire/projects").then(res => res.json()),
      fetch("/api/stagiaire/ia-tip").then(res => res.json())
    ]).then(([projectsData, tipData]) => {
      setProjects(projectsData)
      setIaTip(tipData.tip)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div>Chargement de votre espace...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Bienvenue {session?.user?.name}
      </h1>
      <p className="text-gray-600 mb-8">
        Suivez votre progression et obtenez des conseils IA
      </p>

      {/* Conseil IA */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-semibold mb-1">Astuce personnalisée</h3>
            <p>{iaTip || "Continuez vos efforts, vous êtes sur la bonne voie !"}</p>
          </div>
        </div>
      </div>

      {/* Projets */}
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{project.name}</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Vos commits</div>
                <div className="text-2xl font-bold text-blue-600">{project.myCommits}</div>
                <div className="text-xs text-gray-400">sur {project.totalCommits} total</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Score d'implication</div>
                <div className="text-2xl font-bold text-green-600">{project.score}%</div>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">📅 Dernière activité: {project.lastCommit}</span>
              <Link
                href={`/dashboard/stagiaire/assistant`}
                className="text-blue-600 hover:underline"
              >
                Parler à l'assistant IA →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Assistant IA flottant */}
      <Link
        href="/dashboard/stagiaire/assistant"
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        💬
      </Link>
    </div>
  )
}