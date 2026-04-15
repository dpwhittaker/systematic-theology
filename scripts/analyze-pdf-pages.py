#!/usr/bin/env python3
"""Analyze a handout PDF for page density and section placement.

Usage:
    python3 scripts/analyze-pdf-pages.py pdf/handouts_pneumatology.pdf

Requires: pymupdf (pip install pymupdf)

Reports per-page:
  - Text length (characters) and estimated fullness %
  - First heading on the page (h2/h3)
  - Whether any section likely overflows to the next page

Exit code 0 = all pages look fine, 1 = warnings found.
"""

import sys
import fitz  # pymupdf


def extract_page_info(page):
    """Extract text and structural info from a single PDF page."""
    text = page.get_text("text").strip()
    lines = text.split("\n") if text else []
    char_count = len(text)
    return {
        "text": text,
        "lines": lines,
        "line_count": len(lines),
        "char_count": char_count,
    }


def find_headings(lines):
    """Find lines that look like headings in rendered PDF text.

    In the PDF, markdown headings (h1/h2/h3) and bold-text headings both
    render as standalone short lines — no markdown markers remain.  We use
    a combination of pattern matching and structural heuristics.
    """
    import re
    headings = []
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue

        is_heading = False

        # Roman numeral section headers: "I. ", "II. ", "IV. ", "X. "
        if re.match(r'^[IVXL]+\.\s', line_stripped):
            is_heading = True
        # Numbered subsection headers: "1. You Already Have..."
        elif re.match(r'^\d+\.\s', line_stripped) and len(line_stripped) < 80:
            is_heading = True
        # Scripture-reference headings: "1 Corinthians 14:4-5 — ...",
        # "Romans 8:9-11:", "Acts 2:38 and ..."
        elif re.match(r'^\d?\s*(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Proverbs|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\b', line_stripped):
            if len(line_stripped) < 80:
                is_heading = True
        # Short standalone lines that look like headings:
        # < 80 chars, don't end with period/comma, and are the first line
        # or preceded by a blank line
        elif len(line_stripped) < 80 and not line_stripped[-1] in '.,;':
            prev_blank = (i == 0) or (not lines[i - 1].strip())
            # Also check if the line starts with a common heading word
            if prev_blank and re.match(r'^(The |What |How |Why |Where |Who |When |Summary|Synthesis|Putting|View |A note)', line_stripped):
                is_heading = True

        if is_heading:
            headings.append(line_stripped)
    return headings


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/analyze-pdf-pages.py <file.pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    doc = fitz.open(pdf_path)
    total_pages = doc.page_count

    # Estimate max chars per page from the fullest page
    page_infos = []
    for i in range(total_pages):
        info = extract_page_info(doc[i])
        info["page_num"] = i + 1
        info["headings"] = find_headings(info["lines"])
        page_infos.append(info)

    max_chars = max(p["char_count"] for p in page_infos)

    print(f"{'Page':>4}  {'Chars':>5}  {'Lines':>5}  {'Full%':>5}  First Heading")
    print("-" * 80)

    warnings = []
    for p in page_infos:
        fullness = (p["char_count"] / max_chars * 100) if max_chars > 0 else 0
        first_heading = p["headings"][0] if p["headings"] else "(no heading)"
        # Truncate heading for display
        display_heading = first_heading[:50] + "..." if len(first_heading) > 50 else first_heading
        print(f"{p['page_num']:>4}  {p['char_count']:>5}  {p['line_count']:>5}  {fullness:>5.0f}%  {display_heading}")

        # Warn on very sparse pages (< 25% full)
        if fullness < 25 and p["page_num"] < total_pages:
            warnings.append(f"  Page {p['page_num']}: only {fullness:.0f}% full — consider merging with adjacent content")

        # Warn on overfull pages (> 95%)
        if fullness > 95 and p["page_num"] > 1:
            warnings.append(f"  Page {p['page_num']}: {fullness:.0f}% full — content may be clipped or overflowing")

    print()
    print(f"Total pages: {total_pages}  ({'even' if total_pages % 2 == 0 else 'ODD — wastes a blank back page for double-sided'})")
    print(f"Max chars on a page: {max_chars}")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings:
            print(w)
        doc.close()
        sys.exit(1)
    else:
        print("\nNo warnings — all pages look reasonable.")
        doc.close()
        sys.exit(0)


if __name__ == "__main__":
    main()
