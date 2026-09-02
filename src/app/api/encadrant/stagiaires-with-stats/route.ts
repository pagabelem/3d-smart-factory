import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer l'encadrant avec ses équipes
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teamMembers: {
          include: {
            team: {
              include: {
                project: {
                  include: {
                    tasks: true,
                    gitRepos: {
                      include: {
                        commits: true,
                      },
                    },
                  },
                },
                members: {
                  include: {
                    user: {
                      include: {
                        tasks: {
                          where: { status: "TERMINE" }
                        },
                        _count: {
                          select: { tasks: true }
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

    // Récupérer tous les stagiaires uniques avec leurs stats
    const stagiairesMap = new Map()
    
    user.teamMembers.forEach((tm) => {
      tm.team.members.forEach((member) => {
        // Vérifier que c'est un stagiaire
        if (member.user && member.user.role === "STAGIAIRE" && !stagiairesMap.has(member.user.id)) {
          const stagiaire = member.user
          const project = tm.team.project
          
          // Compter les commits du stagiaire
          const commits = project.gitRepos.reduce((acc, repo) => {
            return acc + repo.commits.filter(c => c.authorEmail === stagiaire.email).length
          }, 0)
          
          const tasksTotal = stagiaire._count?.tasks || 0
          const tasksDone = stagiaire.tasks?.length || 0
          const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
          
          stagiairesMap.set(stagiaire.id, {
            id: stagiaire.id,
            name: stagiaire.name,
            email: stagiaire.email,
            commits,
            tasksDone,
            tasksTotal,
            progress,
          })
        }
      })
    })

    const stagiaires = Array.from(stagiairesMap.values())

    return NextResponse.json(stagiaires)
  } catch (error) {
    console.error("Erreur GET /api/encadrant/stagiaires-with-stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stagiaires" },
      { status: 500 }
    )
  }
}