"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  const role = session?.user?.role
  const name = session?.user?.name

  // Navigation selon le rôle (version COMPÉTITION)
  const getNavLinks = () => {
    switch (role) {
      case "ADMIN":
        return [
          { href: "/dashboard/admin", label: "📊 Vue Globale" },
          { href: "/dashboard/admin/leaderboard", label: "🏆 Classement Général", badge: "🔥" },
          { href: "/dashboard/admin/defis", label: "🎯 Défis Hebdomadaires", badge: "Nouveau" },
          { href: "/dashboard/admin/projets", label: "📁 Tous les projets" },
          { href: "/dashboard/admin/stagiaires", label: "👥 Stagiaires" },
          { href: "/dashboard/admin/encadrants", label: "👨‍🏫 Encadrants" },
          { href: "/dashboard/admin/rapports", label: "📄 Rapports IA" },
          { href: "/dashboard/admin/recompenses", label: "🎁 Récompenses", badge: "AI" },
          { href: "/dashboard/admin/heatmap", label: "🔥 Heatmap Activité", badge: "New" },
        ]
      case "ENCADRANT":
        return [
          { href: "/dashboard/encadrant", label: "📊 Mes projets" },
          { href: "/dashboard/encadrant/equipe", label: "👥 Mon équipe" },
          { href: "/dashboard/encadrant/evaluations", label: "📝 Évaluations" },
          { href: "/dashboard/encadrant/feedbacks", label: "🏅 Feedbacks IA", badge: "AI" },
          { href: "/dashboard/encadrant/alertes", label: "⚠️ Alertes Sous-performance", badge: "New" },
          { href: "/dashboard/encadrant/matchmaking", label: "🤝 Matchmaking équipe", badge: "Beta" },
        ]
      case "STAGIAIRE":
        return [
          { href: "/dashboard/stagiaire", label: "📊 Mon tableau" },
          { href: "/dashboard/stagiaire/jeu", label: "🎮 Mode Jeu", badge: "XP" },
          { href: "/dashboard/stagiaire/defis", label: "⚔️ Défis entre pairs", badge: "Compet" },
          { href: "/dashboard/stagiaire/podium", label: "🏆 Podium", badge: "Live" },
          { href: "/dashboard/stagiaire/badges", label: "🏅 Mes badges", badge: "Collection" },
          { href: "/dashboard/stagiaire/projets", label: "📁 Mes projets" },
          { href: "/dashboard/stagiaire/assistant", label: "🤖 Assistant IA" },
          { href: "/dashboard/stagiaire/rapport", label: "📄 Mon rapport" },
          { href: "/dashboard/stagiaire/objectifs", label: "🎯 Objectifs perso", badge: "New" },
        ]
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header avec stats compétition */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/dashboard/${role?.toLowerCase()}`} className="text-xl font-bold text-blue-600">
              3D Smart Factory 🏭
            </Link>
            <div className="flex items-center gap-6">
              {/* Affichage des points XP si stagiaire */}
              {role === "STAGIAIRE" && (
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                  <span className="text-yellow-600">⭐</span>
                  <span className="font-semibold text-yellow-700">1,250 XP</span>
                  <span className="text-xs text-yellow-500">Niveau 3</span>
                </div>
              )}
              <span className="text-gray-600">
                👤 {name} ({role})
              </span>
              <button
                onClick={() => signOut()}
                className="text-red-600 hover:text-red-800"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation + Contenu */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {getNavLinks().map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition"
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}