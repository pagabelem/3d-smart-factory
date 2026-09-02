import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") || "team"

    let stagiairesData = []

    if (filter === "team") {
      // Récupérer les IDs des stagiaires de la même équipe
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

      // Récupérer les IDs des stagiaires
      const stagiaireIds = new Set()
      user.teamMembers.forEach((tm) => {
        tm.team.members.forEach((member) => {
          if (member.user && member.user.role === "STAGIAIRE") {
            stagiaireIds.add(member.user.id)
          }
        })
      })

      // Récupérer les stagiaires avec leurs stats
      stagiairesData = await prisma.user.findMany({
        where: {
          id: { in: Array.from(stagiaireIds) },
          role: "STAGIAIRE",
        },
        include: {
          badges: {
            include: { badge: true }
          },
          defis: {
            where: { completed: true }
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
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    } else {
      // Tous les stagiaires
      stagiairesData = await prisma.user.findMany({
        where: { role: "STAGIAIRE" },
        include: {
          badges: {
            include: { badge: true }
          },
          defis: {
            where: { completed: true }
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
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    }

    // Calculer les stats
    const classement = stagiairesData.map((s) => {
      const totalXP = s.badges.reduce((acc, ub) => acc + ub.badge.xpReward, 0)
      const badgesCount = s.badges.length
      const defisReussis = s.defis.length
      
      let commitsCount = 0
      s.teamMembers.forEach((tm) => {
        tm.team.project.gitRepos.forEach((repo) => {
          commitsCount += repo.commits.filter(c => c.authorEmail === s.email).length
        })
      })

      return {
        id: s.id,
        name: s.name,
        totalXP,
        badgesCount,
        defisReussis,
        commitsCount,
      }
    })

    // Trier par XP décroissant
    classement.sort((a, b) => b.totalXP - a.totalXP)

    // Ajouter le rang
    const classementAvecRang = classement.map((s, index) => ({
      ...s,
      rank: index + 1,
    }))

    return NextResponse.json(classementAvecRang)
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/podium:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du classement" },
      { status: 500 }
    )
  }
}