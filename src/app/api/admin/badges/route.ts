import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// GET - Récupérer tous les badges
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const badges = await prisma.badge.findMany({
      include: {
        userBadges: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(badges)
  } catch (error) {
    console.error("Erreur GET /api/admin/badges:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des badges" },
      { status: 500 }
    )
  }
}

// POST - Créer un badge
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, icon, xpReward } = body

    if (!name || !description || !icon || !xpReward) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        icon,
        xpReward: parseInt(xpReward),
      },
    })

    return NextResponse.json(badge, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/admin/badges:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du badge" },
      { status: 500 }
    )
  }
}