import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import DonationSection from "./DonationSection";

// Dedicated Donations page — reachable from the "Donate" nav link on every
// page (home, stats, privacy, etc.). Reuses the home-page donation section so
// there's a single source of truth for the donate UI.
const DonationsPage: React.FC = () => {
  useEffect(() => {
    document.title = "The Wall Project - Donate";
  }, []);

  return (
    <div className="App">
      <Header />
      <div className="pt-24 md:pt-28">
        <DonationSection />
      </div>
      <Footer />
    </div>
  );
};

export default DonationsPage;
