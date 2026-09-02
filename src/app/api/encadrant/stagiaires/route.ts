import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les stagiaires de l'encadrant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMembers: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
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

    // Récupérer tous les stagiaires uniques
    const stagiairesMap = new Map()
    user.teamMembers.forEach((tm) => {
      tm.team.members.forEach((member) => {
        if (member.user && member.user.role === "STAGIAIRE" && !stagiairesMap.has(member.user.id)) {
          stagiairesMap.set(member.user.id, {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
          })
        }
      })
    })

    const stagiaires = Array.from(stagiairesMap.values())

    return NextResponse.json(stagiaires)
  } catch (error) {
    console.error("Erreur GET /api/encadrant/stagiaires:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stagiaires" },
      { status: 500 }
    )
  }
}