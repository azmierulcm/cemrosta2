import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-40 pb-32">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-6 font-mono">
          // OPERATIONAL STANDARDS
        </div>
        <h1 className="text-5xl font-bold text-text tracking-tighter mb-12">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-12 text-text-muted font-medium leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-text mb-4 tracking-tight">1. Acceptable Use</h2>
            <p>
              Cemrosta is built for airline crew members. You agree to use the service only for personal, non-commercial purposes. Do not attempt to reverse engineer the parser or scrape data from the marketplace.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text mb-4 tracking-tight">2. Marketplace Conduct</h2>
            <p>
              The marketplace is a classifieds platform. Cemrosta does not process payments or verify items. You use the marketplace at your own risk. We reserve the right to remove any listing for any reason.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text mb-4 tracking-tight">3. Disclaimer of Liability</h2>
            <p>
              Cemrosta is provided "as is". We are not responsible for errors in calendar synchronization, missed flights, or inaccuracies in the destination passport. Always verify your roster with your airline's official system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-text mb-4 tracking-tight">4. Account Suspension</h2>
            <p>
              We reserve the right to suspend accounts that violate these terms, specifically those engaging in fraud on the marketplace or attempting to disrupt the service.
            </p>
          </section>

          <section className="pt-12 border-t border-border">
            <p className="text-sm font-mono uppercase tracking-widest text-text-subtle">
              Last updated: May 15, 2026
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
