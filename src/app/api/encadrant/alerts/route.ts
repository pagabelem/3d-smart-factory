import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les projets de l'encadrant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMembers: {
          include: {
            team: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const projectIds = user.teamMembers.map(tm => tm.team.projectId)

    // Récupérer les alertes des projets de l'encadrant
    const alerts = await prisma.alert.findMany({
      where: {
        resolved: false,
        projectId: { in: projectIds },
      },
      include: {
        project: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Formater les alertes
    const formattedAlerts = alerts.map((alert) => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      severity: alert.type === "INACTIVITE" ? "danger" : alert.type === "DESENGAGEMENT" ? "warning" : "info",
      date: alert.createdAt.toISOString(),
    }))

    return NextResponse.json(formattedAlerts)
  } catch (error) {
    console.error("Erreur GET /api/encadrant/alerts:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des alertes" },
      { status: 500 }
    )
  }
}