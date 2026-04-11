import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Linkedin, ExternalLink, ShieldCheck, Cpu, Code2, Globe, Zap, DollarSign } from "lucide-react";

export function DeveloperCreditsModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] bg-slate-950 text-white max-h-[95vh] flex flex-col">
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950">
             {/* Abstract mesh background */}
             <div className="absolute inset-0 opacity-20 pointer-events-none">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3B82F6,transparent_70%)]" />
               <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] rotate-12 grid grid-cols-12 gap-1 px-4 blur-[1px]">
                  {Array.from({length: 12*12}).map((_, i) => (
                     <div key={i} className="h-px w-full bg-blue-400/20" />
                  ))}
               </div>
             </div>
             
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/30 backdrop-blur-[2px]">
                <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-2xl mb-4 group transition-transform hover:scale-110">
                   <img 
                      src="/user_logo.jpg" 
                      alt="Developer Logo" 
                      className="w-full h-full object-cover rounded-xl scale-150" 
                   />
                </div>
                <DialogTitle className="text-3xl font-extrabold tracking-tight text-white mb-1">
                   Mathew Mabira
                </DialogTitle>
                <p className="text-blue-300/80 font-bold uppercase tracking-[0.2em] text-[10px]">
                   Lead Systems Architect
                </p>
             </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Engineering Vision
              </h4>
              <div className="relative group">
                 <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                 <p className="text-slate-200 leading-relaxed text-[16px] font-medium italic">
                   "I engineer systems where financial loss is technically impossible through absolute digital visibility."
                 </p>
              </div>
              <p className="text-slate-300 leading-relaxed text-[14px]">
                Mathew is a specialized software engineer and the architect behind **Limitless Money Junction Track**. 
                He has transformed the complex Zimbabwean agent banking landscape into a unified, high-integrity dashboard, 
                enabling agents to protect their capital across all providers simultaneously.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-emerald-500 uppercase tracking-widest flex items-center gap-2 text-center justify-center py-2 border-y border-white/5">
                <ShieldCheck className="h-4 w-4" /> Technical Mastery Deck
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {[
                   { label: "Systems Architecture", icon: Cpu, color: "text-blue-400", bg: "bg-blue-500/10" },
                   { label: "Financial Engineering", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                   { label: "Security Logic", icon: ShieldCheck, color: "text-orange-400", bg: "bg-orange-500/10" },
                   { label: "Frontend Excellence", icon: Globe, color: "text-purple-400", bg: "bg-purple-500/10" },
                 ].map((skill, i) => (
                   <div key={i} className={`p-4 rounded-2xl border border-white/5 ${skill.bg} flex flex-col items-center text-center gap-3 group hover:scale-105 transition-all`}>
                      <div className={`p-2.5 rounded-xl bg-black/40 ${skill.color}`}>
                         <skill.icon className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] font-extrabold uppercase tracking-tight text-white leading-tight">
                         {skill.label}
                      </p>
                   </div>
                 ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4" /> Core Innovations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 {[
                   { label: "Zero-Loss Engine", desc: "Automated sub-cent reconciliation.", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                   { label: "Omni-Hub Analytics", desc: "Cross-provider liquidity tracking.", color: "text-blue-400", bg: "bg-blue-500/10" },
                   { label: "Guardian Logic", desc: "Real-time fraud & smurfing alerts.", color: "text-orange-400", bg: "bg-orange-500/10" },
                 ].map((inn, i) => (
                   <div key={i} className={`p-3.5 rounded-xl border border-slate-800 ${inn.bg} space-y-1.5 hover:border-slate-700 transition-colors`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${inn.color}`}>{inn.label}</p>
                      <p className="text-[11px] text-slate-400 leading-tight">{inn.desc}</p>
                   </div>
                 ))}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 space-y-6">
               <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                 <Globe className="h-4 w-4" /> Professional Portals
               </h4>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a 
                     href="https://www.linkedin.com/in/mathew-mabira-24861632b" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center gap-4 p-4 rounded-2xl bg-blue-600/5 border border-blue-500/20 hover:bg-blue-600/10 hover:border-blue-500/40 transition-all group"
                  >
                     <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Linkedin className="h-6 w-6 text-white" />
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Mathew Mabira</p>
                        <p className="text-[11px] text-slate-400">Professional LinkedIn</p>
                     </div>
                     <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                  </a>

                  <a 
                     href="https://github.com/sammy2324mathy" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                     <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center shadow-lg border border-slate-700">
                        <Code2 className="h-6 w-6 text-white" />
                     </div>
                     <div className="flex-1">
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Open Source</p>
                        <p className="text-[11px] text-slate-400">GitHub Portfolio</p>
                     </div>
                     <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                  </a>
               </div>
               
               <Button 
                  onClick={() => window.open("https://www.linkedin.com/in/mathew-mabira-24861632b", "_blank")}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-extrabold text-base transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/40 border border-blue-400/20"
               >
                  Connect on LinkedIn
               </Button>
            </div>
            
            <div className="pb-4 text-center">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] opacity-40">
                  Limitless Junction Track · Engineering Excellence by Mathew Mabira
               </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
