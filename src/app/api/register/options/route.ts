import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      teams: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const encadrants = await prisma.user.findMany({
    where: { role: "ENCADRANT" },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ projects, encadrants })
}