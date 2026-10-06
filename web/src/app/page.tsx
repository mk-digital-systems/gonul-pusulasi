import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { ForWhom } from "@/components/for-whom";
import { HowItWorks } from "@/components/how-it-works";
import { MeetingCulture } from "@/components/meeting-culture";
import { WhyDifferent } from "@/components/why-different";
import { SafetyPrivacy } from "@/components/safety-privacy";
import { CompassTest } from "@/components/compass-test";
import { EarlyAccess } from "@/components/early-access";
import { Faq } from "@/components/faq";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ForWhom />
        <HowItWorks />
        <MeetingCulture />
        <WhyDifferent />
        <SafetyPrivacy />
        <CompassTest />
        <EarlyAccess />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
