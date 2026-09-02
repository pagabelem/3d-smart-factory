import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const stagiaire = await prisma.user.findUnique({
      where: { id: session.user.id, role: "STAGIAIRE" },
      include: {
        badges: {
          include: { badge: true }
        },
        defis: {
          where: { completed: true }
        },
        tasks: true,
        _count: {
          select: { tasks: true }
        },
        teamMembers: {
          include: {
            team: {
              include: {
                project: {
                  include: {
                    gitRepos: {
                      include: {
                        commits: {
                          where: { authorEmail: session.user.email || "" }
                        }
                      }
                    },
                    tasks: true,
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

    // Calculer les stats
    const totalXP = stagiaire.badges.reduce((acc, ub) => acc + ub.badge.xpReward, 0)
    const badgesCount = stagiaire.badges.length
    const defisReussis = stagiaire.defis.length
    const tasksDone = stagiaire.tasks.length
    const tasksTotal = stagiaire._count.tasks

    // Calculer les commits
    let commitsCount = 0
    const projets = stagiaire.teamMembers.map((tm) => {
      const project = tm.team.project
      const projectCommits = project.gitRepos.reduce((acc, repo) => 
        acc + repo.commits.length, 0
      )
      commitsCount += projectCommits
      
      const projectTasksTotal = project.tasks.length
      const projectTasksDone = project.tasks.filter(t => t.status === "TERMINE").length
      const progress = projectTasksTotal > 0 ? Math.round((projectTasksDone / projectTasksTotal) * 100) : 0
      
      return {
        id: project.id,
        name: project.name,
        progress,
      }
    })

    // Niveau (1 niveau tous les 100 XP)
    const niveau = Math.floor(totalXP / 100) + 1
    const prochainNiveau = niveau * 100

    // Activité récente (simulée pour l'instant)
    const activiteRecente = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      activiteRecente.push({
        date: date.toISOString().split('T')[0],
        commits: Math.floor(Math.random() * 5),
        tasks: Math.floor(Math.random() * 3),
      })
    }

    return NextResponse.json({
      totalXP,
      niveau,
      prochainNiveau,
      badgesCount,
      defisReussis,
      commitsCount,
      tasksDone,
      tasksTotal,
      progression: tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0,
      projets,
      activiteRecente,
    })
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/stats:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    )
  }
}