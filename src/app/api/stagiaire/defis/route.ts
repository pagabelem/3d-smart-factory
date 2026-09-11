import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const defis = await prisma.defi.findMany({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      include: {
        participations: {
          where: { userId: session.user.id },
        },
      },
    })

    const result = defis.map((defi) => ({
      id: defi.id,
      title: defi.title,
      description: defi.description,
      xpReward: defi.xpReward,
      startDate: defi.startDate,
      endDate: defi.endDate,
      completed: defi.participations.length > 0 ? defi.participations[0].completed : false,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/defis:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des defis" },
      { status: 500 }
    )
  }
}