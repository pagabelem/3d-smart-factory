/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface Encadrant {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: {
    ownedProjects: number
    tasks: number
  }
}

interface EncadrantFormData {
  id?: string
  name: string
  email: string
  password: string
}

export default function AdminEncadrantsPage() {
  const { data: session } = useSession()
  const [encadrants, setEncadrants] = useState<Encadrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // États pour les modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<EncadrantFormData>({
    name: "",
    email: "",
    password: "",
  })
  const [submitting, setSubmitting] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [encadrantToDelete, setEncadrantToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchEncadrants()
  }, [])

  const fetchEncadrants = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/users?role=ENCADRANT")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setEncadrants(Array.isArray(data) ? data : [])
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

  const openEditModal = (encadrant: Encadrant) => {
    setIsEditing(true)
    setFormData({
      id: encadrant.id,
      name: encadrant.name,
      email: encadrant.email,
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
        : { ...formData, role: "ENCADRANT" }

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
      await fetchEncadrants()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (id: string) => {
    setEncadrantToDelete(id)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!encadrantToDelete) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${encadrantToDelete}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }
      setDeleteModalOpen(false)
      setEncadrantToDelete(null)
      await fetchEncadrants()
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
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-orange-500', 'bg-teal-500', 'bg-cyan-500',
      'bg-rose-500', 'bg-amber-500'
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement des encadrants...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">👨‍🏫 Gestion des Encadrants</h1>
          <p className="text-gray-600 mt-1">Gérez tous les encadrants de la plateforme</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2"
        >
          <span>+</span> Nouvel Encadrant
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* Liste des encadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {encadrants.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <p>Aucun encadrant inscrit</p>
          </div>
        ) : 
          encadrants.map((encadrant) => (
  <div key={encadrant.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={`w-14 h-14 rounded-full ${getRandomColor(encadrant.name)} flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0`}>
          {getInitials(encadrant.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg truncate">{encadrant.name}</h3>
          <p className="text-sm text-gray-500 truncate">{encadrant.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
            Encadrant
          </span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0 ml-2">
        <button
          onClick={() => openEditModal(encadrant)}
          className="text-blue-400 hover:text-blue-600 transition p-1.5 rounded-lg hover:bg-blue-50"
          title="Modifier"
        >
          ✏️
        </button>
        <button
          onClick={() => confirmDelete(encadrant.id)}
          className="text-red-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50"
          title="Supprimer"
        >
          🗑️
        </button>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-indigo-600">
          {encadrant._count?.ownedProjects || 0}
        </div>
        <div className="text-xs text-gray-500">Projets supervisés</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-purple-600">
          {encadrant._count?.tasks || 0}
        </div>
        <div className="text-xs text-gray-500">Tâches assignées</div>
      </div>
    </div>

    <div className="mt-3 text-xs text-gray-400">
      Inscrit le {new Date(encadrant.createdAt).toLocaleDateString()}
    </div>
  </div>
))}
      </div>

      {/* Modal de création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {isEditing ? "✏️ Modifier l'encadrant" : "➕ Ajouter un encadrant"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing ? "Mettez à jour les informations" : "Créez un nouveau compte encadrant"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                  required
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                  required
                  placeholder="jean.dupont@example.com"
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
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
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
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              )}

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
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
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

      {/* Modal de confirmation */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Supprimer l'encadrant</h2>
              <p className="text-gray-500 mt-2">Êtes-vous sûr de vouloir supprimer cet encadrant ?</p>
              <p className="text-sm text-gray-400 mt-1">Cette action est irréversible.</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setEncadrantToDelete(null)
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
                {deleting ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}