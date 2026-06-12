/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    include: {
      owner: true,
      teams: {
        include: {
          members: {
            include: { user: true }
          }
        }
      },
      tasks: true,
      gitRepos: true,
    }
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, ownerId } = body

  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: ownerId || session.user.id,
    }
  })

  return NextResponse.json(project, { status: 201 })
}