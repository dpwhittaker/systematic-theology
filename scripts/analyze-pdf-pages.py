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


def find_headings(page):
    """Find headings by inspecting PDF font metadata.

    In the source markdown, headings are either:
      - # / ## / ### lines  → render at larger font sizes (20pt/14pt/12pt), bold
      - **entire-line bold** → render at body size (11pt), all spans bold

    We detect both by walking the page's text dict and checking whether a
    text line's spans are all bold AND either (a) the font size is > 11pt
    (markdown heading) or (b) the line is a standalone bold line at 11pt
    (bold-text heading).  Regular bold words inside paragraphs are excluded
    because not all spans on their line will be bold.
    """
    headings = []
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            spans = line["spans"]
            if not spans:
                continue
            text = "".join(s["text"] for s in spans).strip()
            if not text:
                continue
            # Check if ALL spans in this line are bold
            all_bold = all(s["flags"] & 16 for s in spans)  # bit 4 = bold
            if not all_bold:
                continue
            # Heading if font size > 11pt (h1/h2/h3) or entire line is bold at 11pt
            max_size = max(s["size"] for s in spans)
            if max_size > 11.0 or len(text) < 120:
                headings.append(text)
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
        info["headings"] = find_headings(doc[i])
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
