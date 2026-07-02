#!/usr/bin/env python3
import json
import os
import sys
from xml.sax.saxutils import escape, quoteattr

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        HRFlowable,
        KeepTogether,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
    )
except ImportError as exc:
    raise SystemExit(
        "Missing Python dependency: reportlab. Install it with `python3 -m pip install reportlab`."
    ) from exc


def clean(value):
    return escape(str(value))


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(SCRIPT_DIR, "fonts")


def register_font(font_name, path):
    if not os.path.exists(path):
        return ""
    try:
        pdfmetrics.registerFont(TTFont(font_name, path))
    except Exception:
        return ""
    return font_name


FONT_REGULAR = (
    register_font("ResumeInter", os.path.join(FONT_DIR, "Inter-Regular.ttf"))
    or register_font("ResumeSans", os.path.join(FONT_DIR, "DejaVuSans.ttf"))
    or "Helvetica"
)
FONT_BOLD = (
    register_font("ResumeInterBold", os.path.join(FONT_DIR, "Inter-Bold.ttf"))
    or register_font("ResumeSansBold", os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf"))
    or FONT_REGULAR
)


def pipe_join(values):
    return " | ".join(str(value) for value in values if value)


def normalized_href(href):
    if not href:
        return ""
    if href.startswith("/"):
        return f"https://ishantjuyal.com{href}"
    return href


def contact_link(contact):
    value = clean(contact.get("value", ""))
    href = normalized_href(str(contact.get("href", "")))
    if not href:
        return value
    return f"<a href={quoteattr(href)} color=\"#0047ff\"><u>{value}</u></a>"


def rich_text_parts(parts):
    if not parts:
        return ""

    output = []
    for part in parts:
        text = clean(part.get("text", ""))
        href = normalized_href(str(part.get("href", "")))
        if href:
            output.append(f"<a href={quoteattr(href)} color=\"#0047ff\"><u>{text}</u></a>")
        else:
            output.append(text)
    return "".join(output)


def company_markup(job):
    if job.get("companyParts"):
        return rich_text_parts(job.get("companyParts", []))
    return clean(job.get("company", ""))


def draw_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT_REGULAR, 7)
    canvas.setFillColor(colors.HexColor("#777777"))
    canvas.drawRightString(letter[0] - 0.55 * inch, 0.35 * inch, f"Ishant Juyal - Resume - {doc.page}")
    canvas.restoreState()


def build_pdf(data, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title="Ishant Juyal Resume",
        author="Ishant Juyal",
    )

    styles = getSampleStyleSheet()
    story = []

    name_style = ParagraphStyle(
        "Name",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=24,
        leading=27,
        spaceAfter=6,
    )
    contact_style = ParagraphStyle(
        "Contact",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#222222"),
        spaceAfter=14,
    )
    summary_style = ParagraphStyle(
        "Summary",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#0047ff"),
        spaceAfter=12,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=15,
        leading=18,
        spaceBefore=10,
        spaceAfter=8,
    )
    role_style = ParagraphStyle(
        "Role",
        parent=styles["Normal"],
        fontName=FONT_BOLD,
        fontSize=10.8,
        leading=13,
        spaceAfter=4,
    )
    bullet_style = ParagraphStyle(
        "Bullet",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=9.3,
        leading=12.2,
        leftIndent=15,
        firstLineIndent=0,
        bulletIndent=4,
        spaceAfter=3,
    )
    skill_style = ParagraphStyle(
        "Skill",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=9.2,
        leading=12.2,
        spaceAfter=5,
    )
    education_style = ParagraphStyle(
        "Education",
        parent=styles["Normal"],
        fontName=FONT_REGULAR,
        fontSize=9.5,
        leading=12.5,
    )

    story.append(Paragraph(clean(data["name"]), name_style))
    story.append(
        Paragraph(
            pipe_join([contact_link(contact) for contact in data.get("contacts", [])]),
            contact_style,
        )
    )
    story.append(Paragraph(clean(data["summary"]), summary_style))
    story.append(HRFlowable(width="100%", thickness=1.4, color=colors.black, spaceAfter=12))

    story.append(Paragraph("Experience", section_style))
    for job in data.get("experience", []):
        heading = (
            f"{clean(job['role'])} - {company_markup(job)} "
            f"({clean(job['period'])})"
        )
        first_bullet = job.get("bullets", [""])[0]
        story.append(
            KeepTogether(
                [
                    Paragraph(heading, role_style),
                    Paragraph(clean(first_bullet), bullet_style, bulletText="-"),
                ]
            )
        )
        for bullet in job.get("bullets", [])[1:]:
            story.append(Paragraph(clean(bullet), bullet_style, bulletText="-"))
        story.append(Spacer(1, 4))

    story.append(Paragraph("Skills", section_style))
    for skill in data.get("skills", []):
        story.append(
            Paragraph(
                f"<font name='{FONT_BOLD}'>{clean(skill['label'])}:</font> {clean(skill['value'])}",
                skill_style,
            )
        )

    education = data.get("education", {})
    story.append(Paragraph("Education", section_style))
    story.append(
        Paragraph(
            f"<font name='{FONT_BOLD}'>{clean(education.get('school', ''))}</font><br/>"
            f"{clean(education.get('degree', ''))} "
            f"({clean(education.get('period', ''))})",
            education_style,
        )
    )

    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: render-resume-pdf.py resume-data.json output.pdf")

    with open(sys.argv[1], "r", encoding="utf-8") as handle:
        data = json.load(handle)

    build_pdf(data, sys.argv[2])


if __name__ == "__main__":
    main()
