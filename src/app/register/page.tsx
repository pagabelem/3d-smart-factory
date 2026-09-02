"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Team = { id: string; name: string }
type Project = { id: string; name: string; teams: Team[] }
type Encadrant = { id: string; name: string; email: string }

export default function RegisterPage() {
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [encadrants, setEncadrants] = useState<Encadrant[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [projectId, setProjectId] = useState("")
  const [teamId, setTeamId] = useState("")
  const [encadrantId, setEncadrantId] = useState("")
  const [dateDebutStage, setDateDebutStage] = useState("")
  const [dateFinStage, setDateFinStage] = useState("")
  const [numeroCarteSejour, setNumeroCarteSejour] = useState("")

  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/register/options")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || [])
        setEncadrants(data.encadrants || [])
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  const selectedProject = projects.find((p) => p.id === projectId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom,
        prenom,
        email,
        password,
        teamId,
        encadrantId,
        dateDebutStage,
        dateFinStage,
        numeroCarteSejour,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error || "Une erreur est survenue.")
      return
    }

    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Inscription Stagiaire
        </h1>
        <p className="text-gray-500 text-center mb-6">
          3D Smart Factory — Plateforme de suivi des stagiaires
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email personnel
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projet
            </label>
            <select
              required
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                setTeamId("")
              }}
              disabled={loadingOptions}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir un projet --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Équipe
            </label>
            <select
              required
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={!projectId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir une équipe --</option>
              {selectedProject?.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encadrant
            </label>
            <select
              required
              value={encadrantId}
              onChange={(e) => setEncadrantId(e.target.value)}
              disabled={loadingOptions}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choisir un encadrant --</option>
              {encadrants.map((enc) => (
                <option key={enc.id} value={enc.id}>
                  {enc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Début de stage
              </label>
              <input
                type="date"
                required
                value={dateDebutStage}
                onChange={(e) => setDateDebutStage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fin de stage
              </label>
              <input
                type="date"
                required
                value={dateFinStage}
                onChange={(e) => setDateFinStage(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de carte de séjour
            </label>
            <input
              type="text"
              required
              value={numeroCarteSejour}
              onChange={(e) => setNumeroCarteSejour(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}