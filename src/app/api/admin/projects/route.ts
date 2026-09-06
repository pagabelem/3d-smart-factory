import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// GET - Récupérer tous les projets
export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        tasks: {
          select: { id: true, status: true }
        },
        gitRepos: {
          select: { id: true, name: true, url: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Erreur GET /api/admin/projects:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    )
  }
}

// Détecte le fournisseur (GitHub/GitLab) et extrait un nom depuis l'URL
function parseGitUrl(gitUrl: string) {
  const cleaned = gitUrl.trim().replace(/\/$/, "").replace(/\.git$/, "")

  let provider: "GITHUB" | "GITLAB" = "GITHUB"
  if (cleaned.includes("gitlab.com")) {
    provider = "GITLAB"
  } else if (cleaned.includes("github.com")) {
    provider = "GITHUB"
  }

  const parts = cleaned.split("/")
  const name = parts[parts.length - 1] || cleaned
  const repoId = parts.slice(-2).join("/") || cleaned

  return { provider, name, repoId }
}

// POST - Créer un projet
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, ownerId, gitUrl } = body

    if (!name) {
      return NextResponse.json(
        { error: "Le nom du projet est requis" },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: ownerId || session.user.id,
      },
    })

    if (gitUrl && gitUrl.trim() !== "") {
      const { provider, name: repoName, repoId } = parseGitUrl(gitUrl)

      await prisma.gitRepository.create({
        data: {
          url: gitUrl.trim(),
          provider,
          repoId,
          name: repoName,
          projectId: project.id,
        },
      })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/admin/projects:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 }
    )
  }
}