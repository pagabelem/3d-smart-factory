import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import OpenAI from "openai"

// GET - Récupérer tous les rapports (pas besoin d'OpenAI)
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const rapports = await prisma.rapport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(rapports)
  } catch (error) {
    console.error("Erreur GET /api/admin/rapports:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rapports" },
      { status: 500 }
    )
  }
}

// POST - Générer un rapport IA (OpenAI utilisé ici uniquement)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que la clé API est configurée
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Clé API OpenAI non configurée. Veuillez ajouter OPENAI_API_KEY dans .env" },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { type, projetId } = body

    // 1. Récupérer les données réelles
    const [projects, users, commits, tasks] = await Promise.all([
      prisma.project.count(),
      prisma.user.count({ where: { role: "STAGIAIRE" } }),
      prisma.gitCommit.count({
        where: {
          commitDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.task.count({
        where: {
          status: "TERMINE",
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
    ])

    // 2. Récupérer les commits récents
    const recentCommits = await prisma.gitCommit.findMany({
      take: 20,
      orderBy: { commitDate: 'desc' },
      include: {
        repository: {
          include: {
            project: true
          }
        }
      }
    })

    const commitMessages = recentCommits.map(c => `- ${c.message} (${c.authorName})`).join('\n')

    // 3. Récupérer les tâches récentes
    const recentTasks = await prisma.task.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      where: { status: "TERMINE" },
      include: {
        assignedTo: true,
        project: true
      }
    })

    const taskSummary = recentTasks.map(t => 
      `- ${t.title} (${t.assignedTo?.name || 'Non assigné'}) - ${t.project?.name || 'Sans projet'}`
    ).join('\n')

    // 4. Construire le prompt pour OpenAI
    const prompt = `
Tu es un analyste de projet. Génère un rapport ${type === 'hebdomadaire' ? 'hebdomadaire' : 'mensuel'} pour l'équipe de développement.

## Données du projet :
- Nombre total de projets : ${projects}
- Nombre de stagiaires : ${users}
- Commits cette semaine : ${commits}
- Tâches terminées : ${tasks}

## Derniers commits :
${commitMessages || 'Aucun commit récent'}

## Dernières tâches terminées :
${taskSummary || 'Aucune tâche terminée récemment'}

## Instructions :
1. Résume les activités principales
2. Identifie les tendances (points positifs et négatifs)
3. Donne des recommandations pour la semaine prochaine
4. Sois professionnel et concis (200-300 mots)
5. Utilise un ton encourageant

Génère un rapport structuré avec :
- 📊 Résumé général
- ✅ Points positifs
- ⚠️ Points d'attention
- 💡 Recommandations
- 📈 Indicateurs clés
`

    // 5. Initialiser OpenAI uniquement ici
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un analyste de projet qui génère des rapports professionnels." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const contenu = completion.choices[0]?.message?.content || "Erreur lors de la génération du rapport"

    // 6. Sauvegarder en base
    const rapport = await prisma.rapport.create({
      data: {
        titre: `Rapport ${type} - ${new Date().toLocaleDateString()}`,
        type: type,
        contenu: contenu,
        statut: "genere",
        date: new Date(),
        projetId: projetId || null,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json(rapport, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/admin/rapports:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la génération du rapport" },
      { status: 500 }
    )
  }
}