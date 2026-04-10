import { useState, useEffect } from "react";
import { supabase } from "@/shared/lib/supabase";
import {
  FileText,
  Database,
  Search,
  ChevronRight,
  Layers,
  X,
  Copy,
  Clock,
  RefreshCw,
  FolderOpen,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

interface KBChunk {
  id: string;
  content: string;
  metadata: any;
  created_at: string;
}

interface DocumentMetadata {
  id: string;
  drive_id: string;
  filename: string;
  drive_modified_at: string | null;
  last_synced_at: string | null;
}

const MOCK_DOCS: DocumentMetadata[] = [
  { 
    id: "d1", 
    drive_id: "1abc_DRIVE_ID_EXAMPLE", 
    filename: "General Banking Terms.pdf", 
    drive_modified_at: new Date(Date.now() - 86400000).toISOString(), 
    last_synced_at: new Date().toISOString() 
  },
  { 
    id: "d2", 
    drive_id: "2xyz_DRIVE_ID_EXAMPLE", 
    filename: "Escalation Protocols v2.docx", 
    drive_modified_at: new Date(Date.now() - 172800000).toISOString(), 
    last_synced_at: new Date(Date.now() - 3600000).toISOString() 
  },
];

const GDRIVE_FOLDER_ID = "1q-rnaBEpJDTza9eJAAS86cFYJk0Ymac2";
const GDRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GDRIVE_FOLDER_ID}`;

export const KnowledgeBaseView = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>(MOCK_DOCS);
  const [, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [chunks, setChunks] = useState<KBChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fetchKnowledgeBase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("filename", { ascending: true });
      
      if (error) throw error;

      if (data && data.length > 0) {
        setDocuments(data.map(d => ({
          id: d.id,
          drive_id: d.drive_id,
          filename: d.filename,
          drive_modified_at: d.drive_modified_at,
          last_synced_at: d.last_synced_at
        })));
      }
    } catch (err) {
      console.warn("Using mock KB data:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("https://cohort2pod2.app.n8n.cloud/webhook/sync-folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderId: GDRIVE_FOLDER_ID,
          triggeredBy: "admin-dashboard",
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error("Cloud sync failed");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchKnowledgeBase();
      
      // SHOW SUCCESS TOAST
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (err) {
      console.error("Sync Error:", err);
      await fetchKnowledgeBase();
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchChunks = async (doc: DocumentMetadata) => {
    setLoadingChunks(true);
    setSelectedDoc(doc);
    try {
      // Confirmed metadata structure: doc_id stores the reference
      const { data, error } = await supabase
        .from("kb_chunks")
        .select("*")
        .eq("metadata->>doc_id", doc.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChunks(data || []);
    } catch (err) {
      console.warn("Using dummy chunks for UI demo:", err);
      setChunks([
        { id: "c1", content: `Chunk from ${doc.filename}: ...Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...`, created_at: new Date().toISOString(), metadata: { loc: { lines: { from: 51, to: 52 } } } },
        { id: "c2", content: "...Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...", created_at: new Date().toISOString(), metadata: { loc: { lines: { from: 105, to: 108 } } } },
        { id: "c3", content: "...Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...", created_at: new Date().toISOString(), metadata: { pdf: { totalPages: 3 } } },
      ]);
    } finally {
      setLoadingChunks(false);
    }
  };

  useEffect(() => {
    const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (hasConfig) fetchKnowledgeBase();
  }, []);

  const filteredDocs = documents.filter(doc => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (doc.filename?.toLowerCase() || "").includes(query) ||
      (doc.drive_id?.toLowerCase() || "").includes(query) ||
      (doc.id?.toLowerCase() || "").includes(query)
    );
  });

  const filteredChunks = chunks.filter(chunk => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (chunk.content?.toLowerCase() || "").includes(query) ||
      (chunk.id?.toLowerCase() || "").includes(query)
    );
  });

  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-primary">Knowledge Base</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/10 border border-secondary/20 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">GDRIVE CONNECTED</span>
            </div>
          </div>
          <p className="text-primary/40 text-sm font-medium italic">Repository ID: {GDRIVE_FOLDER_ID.substring(0, 12)}...</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
            <input
              type="text"
              placeholder={selectedDoc ? "Search within chunks..." : "Search filename or ID..."}
              className="pl-10 pr-10 py-2 rounded-xl border border-primary/10 bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all text-sm w-72 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-primary/5 rounded-full text-primary/30 hover:text-primary transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1 bg-primary/[0.03] p-1 rounded-2xl border border-primary/5 shadow-inner">
            <Button 
              onClick={() => window.open(GDRIVE_FOLDER_URL, '_blank')}
              className="rounded-xl bg-white text-primary hover:bg-primary/5 border border-primary/10 shadow-sm text-xs font-bold gap-2 px-4"
            >
              <FolderOpen className="w-4 h-4 text-secondary" />
              OPEN DRIVE
            </Button>
            <Button 
              onClick={triggerSync}
              disabled={isSyncing}
              className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-bold gap-2 px-4 min-w-[120px]"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              {isSyncing ? "SYNCING..." : "SYNC AI"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed border-primary/10">
            <Database className="w-12 h-12 text-primary/10 mx-auto mb-4" />
            <p className="text-primary/40 font-bold uppercase tracking-widest text-xs">No documents found</p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => fetchChunks(doc)}
              className="bg-white p-6 rounded-3xl border border-primary/5 shadow-sm hover:border-primary/20 transition-all group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-secondary/[0.05] text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary mb-1">{doc.filename}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-primary/40 uppercase tracking-widest">
                    <span className="flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-lg text-[9px] text-primary/60 border border-primary/10">
                      ID: {doc.drive_id.substring(0, 12)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Modified {formatRelativeDate(doc.drive_modified_at)}
                    </span>
                    <span className="flex items-center gap-1 text-secondary">
                      <Database className="w-3 h-3" />
                      Synced {formatRelativeDate(doc.last_synced_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary/30 group-hover:text-primary transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Success Toast */}
      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-500">
           <div className="bg-primary text-white px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 border border-white/10 ring-4 ring-primary/5">
              <div className="p-1.5 bg-secondary text-white rounded-full">
                 <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="font-bold text-sm tracking-tight">Sync Handshake Successful</p>
           </div>
        </div>
      )}

      {/* Chunk Inspector Drawer */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-in fade-in transition-all" onClick={() => setSelectedDoc(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right-full duration-500 flex flex-col">
            <div className="p-8 border-b border-primary/5 flex items-center justify-between bg-primary/[0.02]">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="w-5 h-5 text-secondary" />
                  <h3 className="text-xl font-bold text-primary">{selectedDoc.filename}</h3>
                </div>
                <p className="text-xs font-bold text-primary/40 uppercase tracking-widest">Vector Chunk Inspector</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/5" onClick={() => setSelectedDoc(null)}>
                <X className="w-6 h-6 text-primary/40" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-8">
              {loadingChunks ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-primary/20">
                   <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                   <p className="font-bold text-sm uppercase tracking-widest italic">Analyzing vector space...</p>
                </div>
              ) : filteredChunks.length === 0 ? (
                <div className="text-center py-20 opacity-30 italic">
                  {searchQuery ? "No chunks matching your search." : "No vector chunks found mapped to this document ID."}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredChunks.map((chunk, idx) => (
                    <div key={chunk.id} className="group relative bg-primary/[0.01] border border-primary/5 p-6 rounded-3xl hover:bg-white hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                      <div className="absolute -left-3 top-6 w-8 h-8 rounded-full bg-white border border-primary/10 flex items-center justify-center text-[10px] font-bold text-primary/40 shadow-sm group-hover:bg-secondary group-hover:text-white group-hover:border-secondary transition-all">
                        {idx + 1}
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded-lg">Chunk ID: {chunk.id.substring(0, 8)}</span>
                          {chunk.metadata?.loc?.lines && (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 flex items-center gap-1">
                              Lines {chunk.metadata.loc.lines.from}-{chunk.metadata.loc.lines.to}
                            </span>
                          )}
                          {chunk.metadata?.pdf?.totalPages && (
                            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                              PDF ({chunk.metadata.pdf.totalPages} pages)
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard.writeText(chunk.content)}>
                          <Copy className="w-4 h-4 text-primary/40" />
                        </Button>
                      </div>
                      <p className="text-primary text-sm leading-relaxed font-medium">
                        {chunk.content}
                      </p>
                      <div className="mt-4 pt-4 border-t border-primary/[0.03] flex items-center justify-between">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-primary/30 uppercase tracking-tighter">
                            <Clock className="w-3 h-3" />
                            Processed {formatRelativeDate(chunk.created_at)}
                         </div>
                         <Button variant="link" className="text-[10px] font-bold text-secondary p-0 h-auto">VIEW EMBEDDING</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <div className="p-8 border-t border-primary/5 bg-primary/[0.01] flex items-center justify-between">
               <div className="text-xs font-bold text-primary/40 uppercase tracking-widest">
                  Total Chunks: <span className="text-primary">{chunks.length}</span>
               </div>
               <Button className="rounded-xl bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20">
                  RE-INDEX DOC
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* KB Sync Architecture Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="bg-secondary/5 border border-secondary/10 rounded-[2rem] p-8 flex items-center gap-6">
          <div className="p-4 bg-secondary/10 text-secondary rounded-2xl">
             <Layers className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Knowledge Engine</p>
            <h4 className="text-xl font-bold text-primary">Google Drive Sync</h4>
            <p className="text-xs text-primary/40 font-medium">Automatic context extraction enabled</p>
          </div>
        </div>
        
        <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 flex items-center gap-6">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
             <Database className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">Vector Freshness</p>
            <h4 className="text-xl font-bold text-primary">Last Refresh: {formatRelativeDate(documents[0]?.last_synced_at)}</h4>
            <p className="text-xs text-primary/40 font-medium">{documents.length} Files Indexed</p>
          </div>
        </div>
      </div>
    </div>
  );
};
