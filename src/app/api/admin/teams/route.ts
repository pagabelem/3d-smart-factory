import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// GET - Récupérer toutes les équipes
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const teams = await prisma.team.findMany({
      include: {
        project: {
          select: { id: true, name: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' } // ← CHANGEMENT ICI : created_at → createdAt
    })

    // Formater les données
    const formattedTeams = teams.map((team) => {
      const encadrant = team.members.find(m => m.user.role === "ENCADRANT")
      const stagiaires = team.members.filter(m => m.user.role === "STAGIAIRE")
      
      return {
        id: team.id,
        name: team.name,
        projectId: team.project.id,
        projectName: team.project.name,
        encadrantId: encadrant?.user.id || null,
        encadrantName: encadrant?.user.name || null,
        membersCount: stagiaires.length,
      }
    })

    return NextResponse.json(formattedTeams)
  } catch (error) {
    console.error("Erreur GET /api/admin/teams:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des équipes" },
      { status: 500 }
    )
  }
}

// POST - Créer une équipe
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { name, projectId, encadrantId, stagiaireIds } = body

    if (!name || !projectId || !encadrantId) {
      return NextResponse.json(
        { error: "Nom, projet et encadrant sont requis" },
        { status: 400 }
      )
    }

    // Vérifier que l'encadrant existe
    const encadrant = await prisma.user.findUnique({
      where: { id: encadrantId, role: "ENCADRANT" }
    })
    if (!encadrant) {
      return NextResponse.json(
        { error: "Encadrant non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que le projet existe
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })
    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    // Créer l'équipe
    const team = await prisma.team.create({
      data: {
        name,
        projectId,
      },
    })

    // Ajouter l'encadrant
    await prisma.teamMember.create({
      data: {
        userId: encadrantId,
        teamId: team.id,
      },
    })

    // Ajouter les stagiaires
    if (stagiaireIds && stagiaireIds.length > 0) {
      for (const stagiaireId of stagiaireIds) {
        await prisma.teamMember.create({
          data: {
            userId: stagiaireId,
            teamId: team.id,
          },
        })
      }
    }

    return NextResponse.json({
      message: "Équipe créée avec succès",
      team: {
        id: team.id,
        name: team.name,
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/admin/teams:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'équipe" },
      { status: 500 }
    )
  }
}