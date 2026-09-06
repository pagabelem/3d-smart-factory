import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import path from "path"
import OpenAI from "openai"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const body = await req.json()
    const { livrableId } = body

    if (!livrableId) {
      return NextResponse.json({ error: "ID du document requis" }, { status: 400 })
    }

    const livrable = await prisma.livrable.findUnique({
      where: { id: livrableId },
    })

    if (!livrable) {
      return NextResponse.json({ error: "Document non trouve" }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), "public", livrable.filepath)

    let extractedText = ""
    try {
      const officeParser = require("officeparser")
      const rawResult = await new Promise<unknown>((resolve, reject) => {
        officeParser.parseOffice(filePath, (data: unknown, err: unknown) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      })

      if (typeof rawResult === "string") {
        extractedText = rawResult
      } else if (Array.isArray(rawResult)) {
        extractedText = rawResult.join("\n")
      } else if (rawResult && typeof rawResult === "object") {
        extractedText = JSON.stringify(rawResult)
      } else {
        extractedText = String(rawResult ?? "")
      }
    } catch (extractError) {
      console.error("Erreur extraction texte:", extractError)
      return NextResponse.json(
        { error: "Impossible de lire le contenu du fichier" },
        { status: 500 }
      )
    }

    if (!extractedText || extractedText.trim() === "") {
      return NextResponse.json(
        { error: "Aucun texte trouve dans le document" },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      const fallback = {
        synthese: "Analyse IA non disponible pour le moment. La cle API OpenAI n'est pas configuree.",
        questions: [],
        recommandations: [],
        generatedAt: new Date().toISOString(),
        textPreview: extractedText.substring(0, 500),
      }

      await prisma.livrable.update({
        where: { id: livrableId },
        data: { indexedText: JSON.stringify(fallback) },
      })

      return NextResponse.json(fallback)
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `
Tu es un evaluateur pedagogique. Voici le contenu d'un document envoye par un stagiaire (rapport ou presentation) :

${extractedText.substring(0, 6000)}

Analyse ce document et reponds strictement au format JSON suivant, sans texte autour :
{
  "synthese": "un resume en 3 a 5 phrases du contenu du document",
  "questions": ["question 1 a poser au stagiaire", "question 2", "question 3"],
  "recommandations": ["recommandation 1 pour ameliorer le travail", "recommandation 2"]
}
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un evaluateur pedagogique qui repond uniquement en JSON valide." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
    })

    const raw = completion.choices[0]?.message?.content || "{}"

    let parsed
    try {
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim()
      parsed = JSON.parse(cleaned)
    } catch (parseError) {
      parsed = {
        synthese: raw,
        questions: [],
        recommandations: [],
      }
    }

    const result = {
      synthese: parsed.synthese || "Synthese non disponible",
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      recommandations: Array.isArray(parsed.recommandations) ? parsed.recommandations : [],
      generatedAt: new Date().toISOString(),
    }

    await prisma.livrable.update({
      where: { id: livrableId },
      data: { indexedText: JSON.stringify(result) },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erreur POST /api/admin/documents/analyze:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'analyse" },
      { status: 500 }
    )
  }
}