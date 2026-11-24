import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#121418] text-[#EFF0F1] flex flex-col">
      <div className="h-[2px] w-full bg-[#FF5A1F]" aria-hidden="true" />
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="hud-frame relative max-w-xl w-full bg-[#161920] border border-[#3B4252] p-8 md:p-10 signal-grid space-y-6">
          <div className="flex items-center justify-between font-mono text-xs text-[#FF9F38] pb-4 border-b border-[#2B303B]">
            <span className="inline-flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>SIGNAL LOST // 404</span>
            </span>
            <span className="text-[#9499A3]">ROUTE NOT FOUND</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#EFF0F1] leading-tight">
            No live channel at this frequency.
          </h1>

          <p className="text-sm text-[#C4C8D0] leading-relaxed">
            The route you requested does not exist inside Signal Room. Return to the main console to
            explore OpenCalls, Voice Lab, engineering writing, or speak with Istekhar&apos;s AI
            voice representative.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="hud-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5A1F] text-[#121418] font-semibold text-sm hover:bg-[#ff6d38]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Signal Room</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
