import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nom,
      prenom,
      email,
      password,
      teamId,
      encadrantId,
      dateDebutStage,
      dateFinStage,
      numeroCarteSejour,
    } = body

    if (
      !nom || !prenom || !email || !password ||
      !teamId || !encadrantId ||
      !dateDebutStage || !dateFinStage || !numeroCarteSejour
    ) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires." },
        { status: 400 }
      )
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 409 }
      )
    }

    const existingCarte = await prisma.user.findUnique({
      where: { numeroCarteSejour },
    })
    if (existingCarte) {
      return NextResponse.json(
        { error: "Ce numéro de carte de séjour est déjà enregistré." },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name: `${prenom} ${nom}`,
        email,
        password: hashedPassword,
        role: "STAGIAIRE",
        dateDebutStage: new Date(dateDebutStage),
        dateFinStage: new Date(dateFinStage),
        numeroCarteSejour,
        encadrantId,
        teamMembers: {
          create: {
            teamId,
          },
        },
      },
    })

    return NextResponse.json(
      { success: true, userId: newUser.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erreur inscription stagiaire:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription." },
      { status: 500 }
    )
  }
}