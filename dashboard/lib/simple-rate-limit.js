/**
 * Simple Rate Limiting (sem Redis)
 * Para MVP - funciona em memória local
 *
 * ⚠️ LIMITAÇÃO: Não funciona com múltiplas instâncias Vercel
 * ✅ SUFICIENTE: Para primeiros meses/centenas de guests
 * ⏳ UPGRADE: Adicionar Redis quando >100 guests/dia
 */

const rateLimitStore = new Map();

/**
 * Verifica rate limit por IP
 * Limite: 10 requests/minuto
 */
export function checkRateLimit(ip) {
  const minute = Math.floor(Date.now() / 60000); // Minuto atual
  const key = `${ip}:${minute}`;
  const count = rateLimitStore.get(key) || 0;

  if (count >= 10) {
    return {
      allowed: false,
      limit: 10,
      current: count,
      message: "Too many requests. Please wait 1 minute and try again.",
    };
  }

  rateLimitStore.set(key, count + 1);

  // Limpar cache antigo (evitar memory leak)
  cleanupOldEntries(minute);

  return {
    allowed: true,
    limit: 10,
    current: count + 1,
    remaining: 10 - count - 1,
  };
}

/**
 * Limpa entradas antigas do cache
 */
function cleanupOldEntries(currentMinute) {
  // Rodar limpeza a cada 100 entradas
  if (rateLimitStore.size < 100) return;

  const oldMinutes = [currentMinute - 5, currentMinute - 10];

  for (const [key] of rateLimitStore) {
    const keyMinute = parseInt(key.split(":")[1]);
    if (oldMinutes.includes(keyMinute)) {
      rateLimitStore.delete(key);
    }
  }

  console.log(`🧹 Rate limit cache cleaned. Size: ${rateLimitStore.size}`);
}

/**
 * Verifica rate limit por guest_id (limite diário)
 */
export async function checkDailyLimit(guestId, db) {
  const today = new Date().toISOString().split("T")[0];
  const key = `daily:${guestId}:${today}`;
  const count = rateLimitStore.get(key) || 0;

  const DAILY_LIMIT = 100; // 100 API calls por dia

  if (count >= DAILY_LIMIT) {
    return {
      allowed: false,
      limit: DAILY_LIMIT,
      current: count,
      message:
        "Daily limit reached. Sign up for unlimited access or try again tomorrow.",
    };
  }

  rateLimitStore.set(key, count + 1);

  return {
    allowed: true,
    limit: DAILY_LIMIT,
    current: count + 1,
    remaining: DAILY_LIMIT - count - 1,
  };
}
