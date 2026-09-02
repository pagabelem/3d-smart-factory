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
    const { message, conversationId } = body

    if (!message) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      )
    }

    // Récupérer ou créer la conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId, userId: session.user.id },
      })
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id,
          messages: [],
        },
      })
    }

    // Récupérer l'historique
    const historique = conversation.messages as { role: string; content: string }[] || []

    // Récupérer les données du stagiaire
    const stagiaire = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        tasks: {
          where: { status: "TERMINE" }
        },
        _count: {
          select: { tasks: true }
        },
        badges: {
          include: { badge: true }
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

    // Construire le contexte
    const tasksDone = stagiaire?.tasks.length || 0
    const tasksTotal = stagiaire?._count?.tasks || 0
    const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
    const badgesCount = stagiaire?.badges.length || 0
    const totalXP = stagiaire?.badges.reduce((acc, ub) => acc + ub.badge.xpReward, 0) || 0
    
    let commitsCount = 0
    const projets = stagiaire?.teamMembers.map((tm) => {
      const project = tm.team.project
      const projectCommits = project.gitRepos.reduce((acc, repo) => 
        acc + repo.commits.length, 0
      )
      commitsCount += projectCommits
      return project.name
    }) || []

    const context = `
Contexte du stagiaire :
- Nom : ${stagiaire?.name || "Stagiaire"}
- Progression : ${progress}%
- Tâches : ${tasksDone}/${tasksTotal}
- Commits : ${commitsCount}
- Badges : ${badgesCount}
- XP : ${totalXP}
- Projets : ${projets.join(", ") || "Aucun"}

Historique de la conversation :
${historique.map(m => `${m.role}: ${m.content}`).join("\n")}

Question du stagiaire :
${message}
`

    let response = ""

    if (!process.env.OPENAI_API_KEY) {
      // Mode mock
      const responses = [
        "💡 Continuez vos efforts ! Vous progressez bien. Essayez de faire un commit par jour pour maintenir votre rythme.",
        "📊 Votre progression est bonne. Concentrez-vous sur la qualité du code plutôt que la quantité.",
        "🎯 Pour gagner plus de XP, terminez vos tâches en avance et aidez vos collègues.",
        "📝 La documentation est importante ! N'oubliez pas de commenter votre code.",
      ]
      response = responses[Math.floor(Math.random() * responses.length)]
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant bienveillant pour un stagiaire en développement. 
            Tu réponds de manière encourageante et constructive. 
            Tu donnes des conseils pratiques pour améliorer sa progression.
            Tu es concis (max 150 mots).
            Utilise du Markdown pour structurer tes réponses (titres, listes, etc.).`
          },
          {
            role: "user",
            content: context
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      })

      response = completion.choices[0]?.message?.content || "Je n'ai pas pu traiter votre demande."
    }

    // Sauvegarder les messages dans la conversation
    const updatedMessages = [
      ...historique,
      { role: "user", content: message },
      { role: "assistant", content: response },
    ]

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messages: updatedMessages,
      },
    })

    return NextResponse.json({
      response,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error("Erreur POST /api/stagiaire/assistant:", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse" },
      { status: 500 }
    )
  }
}

// GET - Récupérer l'historique des conversations
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "ID de conversation requis" }, { status: 400 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId: session.user.id },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      messages: conversation.messages,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/assistant:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    )
  }
}