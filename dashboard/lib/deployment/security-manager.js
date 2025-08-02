import crypto from "crypto";
import { db } from "../db";
import { ObjectId } from "mongodb";

class SecurityManager {
  constructor() {
    this.encryptionKey = process.env.CLERK_ENCRYPTION_KEY; // Corrigido para usar a chave existente
    if (!this.encryptionKey) {
      throw new Error(
        "CLERK_ENCRYPTION_KEY não está definida no ambiente. Execute 'npm run dash:superadmin' para gerá-la."
      );
    }
  }

  // Criptografar tokens antes de armazenar
  encryptToken(token) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(this.encryptionKey, "hex"),
      iv
    );
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  // Descriptografar tokens
  decryptToken(encryptedToken) {
    try {
      const [ivHex, encrypted] = encryptedToken.split(":");
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(this.encryptionKey, "hex"),
        iv
      );
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Erro ao descriptografar token:", error);
      throw new Error("Não foi possível descriptografar o token.");
    }
  }

  // Validar permissões de deploy
  async validateDeployPermissions(userId, workspaceId) {
    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
    });

    if (!workspace) {
      throw new Error("Workspace não encontrado");
    }

    const isOwner = workspace.ownerId === userId;
    const isAdmin = workspace.members?.some(
      (member) => member.userId === userId && member.role === "admin"
    );

    if (!isOwner && !isAdmin) {
      throw new Error("Sem permissão para deploy");
    }

    return true;
  }

  // Rate limiting para deploys
  async checkRateLimit(userId) {
    const oneHour = 60 * 60 * 1000;
    const recentDeploys = await db.find("deployments", {
      userId,
      createdAt: { $gte: new Date(Date.now() - oneHour) },
    });

    // TODO: Acessar o plano do usuário para definir o limite
    const deployLimit = 5;

    if (recentDeploys.length >= deployLimit) {
      throw new Error(`Limite de ${deployLimit} deploys por hora excedido.`);
    }

    return true;
  }

  // Sanitizar nomes de repositório
  sanitizeRepoName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 100);
  }

  // Validar tokens
  validateGitHubToken(token) {
    return (
      token &&
      (token.startsWith("ghp_") || token.startsWith("github_pat_")) &&
      token.length >= 40
    );
  }

  validateNetlifyToken(token) {
    return token && token.startsWith("nfp_") && token.length >= 40;
  }
}

export { SecurityManager };
