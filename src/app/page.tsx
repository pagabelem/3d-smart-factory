import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            3D Smart Factory
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Plateforme de suivi intelligent des stagiaires
          </p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Connexion
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}