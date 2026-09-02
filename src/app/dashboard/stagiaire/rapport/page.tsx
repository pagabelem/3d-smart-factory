/* eslint-disable react-hooks/immutability */
/* eslint-disable react/no-unescaped-entities */

"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import html2canvas from "html2canvas-pro"
import jsPDF from "jspdf"
interface RapportData {
  id: string
  titre: string
  contenu: string
  date: string
  statut: "en_attente" | "genere"
}

export default function StagiaireRapportPage() {
  const { data: session } = useSession()
  const [rapport, setRapport] = useState<RapportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const rapportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRapport()
  }, [])

  const fetchRapport = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/rapport")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data = await res.json()
      setRapport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const generateRapport = async () => {
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/rapport", {
        method: "POST",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la génération")
      }
      const data = await res.json()
      setRapport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setGenerating(false)
    }
  }

const exportPDF = async () => {
  if (!rapportRef.current || !rapport) return

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

  pdf.save(`rapport_stage_${rapport.id}.pdf`)
}

  const exportText = () => {
    if (!rapport) return
    const blob = new Blob([rapport.contenu || ""], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rapport_stage_${rapport.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de votre rapport...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📄 Mon Rapport de Stage</h1>
          <p className="text-gray-500 mt-1">
            Générez et téléchargez votre rapport de stage personnalisé
          </p>
        </div>
        <div className="flex gap-3">
          {rapport && rapport.statut === "genere" && (
            <>
              <button
                onClick={exportText}
                className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition flex items-center gap-2"
              >
                ⬇️ TXT
              </button>
              <button
                onClick={exportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
              >
                ⬇️ PDF
              </button>
            </>
          )}
          <button
            onClick={generateRapport}
            disabled={generating}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? "⏳ Génération..." : rapport ? "🔄 Régénérer" : "🤖 Générer le rapport"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          ❌ {error}
        </div>
      )}

      {rapport ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-8" ref={rapportRef}>
            <div className="text-center border-b border-gray-200 pb-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800">{rapport.titre}</h1>
              <p className="text-gray-500 mt-2">
                {session?.user?.name} - {new Date(rapport.date).toLocaleDateString()}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                rapport.statut === "genere" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {rapport.statut === "genere" ? "✅ Généré" : "⏳ En cours"}
              </span>
            </div>

            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-600 mt-4 mb-2">{children}</h3>,
                  ul: ({ children }) => <ul className="list-disc pl-6 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1">{children}</ol>,
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
                {rapport.contenu || "Contenu en cours de génération..."}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-100">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-700">Aucun rapport généré</h3>
          <p className="text-gray-500 mt-2">Cliquez sur "Générer le rapport" pour créer votre rapport personnalisé</p>
        </div>
      )}
    </div>
  )
}