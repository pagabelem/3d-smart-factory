"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  const role = session?.user?.role
  const name = session?.user?.name
  const email = session?.user?.email

  const getRoleColor = () => {
    switch (role) {
      case "ADMIN": return "from-indigo-600 to-blue-600"
      case "ENCADRANT": return "from-emerald-600 to-teal-600"
      case "STAGIAIRE": return "from-amber-500 to-orange-600"
      default: return "from-gray-600 to-gray-700"
    }
  }

  const getRoleIcon = () => {
    switch (role) {
      case "ADMIN": return "👑"
      case "ENCADRANT": return "👨‍🏫"
      case "STAGIAIRE": return "🎓"
      default: return "👤"
    }
  }

  const getRoleLabel = () => {
    switch (role) {
      case "ADMIN": return "Administrateur"
      case "ENCADRANT": return "Encadrant"
      case "STAGIAIRE": return "Stagiaire"
      default: return role
    }
  }

  const getNavLinks = () => {
    switch (role) {
      case "ADMIN":
  return [
    { href: "/dashboard/admin", label: "Tableau de bord", icon: "📊" },
    { href: "/dashboard/admin/leaderboard", label: "Classement", icon: "🏆", badge: "🔥" },
    { href: "/dashboard/admin/defis", label: "Défis", icon: "🎯", badge: "Nouveau" },
    { href: "/dashboard/admin/projets", label: "Projets", icon: "📁" },
    { href: "/dashboard/admin/equipes", label: "Équipes", icon: "👥", badge: "Nouveau" }, // ← AJOUTER
    { href: "/dashboard/admin/stagiaires", label: "Stagiaires", icon: "👥" },
    { href: "/dashboard/admin/encadrants", label: "Encadrants", icon: "👨‍🏫" },
    { href: "/dashboard/admin/rapports", label: "Rapports IA", icon: "📄", badge: "AI" },
    { href: "/dashboard/admin/recompenses", label: "Récompenses", icon: "🎁" },
    { href: "/dashboard/admin/heatmap", label: "Heatmap", icon: "🔥" },
  ]
      case "ENCADRANT":
        return [
          { href: "/dashboard/encadrant", label: "Mes projets", icon: "📊" },
          { href: "/dashboard/encadrant/equipe", label: "Mon équipe", icon: "👥" },
          { href: "/dashboard/encadrant/evaluations", label: "Évaluations", icon: "📝" },
          { href: "/dashboard/encadrant/feedbacks", label: "Feedbacks IA", icon: "🤖", badge: "AI" },
    { href: "/dashboard/encadrant/alertes", label: "Alertes", icon: "🔔", badge: "Nouveau" }, // ← CHANGEMENT ICI
        ]
      case "STAGIAIRE":
        return [
          { href: "/dashboard/stagiaire", label: "Mon tableau", icon: "📊" },
          { href: "/dashboard/stagiaire/jeu", label: "Mode Jeu", icon: "🎮", badge: "XP" },
          { href: "/dashboard/stagiaire/defis", label: "Défis", icon: "⚔️", badge: "Compet" },
          { href: "/dashboard/stagiaire/podium", label: "Podium", icon: "🏆", badge: "Live" },
          { href: "/dashboard/stagiaire/badges", label: "Mes badges", icon: "🏅" },
          { href: "/dashboard/stagiaire/projets", label: "Mes projets", icon: "📁" },
          { href: "/dashboard/stagiaire/assistant", label: "Assistant IA", icon: "🤖" },
          { href: "/dashboard/stagiaire/rapport", label: "Mon rapport", icon: "📄" },
          { href: "/dashboard/stagiaire/objectifs", label: "Objectifs", icon: "🎯" },
        ]
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`
        ${isCollapsed ? 'w-20' : 'w-72'} 
        bg-white shadow-2xl min-h-screen flex flex-col sticky top-0 transition-all duration-300 ease-in-out border-r border-gray-100
      `}>
        {/* Header Sidebar */}
        <div className={`bg-gradient-to-r ${getRoleColor()} p-5 text-white relative overflow-hidden`}>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-white/5 rounded-full"></div>
          
          <div className="relative flex items-center gap-3">
            <span className="text-3xl">{getRoleIcon()}</span>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold tracking-tight">3D Smart Factory</h2>
                <p className="text-xs opacity-80">{getRoleLabel()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {getNavLinks().map((link) => {
              const isActive = typeof window !== 'undefined' && window.location.pathname === link.href
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-md` 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? link.label : ''}
                >
                  <span className="text-xl flex-shrink-0">{link.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="font-medium flex-1 text-sm">{link.label}</span>
                      {link.badge && (
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full font-semibold
                          ${isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-red-100 text-red-600'
                          }
                        `}>
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && link.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-100">
          <div className={`
            flex items-center gap-3 p-3 rounded-xl bg-gray-50 transition-all
            ${isCollapsed ? 'justify-center' : ''}
          `}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            )}
          </div>
          
          {/* Bouton toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-3 w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition text-center text-sm"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {name}
              </h1>
              <p className="text-sm text-gray-500">
                {role === "ADMIN" ? "Gestion complète de la plateforme" : 
                 role === "ENCADRANT" ? "Suivi de votre équipe" : 
                 "Votre espace personnel"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* XP pour stagiaire */}
              {role === "STAGIAIRE" && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 rounded-full border border-yellow-200 shadow-sm">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold text-yellow-700">1,250 XP</span>
                  <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Niv. 3</span>
                </div>
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
              >
                <span>🚪</span>
                <span className="hidden sm:inline font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}