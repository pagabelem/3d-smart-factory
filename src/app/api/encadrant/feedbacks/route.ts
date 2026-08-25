import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { stagiaireId } = body

    if (!stagiaireId) {
      return NextResponse.json(
        { error: "ID du stagiaire requis" },
        { status: 400 }
      )
    }

    // Récupérer les données du stagiaire
    const stagiaire = await prisma.user.findUnique({
      where: { id: stagiaireId, role: "STAGIAIRE" },
      include: {
        tasks: {
          where: { status: "TERMINE" }
        },
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
                        commits: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!stagiaire) {
      return NextResponse.json(
        { error: "Stagiaire non trouvé" },
        { status: 404 }
      )
    }

    // Récupérer les commits du stagiaire
    const commits = stagiaire.teamMembers.flatMap(tm => 
      tm.team.project.gitRepos.flatMap(repo => 
        repo.commits.filter(c => c.authorEmail === stagiaire.email)
      )
    )

    const commitMessages = commits.slice(0, 10).map(c => `- ${c.message}`).join('\n')
    const tasksDone = stagiaire.tasks.length
    const tasksTotal = stagiaire._count.tasks
    const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0

    // Générer le feedback (OpenAI ou mock)
    let contenu = ""
    
    if (!process.env.OPENAI_API_KEY) {
      contenu = `
🎯 **Points forts**
Tu as terminé ${tasksDone} tâches sur ${tasksTotal} ! C'est un bon début.

📈 **Axes d'amélioration**
Continue à travailler sur la régularité des commits.

💪 **Conseils**
- Essaie de faire au moins un commit par jour
- N'hésite pas à demander de l'aide
- Continue comme ça ! 💪
      `
    } else {
      const prompt = `
Tu es un encadrant bienveillant. Donne un feedback personnalisé à un stagiaire.

## Données du stagiaire :
- Nom : ${stagiaire.name}
- Tâches terminées : ${tasksDone}/${tasksTotal}
- Progression globale : ${progress}%
- Derniers commits :
${commitMessages || 'Aucun commit récent'}

## Instructions :
1. Sois encourageant et constructif
2. Mentionne ses points forts
3. Donne 2-3 conseils pour s'améliorer
4. Félicite-le pour ses efforts
5. Sois concis (100-150 mots)
6. Structure en 3 parties : 🎯 Points forts, 📈 Axes d'amélioration, 💪 Conseils
`

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un encadrant bienveillant et encourageant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400,
      })

      contenu = completion.choices[0]?.message?.content || "Erreur lors de la génération"
    }

    // ✅ SAUVEGARDER EN BASE
    const feedback = await prisma.feedback.create({
      data: {
        contenu,
        stagiaireId: stagiaire.id,
        encadrantId: session.user.id,
        projetId: stagiaire.teamMembers[0]?.team?.projectId || null,
      },
    })

    return NextResponse.json({
      id: feedback.id,
      stagiaireId: stagiaire.id,
      stagiaireName: stagiaire.name,
      contenu: feedback.contenu,
      generatedAt: feedback.generatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Erreur POST /api/encadrant/feedbacks:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la génération du feedback" },
      { status: 500 }
    )
  }
}

// GET - Récupérer les feedbacks d'un stagiaire
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const stagiaireId = searchParams.get("stagiaireId")

    if (!stagiaireId) {
      return NextResponse.json(
        { error: "ID du stagiaire requis" },
        { status: 400 }
      )
    }

    const feedbacks = await prisma.feedback.findMany({
      where: {
        stagiaireId,
      },
      include: {
        encadrant: {
          select: { id: true, name: true }
        },
        projet: {
          select: { id: true, name: true }
        }
      },
      orderBy: { generatedAt: 'desc' },
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error("Erreur GET /api/encadrant/feedbacks:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des feedbacks" },
      { status: 500 }
    )
  }
}