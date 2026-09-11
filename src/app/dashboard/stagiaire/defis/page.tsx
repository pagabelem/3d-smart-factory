"use client"

import { useEffect, useState } from "react"

interface Defi {
  id: string
  title: string
  description: string
  xpReward: number
  startDate: string
  endDate: string
  completed: boolean
}

export default function StagiaireDefisPage() {
  const [defis, setDefis] = useState<Defi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [completingId, setCompletingId] = useState<string | null>(null)

  useEffect(() => {
    loadDefis()
  }, [])

  const loadDefis = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stagiaire/defis")
      if (!res.ok) throw new Error("Erreur chargement des defis")
      const data = await res.json()
      setDefis(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  const completeDefi = async (id: string) => {
    setCompletingId(id)
    setError("")
    try {
      const res = await fetch(`/api/stagiaire/defis/${id}`, {
        method: "POST",
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la validation")
      }
      await loadDefis()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setCompletingId(null)
    }
  }

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement des defis...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Defis</h1>
        <p className="text-gray-500 mt-1">
          Relevez des defis pour gagner de l'experience
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defis.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl shadow-md border border-gray-100">
            <p className="text-gray-500">Aucun defi actif pour le moment</p>
          </div>
        ) : (
          defis.map((defi) => {
            const expired = isExpired(defi.endDate)
            return (
              <div
                key={defi.id}
                className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {defi.title}
                  </h3>
                  <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    {defi.xpReward} XP
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{defi.description}</p>
                <p className="text-xs text-gray-400 mb-4">
                  Du {new Date(defi.startDate).toLocaleDateString()} au{" "}
                  {new Date(defi.endDate).toLocaleDateString()}
                </p>

                {defi.completed ? (
                  <div className="bg-green-50 text-green-700 text-sm font-medium py-2 px-4 rounded-xl text-center">
                    Defi termine
                  </div>
                ) : expired ? (
                  <div className="bg-gray-100 text-gray-500 text-sm font-medium py-2 px-4 rounded-xl text-center">
                    Defi expire
                  </div>
                ) : (
                  <button
                    onClick={() => completeDefi(defi.id)}
                    disabled={completingId === defi.id}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-xl hover:shadow-lg transition disabled:opacity-50"
                  >
                    {completingId === defi.id ? "Validation..." : "Marquer comme termine"}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}