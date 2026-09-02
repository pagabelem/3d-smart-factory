import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import type { Role } from "@prisma/client"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") || "all"
  const roleFilter = filter !== "all" ? (filter.toUpperCase() as Role) : undefined

  const whereClause = roleFilter ? { role: roleFilter } : {}

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      badges: {
        include: {
          badge: true
        }
      },
      defis: {
        where: { completed: true }
      },
      scores: true,
      tasks: {
        where: { status: "TERMINE" }
      }
    },
    orderBy: {
      // Par défaut, tri par score total
    }
  })

  // Calculer les statistiques pour chaque utilisateur
  const leaderboard = users.map((user) => {
    const totalXP = user.badges.reduce((sum, ub) => sum + ub.badge.xpReward, 0)
    const defisReussis = user.defis.length
    const badgesCount = user.badges.length
    const commitsCount = 0 // À calculer via GitCommit

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      totalXP,
      badgesCount,
      defisReussis,
      commitsCount,
    }
  })

  // Trier par XP décroissant
  leaderboard.sort((a, b) => b.totalXP - a.totalXP)

  return NextResponse.json(leaderboard)
}