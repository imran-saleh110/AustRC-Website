import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { useTokens } from '@/tokens/useTokens';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { ActivitiesPage } from './components/ActivitiesPage';
import { GoverningPanelPage } from './components/GoverningPanelPage';
import { HallOfFamePage } from './components/HallOfFamePage';
import { ResearchProjectsPage } from './components/ResearchProjectsPage';
import { ProjectDetailPage } from './components/ProjectDetailPage';
import { AboutPage } from './components/AboutPage';
import { EnthusiastAcquisitionPage } from './components/EnthusiastAcquisitionPage';
import { DevelopersPage } from './components/DevelopersPage';
import { AppDownloadPage } from './components/AppDownloadPage';
import { Footer } from './components/Footer';
import { CursorGlow } from './components/CursorGlow';
import { ContactPage } from './components/ContactPage';
import { FindAustrcIdPage } from './components/FindAustrcIdPage';
import NoticesPage from './components/NoticesPage';
// Sub-Pages
import { EventsPage } from './components/activities/EventsPage';
import { AchievementsPage } from './components/activities/AchievementsPage';
import { SocialActivitiesPage } from './components/activities/SocialActivitiesPage';
import { EducationalActivitiesPage } from './components/activities/EducationalActivitiesPage';
import { EventWebsitePage } from './components/activities/EventWebsitePage';
import { EventDetailPage } from './components/activities/EventDetailPage';
import { AchievementDetailPage } from './components/activities/AchievementDetailPage';

// ✅ THIS IMPORT IS VITAL
import { ActivityDetailPage } from './components/activities/ActivityDetailPage';
import { OtherActivitiesPage } from './components/activities/OtherActivitiesPage';
import { OtherActivityDetailPage } from './components/activities/OtherActivityDetailPage';
import { CollaborationsPage } from './components/CollaborationsPage';
import { SponsorsPage } from './components/SponsorsPage';
import JourneyPage from './components/Journeypage';
import { BatchRepresentativePage } from './components/BatchRepresentativePage';
import { AdminPage } from './components/admin/AdminPage';


// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Main site layout (with Navbar + Footer)
function SiteLayout() {
  const location = useLocation();
  const t = useTokens();
  const isAboutPage = location.pathname === '/about';

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ backgroundColor: t.pageBg }}>
      <ScrollToTop />
      <CursorGlow />
      <Navbar />
      <div className="pb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/events" element={<EventsPage />} />
          <Route path="/activities/events/:eventSlug" element={<EventDetailPage />} />
          <Route path="/activities/achievements" element={<AchievementsPage />} />
          <Route path="/activities/social-activities" element={<SocialActivitiesPage />} />
          <Route path="/activities/educational-activities" element={<EducationalActivitiesPage />} />
          <Route path="/activities/event-website" element={<EventWebsitePage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/collaborations" element={<CollaborationsPage />} />
          <Route path="/activities/achievements/:achievementSlug" element={<AchievementDetailPage />} />
          <Route path="/activities/other-activities" element={<OtherActivitiesPage />} />
          <Route path="/activities/other-activities/:slug" element={<OtherActivityDetailPage />} />
          {/* ✅ THE DYNAMIC ROUTE FOR DETAIL PAGES */}
          <Route path="/activity/:category/:id" element={<ActivityDetailPage />} />

          <Route path="/about" element={<AboutPage />} />
          <Route path="/enthusiast-acquisition" element={<EnthusiastAcquisitionPage />} />
          <Route path="/research-projects" element={<ResearchProjectsPage />} />
          <Route path="/research-projects/:projectSlug" element={<ProjectDetailPage />} />
          {/* Hall of Fame Route */}
          <Route path="/hall-of-fame" element={<HallOfFamePage />} />
          {/* Dynamic Route for Governing Panel (Semesters) */}
          <Route path="/governing-panel/:panelId" element={<GoverningPanelPage />} />

          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/get-app" element={<AppDownloadPage />} />
          <Route path="/find-austrc-id" element={<FindAustrcIdPage />} />
          <Route path="/website-journey" element={<JourneyPage />} />
          <Route path="/batch-representative" element={<BatchRepresentativePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isAboutPage && <Footer />}
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      {/* Admin panel — completely isolated, no Navbar/Footer */}
      <Route path="/admin" element={<AdminPage />} />
      {/* All other routes go through the main site layout */}
      <Route path="/*" element={<SiteLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
