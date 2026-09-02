import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userBadges = await prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    })

    const badges = userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      xpReward: ub.badge.xpReward,
      earnedAt: ub.earnedAt.toISOString(),
    }))

    return NextResponse.json(badges)
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/badges:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des badges" },
      { status: 500 }
    )
  }
}