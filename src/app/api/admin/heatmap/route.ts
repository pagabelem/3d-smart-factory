/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import OpenAI from "openai"

// GET - Récupérer les données de la heatmap (pas besoin d'OpenAI)
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const view = searchParams.get("view") || "week"
    const days = view === "week" ? 7 : view === "month" ? 30 : 365

    // Récupérer les commits par jour
    const commitsByDay = await prisma.$queryRaw`
      SELECT 
        DATE("commitDate") as date,
        COUNT(*) as commits,
        COUNT(DISTINCT "authorEmail") as authors
      FROM "GitCommit"
      WHERE "commitDate" >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE("commitDate")
      ORDER BY DATE("commitDate")
    `

    // Récupérer les tâches par jour
    const tasksByDay = await prisma.$queryRaw`
      SELECT 
        DATE("updatedAt") as date,
        COUNT(*) as tasks
      FROM "Task"
      WHERE "updatedAt" >= NOW() - INTERVAL '${days} days'
        AND status = 'TERMINE'
      GROUP BY DATE("updatedAt")
      ORDER BY DATE("updatedAt")
    `

    // Formater les données
    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      
      const commits = (commitsByDay as any[]).find(c => c.date === dateStr)?.commits || 0
      const tasks = (tasksByDay as any[]).find(t => t.date === dateStr)?.tasks || 0
      
      data.push({
        date: dateStr,
        commits: Number(commits),
        tasks: Number(tasks),
        messages: Math.floor(Math.random() * 5),
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erreur GET /api/admin/heatmap:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    )
  }
}

// POST - Analyser les tendances avec IA (OpenAI utilisé uniquement ici)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que la clé API est configurée
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Clé API OpenAI non configurée" },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { periode = "semaine" } = body

    // Récupérer les données d'activité
    const [totalCommits, totalTasks, activeUsers] = await Promise.all([
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
      prisma.user.count({
        where: {
          role: "STAGIAIRE",
          tasks: {
            some: {
              status: "TERMINE",
              updatedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      }),
    ])

    // Initialiser OpenAI uniquement ici
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Générer une analyse avec OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un analyste de données. Analyse les tendances d'activité d'une équipe de développement."
        },
        {
          role: "user",
          content: `
Analyse les tendances d'activité suivantes pour la ${periode} passée :

- Total commits : ${totalCommits}
- Tâches terminées : ${totalTasks}
- Stagiaires actifs : ${activeUsers}

Donne :
1. Une analyse de la tendance (en hausse/baisse/stagnation)
2. Une prédiction pour la semaine prochaine
3. 3 conseils pour améliorer l'activité

Sois concis (max 150 mots) et encourageant.
          `
        }
      ],
      temperature: 0.6,
      max_tokens: 400,
    })

    return NextResponse.json({
      analyse: completion.choices[0]?.message?.content,
      stats: {
        totalCommits,
        totalTasks,
        activeUsers,
      }
    })
  } catch (error) {
    console.error("Erreur POST /api/admin/heatmap:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'analyse des tendances" },
      { status: 500 }
    )
  }
}