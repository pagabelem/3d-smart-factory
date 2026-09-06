import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const documents = await prisma.livrable.findMany({
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Erreur GET /api/admin/documents:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recuperation des documents" },
      { status: 500 }
    )
  }
}