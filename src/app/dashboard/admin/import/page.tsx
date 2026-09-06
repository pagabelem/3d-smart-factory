"use client"

import { useState } from "react"

interface ImportResult {
  total: number
  succes: number
  erreurs: number
  details: {
    line: number
    email: string
    status: string
    error?: string
  }[]
}

export default function AdminImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setResult(null)
    setError("")
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResult(null)

    if (!selectedFile) {
      setError("Merci de choisir un fichier CSV")
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'import")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setImporting(false)
    }
  }
  
  const downloadTemplate = () => {
    const header = "nom,prenom,email,motDePasse,projet,equipe,encadrant,dateDebut,dateFin,numeroCarteSejour"
    const example = "Dupont,Marie,marie.dupont@example.com,motdepasse123,Plateforme IoT Usine 4.0,Equipe Capteurs,Jean Martin,2026-09-01,2026-12-01,AB123456"
    const content = header + "\n" + example
    const blob = new Blob([content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "modele_import_stagiaires.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import CSV des stagiaires</h1>
        <p className="text-gray-600 mt-1">
          Creez plusieurs comptes stagiaires, equipes et projets en une seule fois
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 mb-2">
          Le fichier CSV doit contenir exactement ces colonnes, dans cet ordre :
        </p>
        <code className="text-xs bg-white px-2 py-1 rounded block overflow-x-auto">
          nom,prenom,email,motDePasse,projet,equipe,encadrant,dateDebut,dateFin,numeroCarteSejour
        </code>
        <button
          onClick={downloadTemplate}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Telecharger un modele CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleImport} className="space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={importing}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {importing ? "Import en cours..." : "Importer le fichier"}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Resultat de l'import</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-800">{result.total}</p>
              <p className="text-sm text-gray-500">Lignes traitees</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{result.succes}</p>
              <p className="text-sm text-green-600">Comptes crees</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{result.erreurs}</p>
              <p className="text-sm text-red-600">Erreurs</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {result.details.map((d, i) => (
              <div
                key={i}
                className={`flex justify-between items-center p-3 rounded-lg text-sm ${
                  d.status === "succes"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <span>
                  Ligne {d.line} - {d.email}
                </span>
                <span className="font-medium">
                  {d.status === "succes" ? "Cree" : d.error}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}