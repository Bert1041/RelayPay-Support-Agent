import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase";
import { 
  FileText, 
  Database, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Layers
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface DocumentMetadata {
  id: string;
  title: string;
  count_chunks: number;
  status: "synced" | "processing" | "error";
  uploaded_at: string;
  size?: string;
}

const MOCK_DOCS: DocumentMetadata[] = [
  { id: "d1", title: "General Banking Terms.pdf", count_chunks: 156, status: "synced", uploaded_at: new Date().toISOString(), size: "1.2 MB" },
  { id: "d2", title: "Escalation Protocols v2.docx", count_chunks: 42, status: "synced", uploaded_at: new Date().toISOString(), size: "450 KB" },
  { id: "d3", title: "International Transfer Limits.pdf", count_chunks: 0, status: "processing", uploaded_at: new Date().toISOString(), size: "2.1 MB" },
];

export const KnowledgeBaseView = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>(MOCK_DOCS);
  const [, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchKnowledgeBase = async () => {
    setLoading(true);
    try {
      // Assuming 'documents' table exists
      const { data: docs } = await supabase.from("documents").select("*");
      // Getting chunk counts would normally be a separate query or join
      if (docs && docs.length > 0) {
        setDocuments(docs.map(d => ({
          ...d,
          count_chunks: d.count_chunks || 0,
          status: d.status || 'synced',
          uploaded_at: d.uploaded_at || d.created_at
        })));
      }
    } catch (err) {
      console.warn("Using mock KB data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (hasConfig) fetchKnowledgeBase();
  }, []);

  const filteredDocs = documents.filter(doc => 
    (doc.title?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Knowledge Base</h2>
          <p className="text-primary/40 text-sm font-medium">Manage documents and vector embeddings.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 rounded-xl border border-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm w-64 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Upload Doc
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white p-5 rounded-3xl border border-primary/5 shadow-sm hover:border-primary/20 transition-all group flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-primary/[0.03] text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary mb-1">{doc.title}</h3>
                <div className="flex items-center gap-4 text-xs font-bold text-primary/40 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Database className="w-4 h-4" />
                    {doc.count_chunks} Chunks
                  </span>
                  <span>{doc.size || 'N/A'}</span>
                  <span className={cn(
                    "flex items-center gap-1",
                    doc.status === 'synced' ? "text-secondary" : "text-amber-500"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", doc.status === 'synced' ? "bg-secondary" : "bg-amber-500")} />
                    {doc.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-primary/30 hover:text-primary">
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary/30 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-primary/30 hover:text-primary ml-2">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* KB Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="bg-secondary/5 border border-secondary/10 rounded-[2rem] p-8 flex items-center gap-6">
          <div className="p-4 bg-secondary/10 text-secondary rounded-2xl">
             <Layers className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Total Embeddings</p>
            <h4 className="text-2xl font-bold text-primary">12,482 Vector Chunks</h4>
          </div>
        </div>
        
        <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 flex items-center gap-6">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
             <Database className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">KB Sync Status</p>
            <h4 className="text-2xl font-bold text-primary">98% Synchronized</h4>
          </div>
        </div>
      </div>
    </div>
  );
};
