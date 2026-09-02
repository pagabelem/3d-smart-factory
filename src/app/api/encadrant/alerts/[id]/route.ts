import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

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
    const body = await req.json()
    const { resolved } = body

    // Vérifier que l'alerte existe et appartient à un projet de l'encadrant
    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            teams: {
              include: {
                members: {
                  where: { userId: session.user.id }
                }
              }
            }
          }
        }
      }
    })

    if (!alert) {
      return NextResponse.json(
        { error: "Alerte non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'encadrant a accès à ce projet
    const hasAccess = alert.project.teams.some(team => 
      team.members.some(member => member.userId === session.user.id)
    )

    if (!hasAccess && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      )
    }

    // Mettre à jour l'alerte
    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { resolved },
    })

    return NextResponse.json({
      id: updatedAlert.id,
      resolved: updatedAlert.resolved,
      message: "Alerte mise à jour avec succès",
    })
  } catch (error) {
    console.error("Erreur PATCH /api/encadrant/alerts/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la résolution de l'alerte" },
      { status: 500 }
    )
  }
}