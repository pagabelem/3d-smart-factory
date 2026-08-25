/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Evaluation {
  id: string
  stagiaire: string
  stagiaireId: string
  projet: string
  projetId: string
  note: number
  commentaire: string
  date: string
}

interface Stagiaire {
  id: string
  name: string
  email: string
}

interface Projet {
  id: string
  name: string
}

export default function EncadrantEvaluationsPage() {
  const { data: session } = useSession()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [projets, setProjets] = useState<Projet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    stagiaireId: "",
    projetId: "",
    note: "",
    commentaire: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const [evaluationsRes, stagiairesRes, projetsRes] = await Promise.all([
        fetch("/api/encadrant/evaluations"),
        fetch("/api/encadrant/stagiaires"),
        fetch("/api/encadrant/projects"),
      ])

      if (!evaluationsRes.ok) throw new Error("Erreur chargement évaluations")
      if (!stagiairesRes.ok) throw new Error("Erreur chargement stagiaires")
      if (!projetsRes.ok) throw new Error("Erreur chargement projets")

      const evaluationsData = await evaluationsRes.json()
      const stagiairesData = await stagiairesRes.json()
      const projetsData = await projetsRes.json()

      setEvaluations(Array.isArray(evaluationsData) ? evaluationsData : [])
      setStagiaires(Array.isArray(stagiairesData) ? stagiairesData : [])
      setProjets(Array.isArray(projetsData) ? projetsData : [])
    } catch (err) {
      console.error("Erreur fetchData:", err)
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
      const res = await fetch("/api/encadrant/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stagiaireId: formData.stagiaireId,
          projetId: formData.projetId,
          note: parseFloat(formData.note),
          commentaire: formData.commentaire,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(errorData.error || "Erreur lors de la création")
      }

      setShowForm(false)
      setFormData({ stagiaireId: "", projetId: "", note: "", commentaire: "" })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement des évaluations...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📝 Évaluations</h1>
          <p className="text-gray-500 mt-1">Évaluez les stagiaires de votre équipe</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition"
        >
          {showForm ? "❌ Annuler" : "+ Nouvelle évaluation"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold mb-4">Nouvelle évaluation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={formData.stagiaireId}
              onChange={(e) => setFormData({ ...formData, stagiaireId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Sélectionner un stagiaire</option>
              {stagiaires.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={formData.projetId}
              onChange={(e) => setFormData({ ...formData, projetId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Sélectionner un projet</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Note (0-20)"
                min="0"
                max="20"
                step="0.5"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="text"
                placeholder="Compétence évaluée"
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled
                value="Évaluation générale"
              />
            </div>
            <textarea
              placeholder="Commentaire..."
              rows={3}
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? "Enregistrement..." : "Enregistrer l'évaluation"}
            </button>
          </form>
        </div>
      )}

      {/* Liste des évaluations */}
      <div className="space-y-4">
        {evaluations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500">Aucune évaluation pour le moment</p>
            <p className="text-sm text-gray-400">Commencez à évaluer vos stagiaires</p>
          </div>
        ) : (
          evaluations.map((eval_) => (
            <div key={eval_.id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">{eval_.stagiaire}</h3>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                      {eval_.projet}
                    </span>
                  </div>
                  <p className="text-gray-700 mt-2">{eval_.commentaire}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(eval_.date).toLocaleDateString()} - {new Date(eval_.date).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-emerald-600">{eval_.note}/20</span>
                  <div className="mt-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.round(eval_.note / 4) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}