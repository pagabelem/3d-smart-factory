"use client"

import { useEffect, useState } from "react"

interface Document {
  id: string
  filename: string
  filepath: string
  createdAt: string
  indexedText: string | null
  uploadedBy: { id: string; name: string; email: string }
  project: { id: string; name: string } | null
}

interface Analysis {
  synthese: string
  questions: string[]
  recommandations: string[]
  generatedAt: string
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/documents")
      if (!res.ok) throw new Error("Erreur chargement documents")
      const data = await res.json()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const analyzeDocument = async (doc: Document) => {
    setAnalyzingId(doc.id)
    setError("")
    try {
      const res = await fetch("/api/admin/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ livrableId: doc.id }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de l'analyse")
      }
      const data = await res.json()
      setSelectedAnalysis(data)
      setSelectedDoc(doc)
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setAnalyzingId(null)
    }
  }

  const viewExistingAnalysis = (doc: Document) => {
    if (!doc.indexedText) return
    try {
      const parsed = JSON.parse(doc.indexedText)
      setSelectedAnalysis(parsed)
      setSelectedDoc(doc)
    } catch {
      setError("Impossible de lire l'analyse existante")
    }
  }
  
  const getFileType = (filename: string) => {
    if (filename.toLowerCase().endsWith(".pdf")) return "PDF"
    if (
      filename.toLowerCase().endsWith(".ppt") ||
      filename.toLowerCase().endsWith(".pptx")
    )
      return "PPT"
    return "DOC"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement des documents...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Documents des stagiaires</h1>
        <p className="text-gray-600 mt-1">
          Analysez et evaluez les documents envoyes par les stagiaires
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4">
        {documents.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
            <p>Aucun document envoye pour le moment</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
                    {getFileType(doc.filename)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{doc.filename}</p>
                    <p className="text-sm text-gray-500">
                      {doc.uploadedBy?.name || "Inconnu"} - {doc.project?.name || "Sans projet"} -{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.indexedText ? (
                    <button
                      onClick={() => viewExistingAnalysis(doc)}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition"
                    >
                      Voir l'analyse
                    </button>
                  ) : (
                    <button
                      onClick={() => analyzeDocument(doc)}
                      disabled={analyzingId === doc.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {analyzingId === doc.id ? "Analyse en cours..." : "Analyser"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {selectedAnalysis && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Analyse du document</h2>
                <p className="text-sm text-gray-500">{selectedDoc.filename}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedAnalysis(null)
                  setSelectedDoc(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl transition"
              >
                x
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Synthese</h3>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {selectedAnalysis.synthese}
                </p>
              </div>

              {selectedAnalysis.questions && selectedAnalysis.questions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Questions a poser
                  </h3>
                  <ul className="space-y-2">
                    {selectedAnalysis.questions.map((q, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAnalysis.recommandations && selectedAnalysis.recommandations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Recommandations
                  </h3>
                  <ul className="space-y-2">
                    {selectedAnalysis.recommandations.map((r, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedAnalysis(null)
                  setSelectedDoc(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}