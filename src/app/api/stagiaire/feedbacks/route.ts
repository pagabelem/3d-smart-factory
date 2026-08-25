import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const feedbacks = await prisma.feedback.findMany({
      where: {
        stagiaireId: session.user.id,
      },
      include: {
        encadrant: {
          select: { id: true, name: true }
        },
        projet: {
          select: { id: true, name: true }
        }
      },
      orderBy: { generatedAt: 'desc' },
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/feedbacks:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des feedbacks" },
      { status: 500 }
    )
  }
}