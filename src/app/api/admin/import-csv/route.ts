import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import { parse } from "csv-parse/sync"
import bcrypt from "bcryptjs"

interface CsvRow {
  nom: string
  prenom: string
  email: string
  motDePasse: string
  projet: string
  equipe: string
  encadrant: string
  dateDebut: string
  dateFin: string
  numeroCarteSejour: string
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Fichier CSV requis" }, { status: 400 })
    }

    const text = await file.text()

    let rows: CsvRow[]
    try {
      rows = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (parseError) {
      return NextResponse.json(
        { error: "Format CSV invalide" },
        { status: 400 }
      )
    }

    const results: { line: number; email: string; status: string; error?: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const lineNumber = i + 2

      try {
        if (
          !row.nom || !row.prenom || !row.email || !row.motDePasse ||
          !row.projet || !row.equipe || !row.encadrant ||
          !row.dateDebut || !row.dateFin || !row.numeroCarteSejour
        ) {
          results.push({
            line: lineNumber,
            email: row.email || "inconnu",
            status: "erreur",
            error: "Colonnes manquantes",
          })
          continue
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: row.email },
        })
        if (existingUser) {
          results.push({
            line: lineNumber,
            email: row.email,
            status: "erreur",
            error: "Cet email existe deja",
          })
          continue
        }

        const encadrant = await prisma.user.findFirst({
          where: {
            role: "ENCADRANT",
            name: { equals: row.encadrant.trim(), mode: "insensitive" },
          },
        })

        if (!encadrant) {
          results.push({
            line: lineNumber,
            email: row.email,
            status: "erreur",
            error: `Encadrant introuvable: ${row.encadrant}`,
          })
          continue
        }

        let project = await prisma.project.findFirst({
          where: { name: { equals: row.projet.trim(), mode: "insensitive" } },
        })

        if (!project) {
          project = await prisma.project.create({
            data: {
              name: row.projet.trim(),
              ownerId: encadrant.id,
              status: "ACTIF",
            },
          })
        }

        let team = await prisma.team.findFirst({
          where: {
            name: { equals: row.equipe.trim(), mode: "insensitive" },
            projectId: project.id,
          },
        })

        if (!team) {
          team = await prisma.team.create({
            data: {
              name: row.equipe.trim(),
              projectId: project.id,
            },
          })
        }

        const hashedPassword = await bcrypt.hash(row.motDePasse, 10)

        const newUser = await prisma.user.create({
          data: {
            name: `${row.prenom.trim()} ${row.nom.trim()}`,
            email: row.email.trim(),
            password: hashedPassword,
            role: "STAGIAIRE",
            dateDebutStage: new Date(row.dateDebut),
            dateFinStage: new Date(row.dateFin),
            numeroCarteSejour: row.numeroCarteSejour.trim(),
            encadrantId: encadrant.id,
            teamMembers: {
              create: { teamId: team.id },
            },
          },
        })

        results.push({
          line: lineNumber,
          email: newUser.email,
          status: "succes",
        })
      } catch (rowError) {
        results.push({
          line: lineNumber,
          email: row.email || "inconnu",
          status: "erreur",
          error: rowError instanceof Error ? rowError.message : "Erreur inconnue",
        })
      }
    }

    const succesCount = results.filter((r) => r.status === "succes").length
    const erreurCount = results.filter((r) => r.status === "erreur").length

    return NextResponse.json({
      total: rows.length,
      succes: succesCount,
      erreurs: erreurCount,
      details: results,
    })
  } catch (error) {
    console.error("Erreur POST /api/admin/import-csv:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'import" },
      { status: 500 }
    )
  }
}