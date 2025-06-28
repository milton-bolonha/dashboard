"use client";

import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your dashboard preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Database">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clean up unused data and optimize performance.
            </p>
            <Button variant="secondary">Clean Database</Button>
          </div>
        </Card>

        <Card title="Backup">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Export your content types and sections.
            </p>
            <Button variant="secondary">Export Data</Button>
          </div>
        </Card>

        <Card title="API Keys">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage API access for external integrations.
            </p>
            <Button variant="secondary">Generate API Key</Button>
          </div>
        </Card>

        <Card title="Danger Zone">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reset all data. This action cannot be undone.
            </p>
            <Button
              variant="secondary"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900"
            >
              Reset Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
