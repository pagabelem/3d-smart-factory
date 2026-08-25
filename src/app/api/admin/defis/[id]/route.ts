import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== PATCH /api/admin/defis/[id] ===")
    
    // ✅ Déballer params avec await
    const { id } = await params
    console.log("ID reçu:", id)
    
    const session = await auth()
    console.log("Session utilisateur:", session?.user?.email, "Rôle:", session?.user?.role)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    console.log("Body reçu:", body)
    
    const { isActive } = body
    console.log("isActive:", isActive)

    // Vérifier que le défi existe
    const existingDefi = await prisma.defi.findUnique({
      where: { id: id } // ✅ Utiliser la variable déballée
    })
    console.log("Défi existant:", existingDefi)

    if (!existingDefi) {
      return NextResponse.json(
        { error: "Défi non trouvé" },
        { status: 404 }
      )
    }

    const defi = await prisma.defi.update({
      where: { id: id }, // ✅ Utiliser la variable déballée
      data: { isActive },
    })
    console.log("Défi mis à jour:", defi)

    return NextResponse.json(defi)
  } catch (error) {
    console.error("Erreur détaillée PATCH /api/admin/defis/[id]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du défi" },
      { status: 500 }
    )
  }
}