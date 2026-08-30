#!/usr/bin/env python3
"""Create a deterministic ZIP with Linux-safe file modes."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import stat
import zipfile


FIXED_TIME = (1980, 1, 1, 0, 0, 0)
ROOT_EXECUTABLES = {"yhtctl", "yihetong-cli"}


def is_executable(relative: str) -> bool:
    return relative in ROOT_EXECUTABLES or relative.endswith(".sh")


def readable_path(path: Path) -> str:
    value = str(path.resolve())
    if os.name == "nt" and not value.startswith("\\\\?\\"):
        return f"\\\\?\\{value}"
    return value


def zip_info(relative: str, mode: int, *, directory: bool) -> zipfile.ZipInfo:
    name = f"{relative.rstrip('/')}/" if directory else relative
    info = zipfile.ZipInfo(name, FIXED_TIME)
    info.create_system = 3
    info.compress_type = zipfile.ZIP_STORED if directory else zipfile.ZIP_DEFLATED
    info.external_attr = (mode & 0xFFFF) << 16
    if directory:
        info.external_attr |= 0x10
    return info


def create_archive(source: Path, output: Path) -> dict[str, object]:
    source = source.resolve()
    output = output.resolve()
    if not source.is_dir():
        raise ValueError(f"Source directory does not exist: {source}")
    if output == source or source in output.parents:
        raise ValueError("Output ZIP must be outside the source directory")

    entries = sorted(source.rglob("*"), key=lambda item: item.relative_to(source).as_posix())
    for entry in entries:
        if entry.is_symlink():
            raise ValueError(f"Symbolic links are not allowed in release ZIPs: {entry}")

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(f".{output.name}.tmp")
    temporary.unlink(missing_ok=True)
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for entry in entries:
                relative = entry.relative_to(source).as_posix()
                if entry.is_dir():
                    archive.writestr(zip_info(relative, stat.S_IFDIR | 0o755, directory=True), b"")
                    continue
                mode = stat.S_IFREG | (0o755 if is_executable(relative) else 0o644)
                info = zip_info(relative, mode, directory=False)
                with open(readable_path(entry), "rb") as source_stream, archive.open(info, "w") as target_stream:
                    shutil.copyfileobj(source_stream, target_stream, length=1024 * 1024)
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True)

    with zipfile.ZipFile(output, "r") as archive:
        corrupt = archive.testzip()
        if corrupt:
            raise ValueError(f"ZIP CRC verification failed: {corrupt}")
        names = set(archive.namelist())
        executable_entries = []
        for entry in entries:
            if not entry.is_file():
                continue
            relative = entry.relative_to(source).as_posix()
            if not is_executable(relative):
                continue
            mode = (archive.getinfo(relative).external_attr >> 16) & 0o777
            if mode != 0o755:
                raise ValueError(f"Executable mode mismatch for {relative}: {oct(mode)}")
            executable_entries.append(relative)
        expected = {
            f"{entry.relative_to(source).as_posix()}/" if entry.is_dir() else entry.relative_to(source).as_posix()
            for entry in entries
        }
        if names != expected:
            raise ValueError("ZIP entry set differs from the source directory")

    return {
        "status": "pass",
        "output": str(output),
        "entryCount": len(entries),
        "executableEntries": executable_entries,
        "deterministicTimestamp": "1980-01-01T00:00:00Z",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    print(json.dumps(create_archive(Path(args.source), Path(args.output)), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
