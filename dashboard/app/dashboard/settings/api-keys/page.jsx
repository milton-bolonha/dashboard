import { ApiKeyManager } from "@/components/api-keys/ApiKeyManager";

export default function ApiKeysPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Keys</h1>
          <p className="text-gray-600">
            Gerencie suas chaves de API para acessar dados públicos das suas
            sections.
          </p>
        </div>

        <ApiKeyManager />
      </div>
    </div>
  );
}
