import type { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../config/database";
import type { AuthRequest } from "../../middlewares/auth.middleware";

/**
 * Admin-facing endpoints to manage student academic notes ("moyenne" in
 * the Etudiant table — exposed as `note` to the UI for ergonomic naming).
 *
 *   GET  /api/v1/admin/students/notes
 *   PUT  /api/v1/admin/students/:etudiantId/note
 *   POST /api/v1/admin/students/import-notes
 *
 * No schema change: re-uses the existing Decimal column. Validation rules:
 *   - note ∈ [0, 20] (Algerian academic scale; configurable below).
 *   - up to 2 fractional digits (matches the Decimal(4,2) column type).
 *   - null is allowed and means "no recorded note".
 */

const NOTE_MIN = 0;
const NOTE_MAX = 20;

const toEtudiantId = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const sanitizeNote = (raw: unknown): { note: number | null; error?: string } => {
  if (raw === null || raw === undefined || raw === "") {
    return { note: null };
  }
  const asString = String(raw).trim().replace(",", ".");
  if (!asString) return { note: null };
  const parsed = Number(asString);
  if (!Number.isFinite(parsed)) {
    return { note: null, error: `not a number: ${raw}` };
  }
  if (parsed < NOTE_MIN || parsed > NOTE_MAX) {
    return { note: null, error: `out of range (must be ${NOTE_MIN}–${NOTE_MAX})` };
  }
  // Round to two decimals — matches the @db.Decimal(4, 2) column.
  const rounded = Math.round(parsed * 100) / 100;
  return { note: rounded };
};

/* ─────────────────────────── List ───────────────────────────── */

export const listStudentNotesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const promoIdRaw = req.query.promoId;
    const promoId = promoIdRaw !== undefined && promoIdRaw !== "" ? Number(promoIdRaw) : null;

    const where: Prisma.EtudiantWhereInput = {};
    if (Number.isInteger(promoId) && promoId! > 0) {
      where.promoId = promoId!;
    }
    if (search) {
      where.OR = [
        { matricule: { contains: search, mode: "insensitive" } },
        { user: { nom: { contains: search, mode: "insensitive" } } },
        { user: { prenom: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const students = await prisma.etudiant.findMany({
      where,
      orderBy: [{ user: { nom: "asc" } }, { user: { prenom: "asc" } }],
      take: 500,
      select: {
        id: true,
        matricule: true,
        moyenne: true,
        promoId: true,
        promo: {
          select: { id: true, nom_ar: true, nom_en: true, anneeUniversitaire: true, section: true },
        },
        user: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    const data = students.map((s) => ({
      etudiantId: s.id,
      userId: s.user?.id ?? null,
      matricule: s.matricule,
      nom: s.user?.nom ?? "",
      prenom: s.user?.prenom ?? "",
      email: s.user?.email ?? "",
      promoId: s.promoId,
      promo: s.promo
        ? {
            id: s.promo.id,
            nom_ar: s.promo.nom_ar,
            nom_en: s.promo.nom_en,
            anneeUniversitaire: s.promo.anneeUniversitaire,
            section: s.promo.section,
          }
        : null,
      note: s.moyenne != null ? Number(s.moyenne) : null,
    }));

    res.status(200).json({ success: true, data, count: data.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: "STUDENT_NOTES_LIST_FAILED", message: error instanceof Error ? error.message : "Internal error" },
    });
  }
};

/* ─────────────────────────── Update one ─────────────────────── */

export const updateStudentNoteHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const etudiantId = toEtudiantId(req.params.etudiantId);
    if (!etudiantId) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ETUDIANT_ID", message: "etudiantId must be a positive integer" },
      });
      return;
    }

    const body = (req.body || {}) as { note?: unknown; moyenne?: unknown };
    const raw = body.note !== undefined ? body.note : body.moyenne;
    const { note, error } = sanitizeNote(raw);
    if (error) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_NOTE", message: `Invalid note value: ${error}` },
      });
      return;
    }

    const existing = await prisma.etudiant.findUnique({
      where: { id: etudiantId },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "STUDENT_NOT_FOUND", message: `Student ${etudiantId} not found` },
      });
      return;
    }

    const updated = await prisma.etudiant.update({
      where: { id: etudiantId },
      data: { moyenne: note },
      select: {
        id: true,
        matricule: true,
        moyenne: true,
        user: { select: { nom: true, prenom: true, email: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        etudiantId: updated.id,
        matricule: updated.matricule,
        nom: updated.user?.nom ?? "",
        prenom: updated.user?.prenom ?? "",
        email: updated.user?.email ?? "",
        note: updated.moyenne != null ? Number(updated.moyenne) : null,
      },
      message: "Note updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "STUDENT_NOTE_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Internal error",
      },
    });
  }
};

/* ─────────────────────────── CSV import ─────────────────────── */

type ParsedRow = {
  rowNumber: number;
  email: string;
  name?: string;
  noteRaw: string;
};

type ImportRowResult = {
  rowNumber: number;
  email: string;
  status: "updated" | "skipped" | "error";
  reason?: string;
  noteApplied?: number | null;
};

/**
 * Tiny CSV parser sufficient for the import format we accept. Supports
 * double-quoted fields (with embedded `""` escapes) and comma separators.
 * Reusing a third-party CSV lib would be overkill here — the format is
 * locked to `name,email,note` with no nested data.
 */
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      current.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      current.push(cell);
      rows.push(current);
      current = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    rows.push(current);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
};

export const importStudentNotesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // The route can either accept a multipart upload (req.file) OR a
    // raw `csv` body field — handy for callers who already have the text.
    const filePayload = (req as any).file as { buffer?: Buffer } | undefined;
    const csvFromFile = filePayload?.buffer ? filePayload.buffer.toString("utf8") : null;
    const csvFromBody = typeof req.body?.csv === "string" ? req.body.csv : null;
    const csvText = csvFromFile || csvFromBody;

    if (!csvText || !csvText.trim()) {
      res.status(400).json({
        success: false,
        error: { code: "MISSING_CSV", message: "Provide a CSV file or a `csv` body field" },
      });
      return;
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: "EMPTY_CSV", message: "CSV file is empty" },
      });
      return;
    }

    // Detect a header row by checking column 1 for "email" (case-insensitive).
    // If the first row looks like a header we skip it; otherwise treat it as data.
    const firstRow = rows[0].map((c) => String(c).trim().toLowerCase());
    const looksLikeHeader =
      firstRow.includes("email") ||
      firstRow.includes("note") ||
      firstRow.includes("name") ||
      firstRow.includes("nom");

    const dataRows: ParsedRow[] = [];
    const startIndex = looksLikeHeader ? 1 : 0;
    for (let i = startIndex; i < rows.length; i++) {
      const cells = rows[i];
      if (cells.length < 2) continue;
      // Tolerate (name, email, note) and (email, note) layouts.
      let name = "";
      let email = "";
      let noteRaw = "";
      if (cells.length >= 3) {
        [name, email, noteRaw] = cells;
      } else {
        [email, noteRaw] = cells;
      }
      dataRows.push({
        rowNumber: i + 1,
        email: String(email || "").trim(),
        name: String(name || "").trim() || undefined,
        noteRaw: String(noteRaw || "").trim(),
      });
    }

    if (dataRows.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: "NO_DATA_ROWS", message: "CSV has a header but no data rows" },
      });
      return;
    }

    // Resolve all emails in one query — much faster than N round-trips.
    const emails = Array.from(new Set(dataRows.map((r) => r.email.toLowerCase()).filter(Boolean)));
    const matched = await prisma.etudiant.findMany({
      where: {
        user: {
          email: { in: emails, mode: "insensitive" },
        },
      },
      select: {
        id: true,
        user: { select: { email: true } },
      },
    });
    const emailToEtudiantId = new Map<string, number>();
    for (const row of matched) {
      const e = String(row.user?.email || "").trim().toLowerCase();
      if (e) emailToEtudiantId.set(e, row.id);
    }

    const results: ImportRowResult[] = [];
    let updated = 0;
    let skipped = 0;
    let errored = 0;

    // Sequential to keep error reporting deterministic and avoid pile-up
    // on transient database hiccups. CSVs are small (rosters), so this is
    // never the bottleneck.
    for (const row of dataRows) {
      const emailKey = row.email.toLowerCase();
      if (!emailKey) {
        results.push({ rowNumber: row.rowNumber, email: row.email, status: "error", reason: "missing email" });
        errored++;
        continue;
      }

      const etudiantId = emailToEtudiantId.get(emailKey);
      if (!etudiantId) {
        results.push({ rowNumber: row.rowNumber, email: row.email, status: "skipped", reason: "no student with this email" });
        skipped++;
        continue;
      }

      const { note, error } = sanitizeNote(row.noteRaw);
      if (error) {
        results.push({ rowNumber: row.rowNumber, email: row.email, status: "error", reason: error });
        errored++;
        continue;
      }

      try {
        await prisma.etudiant.update({
          where: { id: etudiantId },
          data: { moyenne: note },
        });
        results.push({ rowNumber: row.rowNumber, email: row.email, status: "updated", noteApplied: note });
        updated++;
      } catch (e) {
        results.push({
          rowNumber: row.rowNumber,
          email: row.email,
          status: "error",
          reason: e instanceof Error ? e.message : "update failed",
        });
        errored++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalRows: dataRows.length,
        updated,
        skipped,
        errored,
        results,
      },
      message: `Processed ${dataRows.length} row(s): ${updated} updated, ${skipped} skipped, ${errored} errored.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "STUDENT_NOTES_IMPORT_FAILED",
        message: error instanceof Error ? error.message : "Internal error",
      },
    });
  }
};
