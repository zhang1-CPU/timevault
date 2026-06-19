import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { AmbientLayer } from '../components/AmbientLayer';
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
      {/* pt-[72px] sm:pt-[80px] 预留顶部 NavBar 高度，避免在移动端被 fixed NavBar 覆盖 */}
      <main className="flex-1 relative z-10 pt-[72px] sm:pt-[80px]">
        {children}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}
