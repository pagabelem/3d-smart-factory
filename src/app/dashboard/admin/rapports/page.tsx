/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/immutability */
"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import html2canvas from "html2canvas-pro"
import jsPDF from "jspdf"

interface Rapport {
  id: string
  titre: string
  type: "hebdomadaire" | "mensuel" | "personnalise"
  date: string
  contenu: string
  statut: "en_attente" | "genere" | "en_cours"
  projet?: string
}

export default function AdminRapportsPage() {
  const { data: session } = useSession()
  const [rapports, setRapports] = useState<Rapport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRapport, setSelectedRapport] = useState<Rapport | null>(null)
  const [generating, setGenerating] = useState(false)
  const rapportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRapports()
  }, [])

  const fetchRapports = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/admin/rapports")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setRapports(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

const exportPDF = async () => {
  if (!rapportRef.current || !selectedRapport) return

  const canvas = await html2canvas(rapportRef.current, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })

  const imgData = canvas.toDataURL("image/jpeg", 0.98)
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth - 20
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 10

  pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight)
  heightLeft -= pageHeight - 20

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10
    pdf.addPage()
    pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20
  }

  pdf.save(`rapport_${selectedRapport.type}_${selectedRapport.id}.pdf`)
}



const getStatusColor = (statut: string) => {
  switch (statut) {
    case "genere": return "bg-green-100 text-green-700"
    case "en_cours": return "bg-blue-100 text-blue-700"
    case "en_attente": return "bg-yellow-100 text-yellow-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

const generateRapport = async (type: "hebdomadaire" | "mensuel") => {
  setGenerating(true)
  setError("")
  try {
    const res = await fetch("/api/admin/rapports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || "Erreur lors de la génération")
    }
    const data = await res.json()
    setRapports((prev) => [data, ...prev])
  } catch (err) {
    setError(err instanceof Error ? err.message : "Erreur inconnue")
  } finally {
    setGenerating(false)
  }
}

const exportText = () => {
  if (!selectedRapport) return
  const blob = new Blob([selectedRapport.contenu || ""], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `rapport_${selectedRapport.type}_${selectedRapport.id}.txt`
  a.click()
  URL.revokeObjectURL(url)
}



  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case "genere": return "✅ Généré"
      case "en_cours": return "⏳ En cours"
      case "en_attente": return "⏸️ En attente"
      default: return statut
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hebdomadaire": return "📅"
      case "mensuel": return "📆"
      case "personnalise": return "🎯"
      default: return "📄"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Chargement des rapports...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">📄 Rapports IA</h1>
          <p className="text-gray-600 mt-1">Générez et consultez les rapports intelligents</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => generateRapport("hebdomadaire")}
            disabled={generating}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? "⏳ Génération..." : "📅 Rapport Hebdo"}
          </button>
          <button
            onClick={() => generateRapport("mensuel")}
            disabled={generating}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? "⏳ Génération..." : "📆 Rapport Mensuel"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          ❌ {error}
        </div>
      )}

      {/* Liste des rapports */}
      <div className="grid grid-cols-1 gap-4">
        {rapports.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">📄</div>
            <p>Aucun rapport généré</p>
            <p className="text-sm">Cliquez sur "Rapport Hebdo" ou "Rapport Mensuel" pour générer un rapport</p>
          </div>
        ) : (
          rapports.map((rapport) => (
            <div key={rapport.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 border border-gray-100">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(rapport.type)}</span>
                    <div>
                      <h3 className="font-semibold text-lg capitalize">
                        Rapport {rapport.type}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(rapport.date).toLocaleDateString()} {rapport.projet && `• Projet: ${rapport.projet}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg line-clamp-3">
                    <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
                      {rapport.contenu ? (
                        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                          {`${rapport.contenu.substring(0, 300)}...`}
                        </ReactMarkdown>
                      ) : (
                        "Contenu en cours de génération..."
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rapport.statut)}`}>
                    {getStatusLabel(rapport.statut)}
                  </span>
                  {rapport.statut === "genere" && (
                    <button
                      onClick={() => setSelectedRapport(rapport)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Voir détails →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal d'aperçu du rapport */}
      {selectedRapport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  {getTypeIcon(selectedRapport.type)} Rapport {selectedRapport.type}
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedRapport.date).toLocaleString()}
                  {selectedRapport.projet && ` • Projet: ${selectedRapport.projet}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedRapport(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl transition"
              >
                ×
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh] bg-white" ref={rapportRef}>
              <div className="prose prose-lg max-w-none">
                {selectedRapport.contenu ? (
                  <ReactMarkdown
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-semibold text-gray-600 mt-4 mb-2">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc pl-6 space-y-1">{children}</ul>,
                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {selectedRapport.contenu}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-400 italic">Aucun contenu disponible</p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-end gap-3">
              <button
                onClick={exportText}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              >
                ⬇️ TXT
              </button>
              <button
                onClick={exportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                ⬇️ PDF
              </button>
              <button
                onClick={() => setSelectedRapport(null)}
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