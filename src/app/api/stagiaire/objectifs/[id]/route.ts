import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// PATCH - Marquer un objectif comme complété
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const objectif = await prisma.objectif.findUnique({
      where: { id, userId: session.user.id },
    })

    if (!objectif) {
      return NextResponse.json(
        { error: "Objectif non trouvé" },
        { status: 404 }
      )
    }

    const updated = await prisma.objectif.update({
      where: { id },
      data: { completed: !objectif.completed },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Erreur PATCH /api/stagiaire/objectifs/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un objectif
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    await prisma.objectif.deleteMany({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ message: "Objectif supprimé" })
  } catch (error) {
    console.error("Erreur DELETE /api/stagiaire/objectifs/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}