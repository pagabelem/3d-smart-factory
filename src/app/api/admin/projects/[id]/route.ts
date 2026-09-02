import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// GET - Récupérer les détails d'un projet
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
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
          select: { id: true, title: true, status: true }
        },
        gitRepos: {
          select: { id: true, name: true, url: true }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Erreur GET /api/admin/projects/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du projet" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un projet
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const existingProject = await prisma.project.findUnique({
      where: { id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    await prisma.project.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Projet supprimé avec succès" })
  } catch (error) {
    console.error("Erreur DELETE /api/admin/projects/[id]:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet" },
      { status: 500 }
    )
  }
}