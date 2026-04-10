import { useState, useEffect } from "react";
import { envConfig } from "@/config/env.config";
import {
  Search,
  Plus,
  Trash2,
  Save,
  Volume2,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface KeywordEntry {
  word: string;
  intensifier?: number;
}

const VAPI_API = envConfig.vapi.apiUrl;
const VAPI_KEY = envConfig.vapi.privateApiKey;
const ASSISTANT_ID = envConfig.vapi.assistantId;

function parseKeyword(raw: string): KeywordEntry {
  const parts = raw.split(":");
  if (parts.length === 2 && !isNaN(Number(parts[1]))) {
    return { word: parts[0], intensifier: Number(parts[1]) };
  }
  return { word: raw };
}

function serializeKeyword(entry: KeywordEntry): string {
  if (entry.intensifier !== undefined && entry.intensifier !== 1) {
    return `${entry.word}:${entry.intensifier}`;
  }
  return entry.word;
}

export const KeywordsManager = () => {
  const [keywords, setKeywords] = useState<KeywordEntry[]>([]);
  const [keyterms, setKeyterms] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newIntensifier, setNewIntensifier] = useState<number>(1);
  const [newKeyterm, setNewKeyterm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchAssistant();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchAssistant = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${VAPI_API}/assistant/${ASSISTANT_ID}`, {
        headers: { Authorization: `Bearer ${VAPI_KEY}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch assistant: ${res.status}`);
      const data = await res.json();

      const transcriber = data.transcriber || {};
      const rawKeywords: string[] = transcriber.keywords || [];
      const rawKeyterms: string[] = transcriber.keyterm || [];

      setKeywords(rawKeywords.map(parseKeyword));
      setKeyterms(rawKeyterms);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message || "Failed to load assistant config");
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${VAPI_API}/assistant/${ASSISTANT_ID}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VAPI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriber: {
            provider: "deepgram",
            model: "flux-general-en",
            language: "en",
            keywords: keywords.map(serializeKeyword),
            keyterm: keyterms,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to save: ${res.status} — ${body}`);
      }
      setHasChanges(false);
      setSuccess("Keywords saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    const word = newKeyword.trim();
    if (!word) return;
    if (keywords.some((k) => k.word.toLowerCase() === word.toLowerCase())) {
      setError("Keyword already exists");
      return;
    }
    setKeywords([...keywords, { word, intensifier: newIntensifier }]);
    setNewKeyword("");
    setNewIntensifier(1);
    setHasChanges(true);
    setError(null);
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const addKeyterm = () => {
    const term = newKeyterm.trim();
    if (!term) return;
    if (keyterms.some((k) => k.toLowerCase() === term.toLowerCase())) {
      setError("Keyterm already exists");
      return;
    }
    setKeyterms([...keyterms, term]);
    setNewKeyterm("");
    setHasChanges(true);
    setError(null);
  };

  const removeKeyterm = (index: number) => {
    setKeyterms(keyterms.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const filteredKeywords = keywords.filter((k) =>
    k.word.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredKeyterms = keyterms.filter((k) =>
    k.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary/40">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        <span className="font-bold">Loading transcription config...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">
            Transcription Keywords
          </h2>
          <p className="text-primary/40 text-sm font-medium">
            Train Deepgram to better recognize domain-specific words and phrases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <input
              type="text"
              placeholder="Filter keywords..."
              className="pl-10 pr-4 py-2 rounded-xl border border-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm w-64 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            className={cn(
              "rounded-xl shadow-lg transition-all",
              hasChanges
                ? "bg-secondary text-white hover:bg-secondary/90 shadow-secondary/20"
                : "bg-primary/10 text-primary/30"
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save to Vapi
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-2xl text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-600 px-5 py-3 rounded-2xl text-sm font-medium">
          {success}
        </div>
      )}

      {/* Keywords Section */}
      <div className="bg-white rounded-3xl border border-primary/5 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/5 text-primary">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Keywords</h3>
            <p className="text-xs text-primary/40 font-medium">
              Single words with optional weight (intensifier). Higher weight =
              stronger recognition.
            </p>
          </div>
        </div>

        {/* Examples hint */}
        <div className="mb-6 px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
          <p className="text-xs font-bold text-blue-500 mb-1.5">How it works</p>
          <p className="text-xs text-blue-400 leading-relaxed">
            Add single words the agent might mishear. Set a <span className="font-bold">weight from -10 to 10</span> to control recognition strength.
            Higher = more likely to be recognized. Negative = suppressed.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[11px] font-mono bg-white/80 border border-blue-100 text-blue-500 px-2 py-0.5 rounded-lg">RelayPay (weight: 5)</span>
            <span className="text-[11px] font-mono bg-white/80 border border-blue-100 text-blue-500 px-2 py-0.5 rounded-lg">Roxanne (weight: 3)</span>
            <span className="text-[11px] font-mono bg-white/80 border border-blue-100 text-blue-500 px-2 py-0.5 rounded-lg">IBAN (weight: 2)</span>
            <span className="text-[11px] font-mono bg-white/80 border border-blue-100 text-blue-500 px-2 py-0.5 rounded-lg">Naira (weight: 2)</span>
          </div>
          <span className="ml-auto text-xs font-bold text-primary/30 bg-primary/5 px-3 py-1 rounded-lg">
            {keywords.length} total
          </span>
        </div>

        {/* Add keyword form */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="e.g. RelayPay, Roxanne, IBAN..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm shadow-sm"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value.replace(/\s/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-primary/40 whitespace-nowrap">
              Weight:
            </label>
            <input
              type="number"
              min={-10}
              max={10}
              value={newIntensifier}
              onChange={(e) => setNewIntensifier(Number(e.target.value))}
              className="w-16 px-3 py-2.5 rounded-xl border border-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 text-sm text-center shadow-sm"
            />
          </div>
          <Button
            onClick={addKeyword}
            className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Keywords list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredKeywords.length === 0 ? (
            <p className="text-center text-primary/20 text-sm font-bold py-8">
              No keywords added yet
            </p>
          ) : (
            filteredKeywords.map((kw, idx) => {
              const originalIdx = keywords.indexOf(kw);
              return (
                <div
                  key={`${kw.word}-${idx}`}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/[0.02] border border-primary/5 hover:border-primary/15 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">
                      {kw.word}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-lg",
                        kw.intensifier && kw.intensifier > 1
                          ? "bg-green-100 text-green-600"
                          : kw.intensifier && kw.intensifier < 0
                            ? "bg-red-100 text-red-500"
                            : "bg-primary/5 text-primary/40"
                      )}
                    >
                      weight: {kw.intensifier ?? 1}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKeyword(originalIdx)}
                    className="opacity-0 group-hover:opacity-100 text-primary/30 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Keyterms Section */}
      <div className="bg-white rounded-3xl border border-primary/5 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Keyterms</h3>
            <p className="text-xs text-primary/40 font-medium">
              Multi-word phrases to boost recognition (no weight — just
              presence).
            </p>
          </div>
          <span className="ml-auto text-xs font-bold text-primary/30 bg-primary/5 px-3 py-1 rounded-lg">
            {keyterms.length} total
          </span>
        </div>

        {/* Examples hint */}
        <div className="mb-6 px-4 py-3 bg-purple-50/60 border border-purple-100 rounded-2xl">
          <p className="text-xs font-bold text-purple-500 mb-1.5">How it works</p>
          <p className="text-xs text-purple-400 leading-relaxed">
            Add multi-word phrases the agent should recognize better. Unlike keywords, keyterms don't have weights — just add the phrase as-is.
            Great for product names, compliance terms, or common caller requests.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[11px] font-mono bg-white/80 border border-purple-100 text-purple-500 px-2 py-0.5 rounded-lg">account number</span>
            <span className="text-[11px] font-mono bg-white/80 border border-purple-100 text-purple-500 px-2 py-0.5 rounded-lg">wire transfer</span>
            <span className="text-[11px] font-mono bg-white/80 border border-purple-100 text-purple-500 px-2 py-0.5 rounded-lg">PCI compliance</span>
            <span className="text-[11px] font-mono bg-white/80 border border-purple-100 text-purple-500 px-2 py-0.5 rounded-lg">callback time</span>
          </div>
        </div>

        {/* Add keyterm form */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="e.g. account number, wire transfer, PCI compliance..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm shadow-sm"
            value={newKeyterm}
            onChange={(e) => setNewKeyterm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyterm()}
          />
          <Button
            onClick={addKeyterm}
            className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Keyterms list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredKeyterms.length === 0 ? (
            <p className="text-center text-primary/20 text-sm font-bold py-8">
              No keyterms added yet
            </p>
          ) : (
            filteredKeyterms.map((term, idx) => {
              const originalIdx = keyterms.indexOf(term);
              return (
                <div
                  key={`${term}-${idx}`}
                  className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/[0.02] border border-primary/5 hover:border-primary/15 transition-all group"
                >
                  <span className="text-sm font-bold text-primary">{term}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKeyterm(originalIdx)}
                    className="opacity-0 group-hover:opacity-100 text-primary/30 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-secondary/5 border border-secondary/10 rounded-[2rem] p-8 flex items-center gap-6">
          <div className="p-4 bg-secondary/10 text-secondary rounded-2xl">
            <Volume2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
              Keywords
            </p>
            <h4 className="text-2xl font-bold text-primary">
              {keywords.length} Words
            </h4>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 flex items-center gap-6">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
              Keyterms
            </p>
            <h4 className="text-2xl font-bold text-primary">
              {keyterms.length} Phrases
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
