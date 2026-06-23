import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { AmbientLayer } from '../components/AmbientLayer';
import { GlobalUsageBoard } from '../lib/global-stats';
import type { Page } from '../App';

export function Layout({
  page,
  navigate,
  children,
}: {
  page: Page;
  navigate: (to: Page) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Global ambient atmosphere: film grain, bokeh, stars */}
      <AmbientLayer />
      <NavBar page={page} navigate={navigate} />
      {/* Consistent offset below the fixed NavBar (matches NavBar height) */}
      <main className="flex-1 relative z-10 pt-[64px] sm:pt-[70px]">
        {children}
      </main>
      <GlobalUsageBoard />
      <Footer navigate={navigate} />
    </div>
  );
}
