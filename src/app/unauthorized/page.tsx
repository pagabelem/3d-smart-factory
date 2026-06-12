/* eslint-disable react/no-unescaped-entities */
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Accès non autorisé
        </h1>
        <p className="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}