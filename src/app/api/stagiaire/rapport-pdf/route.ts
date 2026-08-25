import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { NextResponse } from "next/server"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const rapportId = searchParams.get("id")

    if (!rapportId) {
      return NextResponse.json({ error: "ID du rapport requis" }, { status: 400 })
    }

    const rapport = await prisma.rapport.findUnique({
      where: { id: rapportId, createdBy: session.user.id },
    })

    if (!rapport) {
      return NextResponse.json({ error: "Rapport non trouvé" }, { status: 404 })
    }

    // Créer un document PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 800])
    const { width, height } = page.getSize()
    
    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Titre
    page.drawText(rapport.titre, {
      x: 50,
      y: height - 50,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.3),
    })

    // Date
    page.drawText(`Date: ${new Date(rapport.date).toLocaleDateString()}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Nom du stagiaire
    page.drawText(`Stagiaire: ${session.user.name}`, {
      x: 50,
      y: height - 105,
      size: 12,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Séparateur
    page.drawLine({
      start: { x: 50, y: height - 120 },
      end: { x: width - 50, y: height - 120 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    // Contenu - Formatage simple
    const contentLines = rapport.contenu.split("\n")
    let yPosition = height - 145
    const lineHeight = 18
    const maxWidth = width - 100

    for (const line of contentLines) {
      if (yPosition < 50) {
        // Nouvelle page si nécessaire
        const newPage = pdfDoc.addPage([600, 800])
        yPosition = newPage.getSize().height - 50
      }

      // Détecter les titres (commençant par #)
      if (line.startsWith('# ')) {
        page.drawText(line.substring(2), {
          x: 50,
          y: yPosition,
          size: 16,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.3),
        })
        yPosition -= lineHeight + 10
      } else if (line.startsWith('## ')) {
        page.drawText(line.substring(3), {
          x: 50,
          y: yPosition,
          size: 14,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.4),
        })
        yPosition -= lineHeight + 5
      } else if (line.startsWith('- ')) {
        page.drawText(`• ${line.substring(2)}`, {
          x: 70,
          y: yPosition,
          size: 11,
          font: font,
          color: rgb(0.2, 0.2, 0.2),
        })
        yPosition -= lineHeight
      } else if (line.trim() === '') {
        yPosition -= lineHeight * 0.5
      } else if (line.startsWith('---')) {
        page.drawLine({
          start: { x: 50, y: yPosition + 5 },
          end: { x: width - 50, y: yPosition + 5 },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        })
        yPosition -= lineHeight
      } else {
        // Texte normal avec wrapping
        const words = line.split(' ')
        let currentLine = ''
        for (const word of words) {
          const testLine = currentLine + word + ' '
          const testWidth = font.widthOfTextAtSize(testLine, 11)
          if (testWidth > maxWidth) {
            page.drawText(currentLine.trim(), {
              x: 50,
              y: yPosition,
              size: 11,
              font: font,
              color: rgb(0.2, 0.2, 0.2),
            })
            yPosition -= lineHeight
            currentLine = word + ' '
          } else {
            currentLine = testLine
          }
        }
        if (currentLine.trim()) {
          page.drawText(currentLine.trim(), {
            x: 50,
            y: yPosition,
            size: 11,
            font: font,
            color: rgb(0.2, 0.2, 0.2),
          })
          yPosition -= lineHeight
        }
      }
    }

    const pdfBytes = await pdfDoc.save()
    
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport_stage_${rapportId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erreur GET /api/stagiaire/rapport-pdf:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la génération du PDF" },
      { status: 500 }
    )
  }
}