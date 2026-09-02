import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"

// GET - Récupérer les évaluations de l'encadrant
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un encadrant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || user.role !== "ENCADRANT") {
      return NextResponse.json({ error: "Accès réservé aux encadrants" }, { status: 403 })
    }

    // Récupérer les évaluations faites par cet encadrant
    const evaluations = await prisma.evaluation.findMany({
      where: {
        encadrantId: session.user.id,
      },
      include: {
        stagiaire: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        projet: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Formater les données
    const formattedEvaluations = evaluations.map((eval_) => ({
      id: eval_.id,
      stagiaire: eval_.stagiaire.name,
      stagiaireId: eval_.stagiaire.id,
      projet: eval_.projet.name,
      projetId: eval_.projet.id,
      note: eval_.note,
      commentaire: eval_.commentaire,
      date: eval_.createdAt.toISOString(),
    }))

    return NextResponse.json(formattedEvaluations)
  } catch (error) {
    console.error("Erreur GET /api/encadrant/evaluations:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des évaluations" },
      { status: 500 }
    )
  }
}

// POST - Créer une évaluation
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { stagiaireId, projetId, note, commentaire } = body

    // Vérifications
    if (!stagiaireId || !projetId || note === undefined) {
      return NextResponse.json(
        { error: "Stagiaire, projet et note sont requis" },
        { status: 400 }
      )
    }

    // Vérifier que le stagiaire existe
    const stagiaire = await prisma.user.findUnique({
      where: { id: stagiaireId, role: "STAGIAIRE" }
    })
    if (!stagiaire) {
      return NextResponse.json(
        { error: "Stagiaire non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que le projet existe
    const projet = await prisma.project.findUnique({
      where: { id: projetId }
    })
    if (!projet) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier que le stagiaire est bien dans un projet de l'encadrant
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: stagiaireId,
        team: {
          projectId: projetId,
        },
      },
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: "Ce stagiaire n'est pas assigné à ce projet" },
        { status: 400 }
      )
    }

    // Créer l'évaluation
    const evaluation = await prisma.evaluation.create({
      data: {
        note: parseFloat(note),
        commentaire: commentaire || "",
        stagiaireId,
        projetId,
        encadrantId: session.user.id,
      },
      include: {
        stagiaire: {
          select: { id: true, name: true }
        },
        projet: {
          select: { id: true, name: true }
        },
      },
    })

    return NextResponse.json({
      id: evaluation.id,
      stagiaire: evaluation.stagiaire.name,
      stagiaireId: evaluation.stagiaire.id,
      projet: evaluation.projet.name,
      projetId: evaluation.projet.id,
      note: evaluation.note,
      commentaire: evaluation.commentaire,
      date: evaluation.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/encadrant/evaluations:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'évaluation" },
      { status: 500 }
    )
  }
}