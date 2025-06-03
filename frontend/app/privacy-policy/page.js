import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center border-b">
            <h1 className="text-3xl font-bold text-foreground">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-8 text-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                1. Introduction
              </h2>
              <p>
                This Privacy Policy describes how UrTest ("we", "our", or "us")
                collects, uses, and protects your information when you use our
                Jira integration application.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                2. Information We Collect
              </h2>
              <p className="mb-3">
                UrTest may collect the following information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Jira Account Information:</strong> Basic account
                  details necessary for authentication
                </li>
                <li>
                  <strong>Project Data:</strong> Information about Jira
                  projects, issues, and workflows that you choose to connect
                  with UrTest
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you
                  interact with our application
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                3. How We Use Your Information
              </h2>
              <p className="mb-3">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain our service functionality</li>
                <li>Authenticate your access to Jira</li>
                <li>Process and display Jira data as requested by you</li>
                <li>Improve our application performance and user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                4. Data Storage and Security
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We do not store your Jira credentials</li>
                <li>
                  Authentication is handled through secure OAuth 2.0 protocols
                </li>
                <li>
                  Any data processed is handled securely and in accordance with
                  industry standards
                </li>
                <li>
                  We do not retain personal data for longer than 24 hours unless
                  explicitly necessary for service functionality
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                5. Data Sharing
              </h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal
                information to third parties without your consent, except as
                described in this policy or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                6. Third-Party Services
              </h2>
              <p>
                Our application integrates with Atlassian Jira. Please review
                Atlassian's privacy policy for information about how they handle
                your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                7. User Rights
              </h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of incorrect information</li>
                <li>Request deletion of your personal information</li>
                <li>
                  Revoke access permissions at any time through your Jira
                  settings
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                8. Data Retention
              </h2>
              <p>
                We retain your information only as long as necessary to provide
                our services or as required by applicable law. You can
                disconnect UrTest from your Jira instance at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                9. Children's Privacy
              </h2>
              <p>
                Our service is not directed to individuals under the age of 13.
                We do not knowingly collect personal information from children
                under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                10. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify users of any material changes by posting the new Privacy
                Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground border-b border-border pb-2">
                11. Compliance
              </h2>
              <p>
                This Privacy Policy is designed to comply with applicable data
                protection regulations, including GDPR where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                12. Contact Us
              </h2>
              <p className="mb-3">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong> dong.tt@urbox.vn
                </p>
                <p>
                  <strong>Website:</strong> https://urtest.click
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
