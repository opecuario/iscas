import { NextResponse } from "next/server";

// Encaminha um novo lead pra um Google Sheet via Apps Script Web App.
// Configure no Vercel:
//   GOOGLE_SHEETS_WEBHOOK_URL    = URL do Web App publicado no Apps Script
//   GOOGLE_SHEETS_WEBHOOK_SECRET = mesmo segredo configurado no script

export const runtime = "nodejs";

interface LeadPayload {
  nome: string;
  email: string;
  telefone?: string;
  estado?: string;
  municipio?: string;
  hectares?: number | string | null;
  simulacoes?: number;
}

export async function POST(req: Request) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) {
    return NextResponse.json(
      { ok: false, erro: "google sheets nao configurado" },
      { status: 503 }
    );
  }

  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, erro: "json invalido" },
      { status: 400 }
    );
  }

  const nome = (body.nome || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  if (!nome || !email) {
    return NextResponse.json(
      { ok: false, erro: "nome e email obrigatorios" },
      { status: 400 }
    );
  }

  const payload = {
    secret,
    nome,
    email,
    telefone: (body.telefone || "").trim(),
    estado: (body.estado || "").trim(),
    municipio: (body.municipio || "").trim(),
    hectares: body.hectares ?? "",
    simulacoes: typeof body.simulacoes === "number" ? body.simulacoes : 0,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Apps Script normalmente responde rapido; timeout natural do fetch
    });
    if (!r.ok) {
      console.error(
        "google sheets respondeu com status",
        r.status,
        await r.text().catch(() => "")
      );
      return NextResponse.json(
        { ok: false, erro: "google sheets recusou" },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("falha ao encaminhar pro google sheets", err);
    return NextResponse.json(
      { ok: false, erro: "falha de rede" },
      { status: 502 }
    );
  }
}
