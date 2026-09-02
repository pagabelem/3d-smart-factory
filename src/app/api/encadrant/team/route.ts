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
                project: true,
                members: {
                  include: {
                    user: {
                      include: {
                        tasks: {
                          where: { status: "TERMINE" }
                        },
                        _count: {
                          select: {
                            tasks: true,
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Prendre la première équipe (ou la principale)
    const teamMember = user.teamMembers[0]
    if (!teamMember) {
      return NextResponse.json(null)
    }

    const team = teamMember.team

    const formattedMembers = team.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.user.role,
      commits: 0, // À calculer via GitCommit
      tasks: {
        total: member.user._count?.tasks || 0,
        done: member.user.tasks?.length || 0,
      },
      lastActivity: new Date().toISOString(),
    }))

    return NextResponse.json({
      id: team.id,
      name: team.name,
      project: team.project.name,
      members: formattedMembers,
    })
  } catch (error) {
    console.error("Erreur GET /api/encadrant/team:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'équipe" },
      { status: 500 }
    )
  }
}