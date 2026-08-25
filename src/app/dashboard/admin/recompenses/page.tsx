/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  createdAt: string
  userBadges: { id: string }[]
}

interface BadgeFormData {
  id?: string
  name: string
  description: string
  icon: string
  xpReward: number
}

const BADGE_ICONS = ["🎉", "🥷", "📖", "🤝", "⚡", "✨", "🏆", "🌟", "💪", "🧠", "🎯", "🚀"]

export default function AdminRecompensesPage() {
  const { data: session } = useSession()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<BadgeFormData>({
    name: "",
    description: "",
    icon: "🏆",
    xpReward: 50,
  })
  const [submitting, setSubmitting] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/badges")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setBadges(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setIsEditing(false)
    setFormData({ name: "", description: "", icon: "🏆", xpReward: 50 })
    setIsModalOpen(true)
  }

  const openEditModal = (badge: Badge) => {
    setIsEditing(true)
    setFormData({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      xpReward: badge.xpReward,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({ name: "", description: "", icon: "🏆", xpReward: 50 })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const url = isEditing ? `/api/admin/badges/${formData.id}` : "/api/admin/badges"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de l'opération")
      }

      closeModal()
      await fetchBadges()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (id: string) => {
    setBadgeToDelete(id)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!badgeToDelete) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/badges/${badgeToDelete}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }
      setDeleteModalOpen(false)
      setBadgeToDelete(null)
      await fetchBadges()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement des récompenses...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🎁 Gestion des Récompenses</h1>
          <p className="text-gray-600 mt-1">Créez et gérez les badges pour les stagiaires</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2"
        >
          <span>+</span> Nouveau Badge
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* Liste des badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">🎁</div>
            <p>Aucun badge créé</p>
          </div>
        ) : (
          badges.map((badge) => (
            <div key={badge.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl shadow-inner">
                    {badge.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{badge.name}</h3>
                    <p className="text-sm text-gray-500">{badge.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-amber-600">⭐ {badge.xpReward} XP</span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-400">{badge.userBadges?.length || 0} stagiaires</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(badge)}
                    className="text-blue-400 hover:text-blue-600 transition p-1"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => confirmDelete(badge.id)}
                    className="text-red-400 hover:text-red-600 transition p-1"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                  {isEditing ? "✏️ Modifier le badge" : "➕ Créer un badge"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing ? "Mettez à jour les informations" : "Ajoutez une nouvelle récompense"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-3xl transition"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du badge *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                  required
                  placeholder="Ex: Ninja du code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                  rows={2}
                  required
                  placeholder="Décrivez ce badge..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icône *</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                  >
                    {BADGE_ICONS.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">XP *</label>
                  <input
                    type="number"
                    value={formData.xpReward}
                    onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                    min="10"
                    step="5"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {submitting ? "En cours..." : isEditing ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Supprimer le badge</h2>
              <p className="text-gray-500 mt-2">Cette action est irréversible.</p>
              <p className="text-sm text-gray-400">Les stagiaires perdront ce badge.</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setBadgeToDelete(null)
                }}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-xl transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}