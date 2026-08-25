import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer la dernière conversation du stagiaire
    const conversation = await prisma.conversation.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })

    if (!conversation) {
      return NextResponse.json({ messages: [], conversationId: null })
    }

    return NextResponse.json({
      messages: conversation.messages,
      conversationId: conversation.id,
    })
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/conversations:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des conversations" },
      { status: 500 }
    )
  }
}