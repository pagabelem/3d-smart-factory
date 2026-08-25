/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Defi {
  id: string
  title: string
  description: string
  xpReward: number
  startDate: string
  endDate: string
  isActive: boolean
  participations: { id: string }[]
}

export default function DefisPage() {
  const { data: session } = useSession()
  const [defis, setDefis] = useState<Defi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [newDefi, setNewDefi] = useState({
    title: "",
    description: "",
    xpReward: 50,
    startDate: "",
    endDate: "",
  })

  // Déclarer fetchDefis AVANT useEffect
  const fetchDefis = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/defis")
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(errorData.error || `Erreur ${res.status}`)
      }
      
      const data = await res.json()
      setDefis(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erreur fetchDefis:", error)
      setError(error instanceof Error ? error.message : "Erreur de chargement")
      setDefis([])
    } finally {
      setLoading(false)
    }
  }

  // Utiliser fetchDefis dans useEffect (après sa déclaration)
  useEffect(() => {
    fetchDefis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateDefi = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("/api/admin/defis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDefi),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(errorData.error || `Erreur ${res.status}`)
      }

      setShowForm(false)
      setNewDefi({ title: "", description: "", xpReward: 50, startDate: "", endDate: "" })
      await fetchDefis()
    } catch (error) {
      console.error("Erreur createDefi:", error)
      setError(error instanceof Error ? error.message : "Erreur lors de la création")
    }
  }

  const toggleDefiStatus = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/defis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`)
      }

      await fetchDefis()
    } catch (error) {
      console.error("Erreur toggleDefiStatus:", error)
      setError("Erreur lors de la mise à jour du défi")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement des défis...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🎯 Gestion des Défis</h1>
          <p className="text-gray-600 mt-1">Créez et gérez les challenges pour les stagiaires</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? "❌ Annuler" : "+ Nouveau Défi"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Créer un nouveau défi</h2>
          <form onSubmit={handleCreateDefi} className="space-y-4">
            <input
              type="text"
              placeholder="Titre du défi"
              value={newDefi.title}
              onChange={(e) => setNewDefi({ ...newDefi, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <textarea
              placeholder="Description"
              value={newDefi.description}
              onChange={(e) => setNewDefi({ ...newDefi, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">XP à gagner</label>
                <input
                  type="number"
                  value={newDefi.xpReward}
                  onChange={(e) => setNewDefi({ ...newDefi, xpReward: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="10"
                  step="10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date de début</label>
                <input
                  type="datetime-local"
                  value={newDefi.startDate}
                  onChange={(e) => setNewDefi({ ...newDefi, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date de fin</label>
                <input
                  type="datetime-local"
                  value={newDefi.endDate}
                  onChange={(e) => setNewDefi({ ...newDefi, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Créer le défi
            </button>
          </form>
        </div>
      )}

      {/* Liste des défis */}
      <div className="grid grid-cols-1 gap-4">
        {defis.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <p>Aucun défi créé pour le moment</p>
            <p className="text-sm">Créez votre premier défi pour motiver les stagiaires !</p>
          </div>
        ) : (
          defis.map((defi) => (
            <div key={defi.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{defi.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{defi.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-blue-600 font-medium">{defi.xpReward} XP</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">
                      📅 {new Date(defi.startDate).toLocaleDateString()} → {new Date(defi.endDate).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">
                      👥 {defi.participations?.length || 0} participants
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium
                    ${defi.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {defi.isActive ? '🟢 Actif' : '⏸️ Inactif'}
                  </span>
                  <button
                    onClick={() => toggleDefiStatus(defi.id, defi.isActive)}
                    className={`px-3 py-1 rounded-lg text-sm transition
                      ${defi.isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  >
                    {defi.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}