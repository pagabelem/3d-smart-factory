/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { randomBytes, scrypt as _scrypt } from "crypto"
import { promisify } from "util"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")

    // prisma expects the role to be the enum value; cast to any to satisfy TS
    const whereClause: any = role ? { role: role.toUpperCase() } : undefined

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Erreur GET /api/admin/users:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    )
  }
}




// POST - Créer un utilisateur
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await req.json()
    const { email, name, role, password } = body

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, nom et rôle sont requis" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    const scrypt = promisify(_scrypt)
    const plain = password || "changeme123"
    const salt = randomBytes(16).toString("hex")
    const derived = (await scrypt(plain, salt, 64)) as Buffer
    const hashedPassword = `${salt}:${derived.toString("hex")}`

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Erreur POST /api/admin/users:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    )
  }
}