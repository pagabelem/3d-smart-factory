

/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Objectif {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  deadline: string
  completed: boolean
}

export default function StagiaireObjectifsPage() {
  const { data: session } = useSession()
  const [objectifs, setObjectifs] = useState<Objectif[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [newObjectif, setNewObjectif] = useState({
    title: "",
    description: "",
    target: 10,
    unit: "commits",
    deadline: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchObjectifs()
  }, [])

  const fetchObjectifs = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/objectifs")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setObjectifs(Array.isArray(data) ? data : [])
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
    try {
      const res = await fetch("/api/stagiaire/objectifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newObjectif),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la création")
      }
      setShowForm(false)
      setNewObjectif({ title: "", description: "", target: 10, unit: "commits", deadline: "" })
      await fetchObjectifs()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleObjectif = async (id: string) => {
    try {
      const res = await fetch(`/api/stagiaire/objectifs/${id}`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error("Erreur")
      await fetchObjectifs()
    } catch (err) {
      setError("Erreur lors de la mise à jour")
    }
  }

  const deleteObjectif = async (id: string) => {
    if (!confirm("Supprimer cet objectif ?")) return
    try {
      const res = await fetch(`/api/stagiaire/objectifs/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Erreur")
      await fetchObjectifs()
    } catch (err) {
      setError("Erreur lors de la suppression")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de vos objectifs...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🎯 Objectifs personnels</h1>
          <p className="text-gray-500 mt-1">Fixez-vous des objectifs pour progresser</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition"
        >
          {showForm ? "❌ Annuler" : "+ Nouvel objectif"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4">Nouvel objectif</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Titre"
              value={newObjectif.title}
              onChange={(e) => setNewObjectif({ ...newObjectif, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newObjectif.description}
              onChange={(e) => setNewObjectif({ ...newObjectif, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Objectif</label>
                <input
                  type="number"
                  value={newObjectif.target}
                  onChange={(e) => setNewObjectif({ ...newObjectif, target: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Unité</label>
                <select
                  value={newObjectif.unit}
                  onChange={(e) => setNewObjectif({ ...newObjectif, unit: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="commits">Commits</option>
                  <option value="tâches">Tâches</option>
                  <option value="jours">Jours</option>
                  <option value="XP">XP</option>
                </select>
              </div>
            </div>
            <input
              type="date"
              value={newObjectif.deadline}
              onChange={(e) => setNewObjectif({ ...newObjectif, deadline: e.target.value })}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? "Création..." : "Créer l'objectif"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objectifs.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-500">Aucun objectif défini</p>
            <p className="text-sm text-gray-400">Fixez-vous un premier objectif !</p>
          </div>
        ) : (
          objectifs.map((obj) => {
            const progress = Math.min(Math.round((obj.current / obj.target) * 100), 100)
            const isCompleted = obj.completed || progress >= 100

            return (
              <div key={obj.id} className={`bg-white rounded-2xl shadow-md p-6 border ${isCompleted ? 'border-green-300' : 'border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold ${isCompleted ? 'text-green-600' : 'text-gray-800'}`}>
                      {obj.title}
                      {isCompleted && " ✅"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleObjectif(obj.id)}
                      className="text-gray-400 hover:text-green-600 transition p-1"
                    >
                      {isCompleted ? "↩️" : "✅"}
                    </button>
                    <button
                      onClick={() => deleteObjectif(obj.id)}
                      className="text-gray-400 hover:text-red-600 transition p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>{obj.current} / {obj.target} {obj.unit}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  🗓️ {new Date(obj.deadline).toLocaleDateString()}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}