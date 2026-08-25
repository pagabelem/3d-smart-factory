import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const rapport = await prisma.rapport.findFirst({
      where: {
        createdBy: session.user.id,
        type: "personnalise",
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!rapport) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      id: rapport.id,
      titre: rapport.titre,
      contenu: rapport.contenu,
      date: rapport.date.toISOString(),
      statut: rapport.statut,
    })
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/rapport:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du rapport" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les données du stagiaire
    const stagiaire = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { tasks: true }
        },
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
                          where: { authorEmail: session.user.email || "" },
                          orderBy: { commitDate: 'desc' },
                          take: 10,
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

    // Compiler les données
    const tasksDone = stagiaire.tasks.length
    const tasksTotal = stagiaire._count.tasks
    const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
    const badgesCount = stagiaire.badges.length
    const totalXP = stagiaire.badges.reduce((acc, ub) => acc + ub.badge.xpReward, 0)
    const defisReussis = stagiaire.defis.length

    let commitsCount = 0
    let commitsList = []
    const projetsList = []

    stagiaire.teamMembers.forEach((tm) => {
      const project = tm.team.project
      projetsList.push(project.name)
      
      project.gitRepos.forEach((repo) => {
        const repoCommits = repo.commits.filter(c => c.authorEmail === stagiaire.email)
        commitsCount += repoCommits.length
        commitsList = commitsList.concat(repoCommits.map(c => `- ${c.message} (${new Date(c.commitDate).toLocaleDateString()})`))
      })
    })

    const projets = projetsList.join(", ") || "Aucun projet"
    const commitsDisplay = commitsList.slice(0, 5).join("\n") || "Aucun commit"

    const prompt = `
Génère un rapport de stage personnalisé pour un stagiaire.

## Données du stagiaire :
- Nom : ${stagiaire.name}
- Projets : ${projets}
- Progression globale : ${progress}%
- Tâches terminées : ${tasksDone}/${tasksTotal}
- Commits : ${commitsCount}
- Badges : ${badgesCount}
- XP total : ${totalXP}
- Défis réussis : ${defisReussis}

## Dernières activités :
${commitsDisplay}

## Tâches récentes :
${stagiaire.tasks.map(t => `- ${t.title} (${t.status})`).join("\n") || "Aucune tâche"}

## Instructions :
Génère un rapport de stage structuré avec :
1. 📋 Introduction
2. 📊 Bilan des activités
3. 📈 Compétences acquises
4. 🎯 Objectifs atteints
5. 💪 Points forts et axes d'amélioration
6. 🚀 Perspectives
7. 📝 Conclusion
`

    let contenu = ""

    if (!process.env.OPENAI_API_KEY) {
      contenu = `
# 📋 Rapport de Stage - ${stagiaire.name}

## 📊 Bilan des activités
Au cours de cette période, vous avez travaillé sur ${projets}. Vous avez terminé ${tasksDone} tâches sur ${tasksTotal}, soit une progression de ${progress}%.

## 📈 Compétences acquises
- Développement sur ${projets}
- Gestion de projet
- Collaboration en équipe

## 🎯 Objectifs atteints
- Progression de ${progress}%
- ${badgesCount} badges gagnés
- ${defisReussis} défis réussis

## 💪 Points forts et axes d'amélioration
**Points forts :** Autonomie, régularité
**Axes d'amélioration :** Documentation, communication

## 🚀 Perspectives
Continuer à progresser sur les projets assignés.

## 📝 Conclusion
Bon travail, continuez comme ça !
      `
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un rédacteur de rapports de stage professionnel." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600,
      })

      contenu = completion.choices[0]?.message?.content || "Erreur lors de la génération du rapport"
    }

    const rapport = await prisma.rapport.create({
      data: {
        titre: `Rapport de stage - ${stagiaire.name}`,
        type: "personnalise",
        contenu: contenu,
        statut: "genere",
        date: new Date(),
        createdBy: stagiaire.id,
        projetId: null,
      },
    })

    return NextResponse.json({
      id: rapport.id,
      titre: rapport.titre,
      contenu: rapport.contenu,
      date: rapport.date.toISOString(),
      statut: rapport.statut,
    })
  } catch (error) {
    console.error("Erreur POST /api/stagiaire/rapport:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la génération du rapport" },
      { status: 500 }
    )
  }
}