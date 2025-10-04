import Email from '@/pages/Email';

/**
 * Standalone Webmail Page
 * 
 * Dedicated route for email functionality
 * Accessible at: /webmail
 * 
 * Full-page email interface (not embedded in dashboard)
 * No sidebar, no navigation - pure email client
 */
export default function WebmailPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <Email />
    </div>
  );
}

