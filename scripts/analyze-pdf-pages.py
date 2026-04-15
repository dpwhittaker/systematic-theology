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
    """Find lines that look like headings (all-caps, short, or Roman numeral patterns)."""
    headings = []
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        # Detect rendered h2/h3 headings — typically bold/larger, but in extracted text
        # they appear as standalone short lines. Heuristics:
        # - Lines starting with Roman numerals: "I. ", "II. ", "III. ", "IV. ", etc.
        # - Lines starting with "###" or "##" (shouldn't appear in PDF but just in case)
        # - Short standalone lines (< 80 chars) that don't end with period
        #   and are preceded/followed by blank lines
        is_heading = False

        # Roman numeral section headers
        import re
        if re.match(r'^[IVXL]+\.\s', line_stripped):
            is_heading = True
        # Subsection headers like "Romans 8:9-11 — ..."
        elif re.match(r'^(Romans|Galatians|Ephesians|Corinthians|Thessalonians|Hebrews|Acts|John|Putting|The |What |Summary|Synthesis)', line_stripped):
            # Check if it's short enough to be a heading (not a paragraph)
            if len(line_stripped) < 80 and not line_stripped.endswith('.'):
                is_heading = True
        # Numbered subsection headers like "1. You Already Have..."
        elif re.match(r'^\d+\.\s', line_stripped) and len(line_stripped) < 80:
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
