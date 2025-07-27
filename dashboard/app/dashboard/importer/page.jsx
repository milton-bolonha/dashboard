"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";
import FileSelectionInterface from "@/components/importer/FileSelectionInterface";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";

const ImporterPage = () => {
  const { isSignedIn, user } = useAuth();
  const router = useRouter();
  const {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    createWorkspace,
    loading: workspaceLoading,
  } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [importPath, setImportPath] = useState("");
  const [importPlan, setImportPlan] = useState(null);
  const [showExecute, setShowExecute] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Estados para seleção interativa
  const [availableFiles, setAvailableFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showSelection, setShowSelection] = useState(false);

  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const handleFolderSelect = (event) => {
    const files = event.target.files;
    console.log("DEBUG - Arquivos selecionados:", files);

    if (files.length > 0) {
      // Pegar o caminho da pasta selecionada
      const firstFile = files[0];
      console.log("DEBUG - Primeiro arquivo:", firstFile);
      console.log("DEBUG - firstFile.path:", firstFile.path);
      console.log(
        "DEBUG - firstFile.webkitRelativePath:",
        firstFile.webkitRelativePath
      );
      console.log("DEBUG - firstFile.name:", firstFile.name);

      let folderPath = "";

      // Tentar obter o caminho completo
      if (firstFile.path) {
        // Chrome/Edge - path contém o caminho completo
        folderPath = firstFile.path.substring(
          0,
          firstFile.path.lastIndexOf("\\")
        );
        console.log("DEBUG - Caminho extraído do path:", folderPath);
      } else if (firstFile.webkitRelativePath) {
        // Firefox - reconstruir o caminho
        const relativePath = firstFile.webkitRelativePath;
        const pathParts = relativePath.split("/");
        pathParts.pop(); // Remove o nome do arquivo
        folderPath = pathParts.join("/");
        console.log(
          "DEBUG - Caminho extraído do webkitRelativePath:",
          folderPath
        );
      }

      // O webkitdirectory só fornece o nome da pasta, não o caminho completo
      // Vamos usar isso como base e pedir ao usuário para completar
      const relativePath = firstFile.webkitRelativePath;
      const folderName = relativePath.split("/")[0];

      console.log("DEBUG - Nome da pasta selecionada:", folderName);

      // Usar o caminho completo se disponível, senão usar o nome da pasta
      if (folderPath) {
        setImportPath(folderPath);
        setMessage(`✅ Pasta selecionada: ${folderPath}`);
      } else {
        setImportPath(folderName);
        setMessage(
          `✅ Pasta "${folderName}" selecionada! 
          
          ⚠️ Por questões de segurança do navegador, o caminho completo não foi capturado automaticamente.
          
          📝 Por favor, edite o campo acima para incluir o caminho completo, por exemplo:
          C:\\Users\\milto\\Documents\\dash\\gatsby-landing\\content
          
          💡 Dica: Você pode copiar o caminho do Windows Explorer e colar aqui.`
        );
      }

      console.log("DEBUG - Caminho base definido:", folderName);
    }
  };

  const handleAnalyze = async () => {
    if (!importPath.trim()) {
      setMessage("Por favor, forneça um caminho válido.");
      return;
    }

    if (!currentWorkspace) {
      setMessage("Erro: Nenhum workspace selecionado");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const requestBody = {
        importPath: importPath.trim(),
        workspaceId: currentWorkspace._id,
      };

      console.log("DEBUG - Frontend enviando:", requestBody);
      console.log("DEBUG - importPath.trim():", importPath.trim());
      console.log("DEBUG - currentWorkspace:", currentWorkspace);

      const response = await fetch("/api/importer/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na análise");
      }

      const data = await response.json();
      console.log("Plano de importação:", data.importPlan);

      setImportPlan(data.importPlan);

      // Preparar arquivos para seleção
      const files = [];

      // Adicionar sections primeiro (pastas e arquivos da raiz)
      data.importPlan.sections.forEach((section, index) => {
        files.push({
          id: `section-${section.slug}-${index}`,
          name: section.name,
          type: "section",
          path: section.description.replace("Section importada de ", ""),
          data: section,
        });
      });

      // Adicionar items depois (arquivos dentro das pastas)
      data.importPlan.items.forEach((item, index) => {
        files.push({
          id: `item-${item.slug}-${index}`, // Tornar único com índice
          name: item.name,
          type: "item",
          path: item.description.replace("Item importado de ", ""),
          data: item,
        });
      });

      setAvailableFiles(files);
      setSelectedFiles([]); // Começar com nenhum selecionado
      setShowSelection(true);
      setShowPreview(false);
      setShowExecute(false);

      setMessage(
        `✅ Análise concluída! ${data.sectionsCount} seções e ${data.itemsCount} itens encontrados.\n\nSelecione o que deseja importar:`
      );
    } catch (error) {
      console.error("Erro na análise:", error);
      setMessage(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para seleção interativa - CORRIGIDAS
  const handleSelectFile = (fileId) => {
    const file = availableFiles.find((f) => f.id === fileId);
    if (file && !selectedFiles.find((f) => f.id === fileId)) {
      setSelectedFiles((prev) => [...prev, file]);
    }
  };

  const handleDeselectFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSelectAll = () => {
    setSelectedFiles([...availableFiles]);
  };

  const handleDeselectAll = () => {
    setSelectedFiles([]);
  };

  const handleConfirmSelection = () => {
    if (selectedFiles.length === 0) {
      setMessage("Por favor, selecione pelo menos um arquivo para importar.");
      return;
    }

    // Reconstruir o plano de importação com apenas os arquivos selecionados
    const selectedSections = selectedFiles
      .filter((f) => f.type === "section")
      .map((f) => f.data);

    const selectedItems = selectedFiles
      .filter((f) => f.type === "item")
      .map((f) => f.data);

    // Manter apenas os content types necessários
    const usedContentTypeNames = new Set([
      ...selectedSections.map((s) => s.contentTypeId),
      ...selectedItems.map((i) => i.contentTypeId),
    ]);

    const filteredContentTypes = importPlan.contentTypes.filter((ct) =>
      usedContentTypeNames.has(ct.name)
    );

    const filteredImportPlan = {
      sections: selectedSections,
      items: selectedItems,
      contentTypes: filteredContentTypes,
    };

    setImportPlan(filteredImportPlan);
    setShowSelection(false);
    setShowPreview(true);
    setMessage(
      `✅ ${selectedFiles.length} arquivos selecionados para importação.`
    );
  };

  const handleExecute = async () => {
    if (!importPlan) {
      setMessage("Nenhum plano de importação disponível.");
      return;
    }

    if (!currentWorkspace) {
      setMessage("Erro: Nenhum workspace selecionado");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/importer/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          importPlan,
          workspaceId: currentWorkspace._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na execução");
      }

      const data = await response.json();
      setMessage(data.message);
      setShowExecute(false);
      setShowPreview(false);
      setShowSelection(false);
      setImportPlan(null);
      setAvailableFiles([]);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Erro na execução:", error);
      setMessage(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    if (!importPlan) return null;

    return (
      <Card className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Preview da Importação</h3>

        {/* ContentTypes */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">
            ContentTypes que serão criados:
          </h4>
          <div className="space-y-2">
            {importPlan.contentTypes.map((ct, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-md">
                <div className="font-medium">{ct.name}</div>
                <div className="text-sm text-gray-600">Slug: {ct.slug}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Addons: {ct.addons.map((addon) => addon.type).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">
            Sections que serão criadas:
          </h4>
          <div className="space-y-2">
            {importPlan.sections.map((section, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-md">
                <div className="font-medium">{section.name}</div>
                <div className="text-sm text-gray-600">
                  Slug: {section.slug}
                </div>
                <div className="text-sm text-gray-600">
                  Pública: {section.publicAccess.isPublic ? "Sim" : "Não"}
                </div>
                <div className="text-sm text-gray-600">
                  Ordem: {section.order}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-2">
            Items que serão criados:
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {importPlan.items.map((item, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-md">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-600">Slug: {item.slug}</div>
                <div className="text-sm text-gray-600">
                  Status: {item.status}
                </div>
                <div className="text-sm text-gray-600">Ordem: {item.order}</div>
                <div className="text-xs text-gray-500 mt-1">
                  <strong>Dados:</strong>{" "}
                  {JSON.stringify(item.data).substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <Button
            onClick={handleExecute}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Executando..." : "✅ Confirmar e Importar"}
          </Button>
          <Button
            onClick={() => {
              setShowPreview(false);
              setImportPlan(null);
              setMessage("");
            }}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
          >
            ❌ Cancelar
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Importador de Conteúdo Estático
          {currentWorkspace && (
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium ml-4">
              {currentWorkspace.name}
            </span>
          )}
        </h1>

        {/* Se não houver workspace, mostrar mensagem simples */}
        {!workspaceLoading && !currentWorkspace && (
          <div className="mb-6">
            <div className="text-red-600 font-semibold mb-2">
              Nenhum workspace encontrado. Crie um workspace pelo menu principal
              do dashboard.
            </div>
          </div>
        )}

        {/* Fluxo normal do importer */}
        {currentWorkspace && (
          <>
            <Card className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Como Funciona</h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  O importador analisa arquivos estáticos (JSON, Markdown, etc.)
                  e cria automaticamente:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>ContentTypes</strong> baseados na estrutura dos
                    dados
                  </li>
                  <li>
                    <strong>Sections</strong> correspondentes às pastas/arquivos
                  </li>
                  <li>
                    <strong>Items</strong> com o conteúdo real
                  </li>
                </ul>
                <p className="mt-4 text-sm">
                  <strong>Exemplo:</strong> Se você tem uma pasta{" "}
                  <code>content/hero/</code> com arquivos JSON, o importador
                  criará uma Section "Hero" com os Items correspondentes.
                </p>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold mb-4">Importar Conteúdo</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="importPath"
                    className="block text-sm font-medium mb-2"
                  >
                    Caminho da Pasta com Arquivos Estáticos
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="importPath"
                      value={importPath}
                      onChange={(e) => setImportPath(e.target.value)}
                      placeholder="Ex: C:\\Users\\milto\\Documents\\dash\\gatsby-landing\\content"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="file"
                      id="folderSelector"
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={handleFolderSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        document.getElementById("folderSelector").click()
                      }
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      🗂️ Selecionar Pasta
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    💡 <strong>Opção 1:</strong> Clique em "Selecionar Pasta"
                    para abrir o explorador de arquivos.
                    <br />
                    💡 <strong>Opção 2:</strong> Digite o caminho manualmente no
                    campo acima.
                    <br />
                    📝 <strong>Exemplo:</strong>{" "}
                    C:\Users\milto\Documents\dash\gatsby-landing\content
                  </p>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading || !importPath.trim()}
                  className="w-full"
                >
                  {isLoading ? "Analisando..." : "🔍 Analisar e Selecionar"}
                </Button>

                {message && (
                  <div
                    className={`p-4 rounded-md ${
                      message.startsWith("Erro")
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-green-50 text-green-700 border border-green-200"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {showSelection && (
                  <Modal
                    isOpen={showSelection}
                    onClose={() => {
                      setShowSelection(false);
                      setAvailableFiles([]);
                      setSelectedFiles([]);
                    }}
                    title="Selecionar Arquivos para Importar"
                  >
                    <FileSelectionInterface
                      availableFiles={availableFiles}
                      selectedFiles={selectedFiles}
                      onSelectFile={handleSelectFile}
                      onDeselectFile={handleDeselectFile}
                      onSelectAll={handleSelectAll}
                      onDeselectAll={handleDeselectAll}
                      onConfirmSelection={handleConfirmSelection}
                      onCancel={() => {
                        setShowSelection(false);
                        setAvailableFiles([]);
                        setSelectedFiles([]);
                      }}
                    />
                  </Modal>
                )}

                {showPreview && renderPreview()}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ImporterPage;
