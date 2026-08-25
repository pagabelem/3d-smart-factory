import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const defis = await prisma.defi.findMany({
      include: {
        participations: true,
      },
      orderBy: { startDate: 'desc' } // ← Utiliser startDate au lieu de createdAt
    })

    return NextResponse.json(defis)
  } catch (error) {
    console.error("Erreur GET /api/admin/defis:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des défis" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, xpReward, startDate, endDate } = body

    if (!title || !description || !xpReward || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    const defi = await prisma.defi.create({
      data: {
        title,
        description,
        xpReward: parseInt(xpReward),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
    })

    return NextResponse.json(defi, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/admin/defis:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du défi" },
      { status: 500 }
    )
  }
}