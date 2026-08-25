import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// GET - Récupérer les objectifs du stagiaire
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const objectifs = await prisma.objectif.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(objectifs)
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/objectifs:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des objectifs" },
      { status: 500 }
    )
  }
}

// POST - Créer un objectif
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, target, unit, deadline } = body

    if (!title || !target || !unit || !deadline) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      )
    }

    const objectif = await prisma.objectif.create({
      data: {
        title,
        description: description || "",
        target: parseInt(target),
        unit,
        deadline: new Date(deadline),
        userId: session.user.id,
      },
    })

    return NextResponse.json(objectif, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/stagiaire/objectifs:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'objectif" },
      { status: 500 }
    )
  }
}