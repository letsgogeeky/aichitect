import Link from "next/link";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description: "How AIchitect collects, uses, and protects your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <nav
        className="flex items-center gap-1.5 text-xs mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        <Link href="/" className="hover:underline">
          AIchitect
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>Privacy Policy</span>
      </nav>

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        Privacy Policy
      </h1>
      <p className="text-xs mb-10" style={{ color: "var(--text-muted)" }}>
        Last updated: March 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            1. Who we are
          </h2>
          <p>
            AIchitect (<strong>aichitect.dev</strong>) is a tool discovery and stack-building
            platform for AI developers. This policy explains what personal data we collect, why we
            collect it, and your rights under applicable data protection law including the EU
            General Data Protection Regulation (GDPR).
          </p>
          <p className="mt-2">
            For data-related requests, contact us at:{" "}
            <a href="mailto:privacy@aichitect.dev" style={{ color: "var(--accent)" }}>
              privacy@aichitect.dev
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            2. What we collect
          </h2>
          <p>When you sign in with GitHub OAuth, we receive and store:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>GitHub username</li>
            <li>GitHub user ID</li>
            <li>Avatar URL (your GitHub profile picture URL)</li>
          </ul>
          <p className="mt-3">When you interact with the product, we store:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>
              Tool usage selections — the tools you mark as &quot;I use this&quot;, along with a
              timestamp
            </li>
          </ul>
          <p className="mt-3">
            We do not collect email addresses, passwords, browsing history, or any data beyond what
            is listed above.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            3. Why we collect it
          </h2>
          <ul className="space-y-1 pl-4 list-disc">
            <li>
              <strong>Authentication</strong> — to identify you across sessions via GitHub OAuth
            </li>
            <li>
              <strong>Personalisation</strong> — to display your tool badge wall at{" "}
              <code>/profile/[username]</code> and surface usage counts on tools
            </li>
          </ul>
          <p className="mt-3">
            Our lawful basis for processing is <strong>legitimate interests</strong> (providing the
            service you signed up for). No data is sold or used for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            4. How long we keep it
          </h2>
          <p>
            Your data is retained for as long as your account exists. Deleting your account
            permanently removes all stored data — see section 6.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            5. Sub-processors
          </h2>
          <p>We use the following third-party services to operate AIchitect:</p>
          <ul className="mt-2 space-y-2 pl-4 list-disc">
            <li>
              <strong>Supabase</strong> — database and authentication. Your profile and tool usage
              data is stored in a Supabase-managed PostgreSQL instance. Supabase acts as a data
              processor under a signed DPA.{" "}
              <a
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                Supabase Privacy Policy ↗
              </a>
            </li>
            <li>
              <strong>Vercel</strong> — application hosting and edge network. All HTTP traffic,
              including OAuth callbacks, passes through Vercel infrastructure.{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
              >
                Vercel Privacy Policy ↗
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            6. Your rights
          </h2>
          <p>Under GDPR you have the right to:</p>
          <ul className="mt-2 space-y-1 pl-4 list-disc">
            <li>
              <strong>Access</strong> — request a copy of the data we hold about you
            </li>
            <li>
              <strong>Rectification</strong> — ask us to correct inaccurate data
            </li>
            <li>
              <strong>Erasure</strong> — delete your account and all associated data at any time
              from your{" "}
              <Link href="/profile" style={{ color: "var(--accent)" }}>
                profile page
              </Link>
            </li>
            <li>
              <strong>Portability</strong> — request your data in a machine-readable format
            </li>
            <li>
              <strong>Object</strong> — object to processing based on legitimate interests
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@aichitect.dev" style={{ color: "var(--accent)" }}>
              privacy@aichitect.dev
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            7. Cookies
          </h2>
          <p>
            We use a single session cookie set by Supabase Auth to keep you signed in. This cookie
            is strictly necessary for the service to function and does not require consent under
            GDPR or the ePrivacy Directive.
          </p>
          <p className="mt-2">
            We do not use analytics cookies, advertising cookies, or tracking pixels.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            8. Changes to this policy
          </h2>
          <p>
            If we make material changes we will update the date at the top of this page. Continued
            use of the service after a change constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  );
}
