import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
]

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const documents = await prisma.livrable.findMany({
      where: { uploadedById: session.user.id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/documents:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des documents" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Fichier et projet requis" },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF et PowerPoint sont acceptes" },
        { status: 400 }
      )
    }

    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas depasser 20 Mo" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents")
    await fs.mkdir(uploadDir, { recursive: true })

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const uniqueName = `${Date.now()}_${safeName}`
    const filePath = path.join(uploadDir, uniqueName)
    await fs.writeFile(filePath, buffer)

    const livrable = await prisma.livrable.create({
      data: {
        filename: file.name,
        filepath: `/uploads/documents/${uniqueName}`,
        uploadedById: session.user.id,
        projectId,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(livrable, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/stagiaire/documents:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du document" },
      { status: 500 }
    )
  }
}