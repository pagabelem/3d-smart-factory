import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un stagiaire
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, email: true }
    })

    if (!user || user.role !== "STAGIAIRE") {
      return NextResponse.json({ error: "Accès réservé aux stagiaires" }, { status: 403 })
    }

    // Récupérer le stagiaire avec ses équipes et projets
    const stagiaire = await prisma.user.findUnique({
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
                    owner: {
                      select: { name: true }
                    },
                    teams: {
                      include: {
                        members: {
                          include: {
                            user: {
                              select: { id: true, name: true, role: true }
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
      }
    })

    if (!stagiaire) {
      return NextResponse.json({ error: "Stagiaire non trouvé" }, { status: 404 })
    }

    // Récupérer les projets uniques
    const projetsMap = new Map()
    
    stagiaire.teamMembers.forEach((tm) => {
      const project = tm.team.project
      if (!projetsMap.has(project.id)) {
        const tasks = project.tasks || []
        const tasksDone = tasks.filter(t => t.status === "TERMINE").length
        const tasksTotal = tasks.length
        const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
        
        // Compter les commits du stagiaire
        const commits = project.gitRepos.reduce((acc, repo) => 
          acc + repo.commits.filter(c => c.authorEmail === stagiaire.email).length, 0
        )
        
        // Trouver l'encadrant
        let encadrant = "Non assigné"
        project.teams.forEach((team) => {
          team.members.forEach((member) => {
            if (member.user && member.user.role === "ENCADRANT") {
              encadrant = member.user.name
            }
          })
        })

        projetsMap.set(project.id, {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          progress,
          tasksDone,
          tasksTotal,
          commits,
          lastActivity: new Date().toISOString(),
          encadrant,
        })
      }
    })

    const projets = Array.from(projetsMap.values())

    return NextResponse.json(projets)
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/projets:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    )
  }
}