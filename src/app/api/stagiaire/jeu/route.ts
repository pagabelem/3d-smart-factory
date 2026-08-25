import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// GET - Récupérer les stats du mode jeu
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const stagiaire = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        badges: {
          include: { badge: true }
        },
        defis: {
          include: { defi: true }
        },
        tasks: true,
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!stagiaire) {
      return NextResponse.json({ error: "Stagiaire non trouvé" }, { status: 404 })
    }

    // Calculer les stats
    const totalXP = stagiaire.badges.reduce((acc, ub) => acc + ub.badge.xpReward, 0)
    const badgesCount = stagiaire.badges.length
    const defisReussis = stagiaire.defis.filter(d => d.completed).length
    const tasksDone = stagiaire.tasks.filter(t => t.status === "TERMINE").length
    const tasksTotal = stagiaire._count.tasks
    const level = Math.floor(totalXP / 100) + 1
    const xpNextLevel = level * 100
    const xp = totalXP % 100
    const xpProgress = Math.round((xp / 100) * 100)
    const streak = Math.floor(Math.random() * 10) + 1 // Simulé

    // Achievements (simulés)
    const achievements = [
      { id: "1", name: "Premier commit", icon: "🎉", unlocked: true },
      { id: "2", name: "10 commits", icon: "🔥", unlocked: totalXP > 50 },
      { id: "3", name: "Ninja du code", icon: "🥷", unlocked: totalXP > 200 },
      { id: "4", name: "Documentation d'or", icon: "📖", unlocked: false },
      { id: "5", name: "Esprit d'équipe", icon: "🤝", unlocked: false },
      { id: "6", name: "Rapide", icon: "⚡", unlocked: tasksDone > 5 },
    ]

    // Défis quotidiens (simulés)
    const dailyChallenges = [
      { id: "1", title: "3 commits aujourd'hui", description: "Faites 3 commits dans la journée", xpReward: 30, completed: false },
      { id: "2", title: "Terminer une tâche", description: "Terminez une tâche avant 18h", xpReward: 20, completed: false },
      { id: "3", title: "Relecture de code", description: "Relisez le code d'un collègue", xpReward: 40, completed: false },
    ]

    return NextResponse.json({
      level,
      xp,
      xpNextLevel,
      xpProgress,
      totalXP,
      badgesCount,
      defisReussis,
      streak,
      tasksDone,
      tasksTotal,
      achievements,
      dailyChallenges,
    })
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/jeu:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    )
  }
}

// POST - Relever un défi
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId } = body

    // Simuler la validation du défi
    // Dans la vraie vie, on vérifierait si le stagiaire a vraiment accompli le défi

    return NextResponse.json({
      success: true,
      message: "Défi relevé ! +30 XP",
    })
  } catch (error) {
    console.error("Erreur POST /api/stagiaire/jeu:", error)
    return NextResponse.json(
      { error: "Erreur lors de la validation du défi" },
      { status: 500 }
    )
  }
}