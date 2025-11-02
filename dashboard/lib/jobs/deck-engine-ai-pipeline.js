"use strict";

import { sseManager } from "../sse-manager";
import { generateStreamedCompletion } from "@/lib/ai/provider";

export class DeckEngineAIPipeline {
  constructor() {
    this.sseManager = sseManager;
  }

  async processTiles(tiles, context) {
    // Validar entrada
    if (!Array.isArray(tiles) || tiles.length === 0) {
      throw new Error("Lista de tiles inválida");
    }

    // Emitir evento de progresso total
    this.sseManager.emit("tiles", "progress", {
      total: tiles.length,
      current: 0,
    });

    // Processar tiles em paralelo mantendo ordem
    const processedTiles = await Promise.all(
      tiles.map(async (tile, index) => {
        try {
          // Emitir evento de início de processamento
          this.sseManager.emit("tiles", "tile:processing", {
            tileId: tile.id,
            orderIndex: index,
            metadata: {
              startedAt: Date.now(),
              source: context.source || "user",
            },
          });

          // Processar tile
          const processedTile = await this.processTile(tile, {
            ...context,
            orderIndex: index,
          });

          // Emitir evento de tile gerado com ordem preservada
          this.sseManager.emit("tiles", "tile:generated", {
            tileId: tile.id,
            content: processedTile.content,
            orderIndex: index,
            metadata: {
              processedAt: Date.now(),
              source: context.source || "user",
              model: processedTile.model || context.model || "unknown",
              usage: processedTile.usage,
              duration: processedTile.duration,
            },
          });

          // Atualizar progresso
          this.sseManager.emit("tiles", "progress", {
            total: tiles.length,
            current: index + 1,
            metadata: {
              updatedAt: Date.now(),
              remainingTiles: tiles.length - (index + 1),
            },
          });

          return {
            ...processedTile,
            orderIndex: index,
          };
        } catch (error) {
          console.error(`Erro ao processar tile ${tile.id}:`, error);

          // Emitir evento de erro mantendo ordem
          this.sseManager.emit("tiles", "tile:error", {
            tileId: tile.id,
            error: error.message,
            orderIndex: index,
            metadata: {
              errorAt: Date.now(),
              errorType: error.name,
              source: context.source || "user",
            },
          });

          return {
            ...tile,
            error: error.message,
            status: "error",
            orderIndex: index,
          };
        }
      })
    );

    // Emitir evento de conclusão
    this.sseManager.emit("tiles", "status", {
      status: "COMPLETED",
      timestamp: Date.now(),
      metadata: {
        totalTiles: tiles.length,
        successfulTiles: processedTiles.filter(t => !t.error).length,
        failedTiles: processedTiles.filter(t => t.error).length,
      },
    });

    return processedTiles;
  }

  async processTile(tile, context) {
    // Validar entrada
    if (!tile || !tile.prompt) {
      throw new Error("Tile inválido ou prompt ausente");
    }

    const startTime = Date.now();

    try {
      // Processar variáveis no prompt
      const processedPrompt = await this.processVariables(tile.prompt, context);

      // Inicializar acumulador de conteúdo e índice de chunks
      let accumulatedContent = "";
      let chunkIndex = 0;

      // Gerar conteúdo via streaming
      for await (const chunk of generateStreamedCompletion({
        model: context.model || "gpt-3.5-turbo",
        prompt: processedPrompt,
      })) {
        // Processar chunk
        const chunkContent = typeof chunk === "string" ? chunk : chunk.content;
        accumulatedContent += chunkContent;

        // Emitir evento de chunk com ordem preservada
        this.sseManager.emit("tiles", "tile:chunk", {
          tileId: tile.id,
          orderIndex: context.orderIndex,
          chunk: chunkContent,
          chunkIndex: chunkIndex++,
          metadata: {
            timestamp: Date.now(),
            chunkSize: chunkContent.length,
            totalSize: accumulatedContent.length,
          },
        });
      }

      // Calcular duração e métricas
      const duration = Date.now() - startTime;
      const usage = {
        prompt_tokens: Math.ceil(processedPrompt.length / 4), // estimativa
        completion_tokens: Math.ceil(accumulatedContent.length / 4), // estimativa
        total_tokens: 0, // será calculado abaixo
      };
      usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

      // Retornar tile processado
      return {
        ...tile,
        content: accumulatedContent,
        prompt: processedPrompt,
        originalPrompt: tile.prompt,
        status: "completed",
        model: context.model || "gpt-3.5-turbo",
        usage,
        duration,
        metadata: {
          processedAt: Date.now(),
          chunkCount: chunkIndex,
          averageChunkSize: accumulatedContent.length / chunkIndex,
        },
      };
    } catch (error) {
      console.error(`Erro ao processar tile ${tile.id}:`, error);
      throw error;
    }
  }

  async processVariables(prompt, context) {
    try {
      // Processar variáveis simples
      const processed = prompt.replace(/\${(\w+)}/g, (match, key) => {
        const value = context[key];
        if (value === undefined) {
          throw new Error(`Variável não encontrada: ${key}`);
        }
        return value;
      });

      // Processar variáveis aninhadas (e.g. ${company.name})
      return processed.replace(/\${(\w+)\.(\w+)}/g, (match, obj, prop) => {
        const value = context[obj]?.[prop];
        if (value === undefined) {
          throw new Error(`Variável aninhada não encontrada: ${obj}.${prop}`);
        }
        return value;
      });
    } catch (error) {
      console.error("Erro ao processar variáveis:", error);
      throw error;
    }
  }
}