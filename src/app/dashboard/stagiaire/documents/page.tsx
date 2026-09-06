"use client"

import { useEffect, useState } from "react"

interface Project {
  id: string
  name: string
}

interface Document {
  id: string
  filename: string
  filepath: string
  createdAt: string
  project: { id: string; name: string } | null
}

export default function StagiaireDocumentsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [projectsRes, documentsRes] = await Promise.all([
        fetch("/api/stagiaire/projets"),
        fetch("/api/stagiaire/documents"),
      ])

      if (!projectsRes.ok) throw new Error("Erreur chargement projets")
      if (!documentsRes.ok) throw new Error("Erreur chargement documents")

      const projectsData = await projectsRes.json()
      const documentsData = await documentsRes.json()

      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setDocuments(Array.isArray(documentsData) ? documentsData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!selectedFile || !selectedProjectId) {
      setError("Merci de choisir un projet et un fichier")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("projectId", selectedProjectId)

      const res = await fetch("/api/stagiaire/documents", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de l'envoi")
      }

      setSuccess("Document envoye avec succes")
      setSelectedFile(null)
      setSelectedProjectId("")
      const fileInput = document.getElementById("file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setUploading(false)
    }
  }
  
  const getFileIcon = (filename: string) => {
    if (filename.toLowerCase().endsWith(".pdf")) return "PDF"
    if (
      filename.toLowerCase().endsWith(".ppt") ||
      filename.toLowerCase().endsWith(".pptx")
    )
      return "PPT"
    return "DOC"
  }

  const openDocument = (filepath: string) => {
    window.open(filepath, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mes documents</h1>
        <p className="text-gray-500 mt-1">
          Envoyez vos rapports PDF et presentations PowerPoint
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6">
          {success}
        </div>
      )}
      
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Envoyer un nouveau document
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          >
            <option value="">Selectionner un projet</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.ppt,.pptx"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Formats acceptes : PDF, PPT, PPTX (20 Mo maximum)
            </p>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-xl hover:shadow-lg transition disabled:opacity-50"
          >
            {uploading ? "Envoi en cours..." : "Envoyer le document"}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Documents envoyes
        </h2>
        {documents.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Vous n'avez pas encore envoye de document
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700">
                    {getFileIcon(doc.filename)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {doc.project?.name || "Projet inconnu"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDocument(doc.filepath)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ouvrir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}