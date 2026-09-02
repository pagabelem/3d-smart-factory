/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import ModalConfirm from "@/src/components/ModalConfirm"

interface Stagiaire {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: {
    tasks: number
    scores: number
    badges: number
  }
  badges: { badge: { name: string; icon: string } }[]
}

interface StagiaireFormData {
  id?: string
  name: string
  email: string
  password: string
}

export default function AdminStagiairesPage() {
  const { data: session } = useSession()
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // États pour le modal de création/édition
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<StagiaireFormData>({
    name: "",
    email: "",
    password: "",
  })
  const [submitting, setSubmitting] = useState(false)
  
  // États pour le modal de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [stagiaireToDelete, setStagiaireToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchStagiaires()
  }, [])

  const fetchStagiaires = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/users?role=STAGIAIRE")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setStagiaires(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setIsEditing(false)
    setFormData({ name: "", email: "", password: "" })
    setIsModalOpen(true)
  }

  const openEditModal = (stagiaire: Stagiaire) => {
    setIsEditing(true)
    setFormData({
      id: stagiaire.id,
      name: stagiaire.name,
      email: stagiaire.email,
      password: "",
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({ name: "", email: "", password: "" })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const url = isEditing ? `/api/admin/users/${formData.id}` : "/api/admin/users"
      const method = isEditing ? "PUT" : "POST"
      
      const payload = isEditing 
        ? { name: formData.name, email: formData.email, password: formData.password || undefined }
        : { ...formData, role: "STAGIAIRE" }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de l'opération")
      }

      closeModal()
      await fetchStagiaires()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (id: string) => {
    setStagiaireToDelete(id)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!stagiaireToDelete) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${stagiaireToDelete}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }
      setDeleteModalOpen(false)
      setStagiaireToDelete(null)
      await fetchStagiaires()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-orange-500', 'bg-teal-500',
      'bg-indigo-500', 'bg-red-500'
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement des stagiaires...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">👥 Gestion des Stagiaires</h1>
          <p className="text-gray-600 mt-1">Gérez tous les stagiaires de la plateforme</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span> Nouveau Stagiaire
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* Liste des stagiaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stagiaires.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">👥</div>
            <p>Aucun stagiaire inscrit</p>
          </div>
        ) : (
          stagiaires.map((stagiaire) => (
            <div key={stagiaire.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${getRandomColor(stagiaire.name)} flex items-center justify-center text-white font-bold text-lg`}>
                    {getInitials(stagiaire.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{stagiaire.name}</h3>
                    <p className="text-sm text-gray-500">{stagiaire.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(stagiaire)}
                    className="text-blue-400 hover:text-blue-600 transition p-1"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => confirmDelete(stagiaire.id)}
                    className="text-red-400 hover:text-red-600 transition p-1"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-blue-600">
                    {stagiaire._count?.tasks || 0}
                  </div>
                  <div className="text-xs text-gray-500">Tâches</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">
                    {stagiaire._count?.badges || 0}
                  </div>
                  <div className="text-xs text-gray-500">Badges</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-purple-600">
                    {stagiaire._count?.scores || 0}
                  </div>
                  <div className="text-xs text-gray-500">Évaluations</div>
                </div>
              </div>

              {stagiaire.badges && stagiaire.badges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {stagiaire.badges.slice(0, 3).map((b, index) => (
                    <span key={index} className="text-lg" title={b.badge.name}>
                      {b.badge.icon}
                    </span>
                  ))}
                  {stagiaire.badges.length > 3 && (
                    <span className="text-xs text-gray-400">+{stagiaire.badges.length - 3}</span>
                  )}
                </div>
              )}

              <div className="mt-3 text-xs text-gray-400">
                Inscrit le {new Date(stagiaire.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditing ? "✏️ Modifier le stagiaire" : "➕ Ajouter un stagiaire"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    placeholder="Laisser vide pour 'changeme123'"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Par défaut : changeme123</p>
                </div>
              )}

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    placeholder="Laisser vide pour ne pas changer"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Remplir uniquement pour changer le mot de passe</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {submitting ? "En cours..." : isEditing ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ModalConfirm
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setStagiaireToDelete(null)
        }}
        onConfirm={handleDelete}
        title="Supprimer le stagiaire"
        message="Êtes-vous sûr de vouloir supprimer ce stagiaire ? Cette action est irréversible."
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        confirmColor="red"
        loading={deleting}
      />
    </div>
  )
}