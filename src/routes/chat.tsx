import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCheck,
  FileText,
  Hand,
  Info,
  Mail,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Search,
  SendHorizonal,
  Smile,
  Sparkles,
  Ticket,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, Panel } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { conversations as seed, type Conversation, type Message } from "@/lib/mock-data";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — atendimento com IA | Certus AC" },
      {
        name: "description",
        content:
          "Central de chat multicanal da autoridade certificadora: fila, resumo automático, intenção detectada, sugestões de resposta e transferência do assistente para o humano.",
      },
      { property: "og:title", content: "Chat — atendimento com IA | Certus AC" },
      {
        property: "og:description",
        content: "Conversas multicanal com copiloto de IA, resumo automático e handoff em um clique.",
      },
    ],
  }),
  component: Chat,
});

const statusTone = { bot: "outline", fila: "alert", humano: "blue", resolvido: "neutral" } as const;
const statusLabel = { bot: "Assistente", fila: "Na fila", humano: "Humano", resolvido: "Resolvido" } as const;
const canalIcon: Record<string, typeof MessageCircle> = {
  WhatsApp: MessageCircle,
  Site: Bot,
  "E-mail": Mail,
  Telefone: Phone,
};

const filtros = [
  { id: "todas", label: "Todas" },
  { id: "fila", label: "Fila" },
  { id: "bot", label: "Assistente" },
  { id: "humano", label: "Minhas" },
  { id: "resolvido", label: "Resolvidas" },
] as const;

function iniciais(nome: string) {
  return nome
    .replace(/\b(LTDA|S\/A|ME|EIRELI)\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0］ ?? "")
    .join("")
    .toUpperCase();
}

function Chat() {
  return null;
}
