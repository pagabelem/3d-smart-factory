import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    // Vérifier que l'équipe existe
    const team = await prisma.team.findUnique({
      where: { id }
    })

    if (!team) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      )
    }

    // Supprimer d'abord les membres
    await prisma.teamMember.deleteMany({
      where: { teamId: id }
    })

    // Puis supprimer l'équipe
    await prisma.team.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Équipe supprimée avec succès" })
  } catch (error) {
    console.error("Erreur DELETE /api/admin/teams/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'équipe" },
      { status: 500 }
    )
  }
}