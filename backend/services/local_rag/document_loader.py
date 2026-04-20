import re
from pathlib import Path


_HEADING_RE = re.compile(r"^###\s+(.+?)\s*$", re.MULTILINE)


def _clean_text(value: str) -> str:
    return "\n".join(line.rstrip() for line in value.strip().splitlines()).strip()


def load_markdown(file_path: str) -> list[dict]:
    path = Path(file_path)
    content = path.read_text(encoding="utf-8")
    matches = list(_HEADING_RE.finditer(content))

    chunks: list[dict] = []
    if matches:
        for index, match in enumerate(matches):
            start = match.end()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
            section = _clean_text(match.group(1))
            body = _clean_text(content[start:end])
            if not body:
                continue
            chunks.append(
                {
                    "content": body,
                    "metadata": {
                        "source_file": path.name,
                        "section": section or f"section_{index + 1}",
                    },
                }
            )
        if chunks:
            return chunks

    fallback = _clean_text(content)
    if not fallback:
        return []
    return [
        {
            "content": fallback,
            "metadata": {
                "source_file": path.name,
                "section": "全文",
            },
        }
    ]
