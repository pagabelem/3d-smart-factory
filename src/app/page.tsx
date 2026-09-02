import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/hero-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="3D Smart Factory"
              width={120}
              height={120}
              className="bg-white rounded-xl p-3"
            />
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            3D Smart Factory
          </h1>
          <p className="text-xl text-gray-200 mb-8">
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
              href="/register"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              Inscription-Stagiaire
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}