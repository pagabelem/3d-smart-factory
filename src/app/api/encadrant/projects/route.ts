import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer l'utilisateur avec ses équipes
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMembers: {
          include: {
            team: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                  }
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Récupérer les projets uniques
    const projectsMap = new Map()
    user.teamMembers.forEach((tm) => {
      const project = tm.team.project
      if (project && !projectsMap.has(project.id)) {
        projectsMap.set(project.id, {
          id: project.id,
          name: project.name,
        })
      }
    })

    const projects = Array.from(projectsMap.values())

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Erreur GET /api/encadrant/projets:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    )
  }
}