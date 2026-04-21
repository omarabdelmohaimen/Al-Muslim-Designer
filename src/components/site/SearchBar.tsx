import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPopularSearches, fetchPublishedMedia, normalizeArabicText } from "@/lib/media-db";

type SuggestionKind = "popular" | "title" | "surah" | "reciter" | "tag";

interface SuggestionItem {
  text: string;
  kind: SuggestionKind;
}

export const SearchBar = ({ initial = "" }: { initial?: string }) => {
  const [q, setQ] = useState(initial);
  const [dbSuggestions, setDbSuggestions] = useState<SuggestionItem[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSuggestions = async () => {
      const [media, popular] = await Promise.all([fetchPublishedMedia(), fetchPopularSearches()]);

      const toValidText = (value: unknown): string | null => {
        if (typeof value !== "string") return null;
        const text = value.trim();
        return text ? text : null;
      };

      const fromMedia: SuggestionItem[] = media.flatMap((item) => {
        const title = toValidText(item.title_ar);
        const surah = toValidText(item.surah);
        const reciter = toValidText(item.reciter);

        return [
          ...(title ? [{ text: title, kind: "title" as const }] : []),
          ...(surah ? [{ text: surah, kind: "surah" as const }] : []),
          ...(reciter ? [{ text: reciter, kind: "reciter" as const }] : []),
          ...(Array.isArray(item.tags)
            ? item.tags
                .map((tag) => toValidText(tag))
                .filter((tag): tag is string => Boolean(tag))
                .map((tag) => ({ text: tag, kind: "tag" as const }))
            : []),
        ];
      });

      const fromPopular: SuggestionItem[] = popular
        .map((text) => toValidText(text))
        .filter((text): text is string => Boolean(text))
        .map((text) => ({ text, kind: "popular" }));

      setDbSuggestions([...fromPopular, ...fromMedia]);
    };

    void loadSuggestions();
  }, []);

  const suggestions = useMemo(() => {
    const raw = q.trim();
    const normalizedQuery = normalizeArabicText(raw);
    if (!normalizedQuery) return [];

    const kindRank: Record<SuggestionKind, number> = {
      reciter: 0,
      title: 1,
      surah: 2,
      tag: 3,
      popular: 4,
    };

    const matches = dbSuggestions
      .map((item) => {
        if (typeof item.text !== "string") return null;
        const text = item.text.trim();
        if (!text) return null;

        const normalizedText = normalizeArabicText(text);
        if (!normalizedText) return null;

        const startsWith = normalizedText.startsWith(normalizedQuery);
        const contains = !startsWith && normalizedText.includes(normalizedQuery);
        if (!startsWith && !contains) return null;

        const baseScore = startsWith ? 0 : 1;
        const lengthPenalty = Math.abs(normalizedText.length - normalizedQuery.length) * 0.04;

        return {
          ...item,
          text,
          normalizedText,
          baseScore,
          startsWith,
          score: baseScore + lengthPenalty + kindRank[item.kind] * 0.03,
        };
      })
      .filter(Boolean) as Array<{
      text: string;
      kind: SuggestionKind;
      normalizedText: string;
      baseScore: number;
      startsWith: boolean;
      score: number;
    }>;

    if (!matches.length) return [];

    const bestReciter = matches
      .filter((m) => m.kind === "reciter")
      .reduce((min, m) => Math.min(min, m.baseScore), Number.POSITIVE_INFINITY);
    const bestOther = matches
      .filter((m) => m.kind !== "reciter")
      .reduce((min, m) => Math.min(min, m.baseScore), Number.POSITIVE_INFINITY);

    const hasReciterIntent =
      Number.isFinite(bestReciter) &&
      (bestReciter < bestOther || (bestReciter === 0 && normalizeArabicText(raw).length >= 2));

    const deduped = new Map<string, { text: string; score: number }>();

    for (const match of matches) {
      const reciterBoost = hasReciterIntent && match.kind === "reciter" ? -1.5 : 0;
      const finalScore = match.score + reciterBoost;
      const existing = deduped.get(match.normalizedText);

      if (!existing || finalScore < existing.score) {
        deduped.set(match.normalizedText, { text: match.text, score: finalScore });
      }
    }

    return [...deduped.values()]
      .sort((a, b) => a.score - b.score)
      .slice(0, 8)
      .map((item) => item.text);
  }, [q, dbSuggestions]);

  const buildNormalizedIndex = (value: string) => {
    const chars = Array.from(value);
    let normalized = "";
    const rawIndexMap: number[] = [];

    for (let i = 0; i < chars.length; i += 1) {
      const rawChar = chars[i];
      const lower = rawChar.toLowerCase();

      if (/[\u064B-\u065F\u0670]/.test(lower)) continue;

      const mappedChar = normalizeArabicText(lower);
      if (!mappedChar) continue;

      if (mappedChar === " ") {
        if (!normalized.length || normalized.endsWith(" ")) continue;
        normalized += " ";
        rawIndexMap.push(i);
        continue;
      }

      normalized += mappedChar;
      rawIndexMap.push(i);
    }

    while (normalized.endsWith(" ")) {
      normalized = normalized.slice(0, -1);
      rawIndexMap.pop();
    }

    return { normalized, rawIndexMap, chars };
  };

  const renderHighlightedSuggestion = (text: string, query: string) => {
    const normalizedNeedle = normalizeArabicText(query);
    if (!normalizedNeedle) return text;

    const { normalized, rawIndexMap, chars } = buildNormalizedIndex(text);
    if (!normalized || !rawIndexMap.length) return text;

    const matchRanges: Array<{ start: number; end: number }> = [];
    let from = 0;

    while (from < normalized.length) {
      const idx = normalized.indexOf(normalizedNeedle, from);
      if (idx === -1) break;

      const normEnd = idx + normalizedNeedle.length;
      const startRaw = rawIndexMap[idx];
      const endRaw = (rawIndexMap[normEnd - 1] ?? rawIndexMap[rawIndexMap.length - 1]) + 1;
      matchRanges.push({ start: startRaw, end: endRaw });
      from = idx + normalizedNeedle.length;
    }

    if (!matchRanges.length) return text;

    const nodes: JSX.Element[] = [];
    let cursor = 0;

    matchRanges.forEach((range, index) => {
      if (range.start > cursor) {
        nodes.push(
          <span key={`text-${text}-${index}-before`}>{chars.slice(cursor, range.start).join("")}</span>,
        );
      }

      nodes.push(
        <mark
          key={`text-${text}-${index}-mark`}
          className="rounded-sm bg-accent px-1 font-semibold text-accent-foreground"
        >
          {chars.slice(range.start, range.end).join("")}
        </mark>,
      );

      cursor = range.end;
    });

    if (cursor < chars.length) {
      nodes.push(<span key={`text-${text}-after`}>{chars.slice(cursor).join("")}</span>);
    }

    return nodes;
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const clean = q.trim();
          if (!clean) return;
          setOpen(false);
          navigate(`/search?q=${encodeURIComponent(clean)}`);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 120);
          }}
          placeholder="ابحث: سورة الكهف، خلفية زرقاء، كروما إسلامية..."
          className="h-11 w-full rounded-md border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button className="h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">بحث</button>
      </form>

      {open && !!suggestions.length && (
        <div className="absolute z-40 mt-2 w-full rounded-md border border-border bg-card p-2 shadow-lg">
          {suggestions.map((item) => (
            <button
              key={item}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQ(item);
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(item)}`);
              }}
              className="block w-full rounded-sm px-3 py-2 text-right text-sm text-foreground hover:bg-accent"
            >
              {renderHighlightedSuggestion(item, q)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
