const EventSource = require('eventsource');

// Simular o teste do streaming
const testStreaming = async () => {
  console.log('🚀 Iniciando teste de streaming...\n');

  const payload = {
    salesRepCompany: "Test Company",
    salesRepWebsite: "https://test.com",
    solution: "Test Solution",
    targetCompany: "Target Company",
    targetWebsite: "https://target.com",
    templateId: "template_1"
  };

  try {
    console.log('📡 Fazendo requisição POST para /api/generate/stream...');

    const response = await fetch('http://localhost:3000/api/generate/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Conexão estabelecida. Esperando eventos...\n');

    let eventCount = 0;
    let completedTiles = 0;
    let totalTiles = 0;

    // Usar EventSource para ler SSE
    const eventSource = new EventSource('http://localhost:3000/api/generate/stream');

    eventSource.onmessage = (event) => {
      try {
        eventCount++;
        const streamingEvent = JSON.parse(event.data);

        console.log(`📦 Evento ${eventCount}: ${streamingEvent.type}`);

        switch (streamingEvent.type) {
          case 'connected':
            totalTiles = streamingEvent.totalTiles;
            console.log(`🔗 Conectado! Esperando ${totalTiles} tiles\n`);
            break;

          case 'tile_generated':
            completedTiles = streamingEvent.completedTiles;
            console.log(`🆕 Tile gerado: "${streamingEvent.tile.title}" (${completedTiles}/${totalTiles})`);
            break;

          case 'completed':
            console.log(`✅ Geração completa! Session ID: ${streamingEvent.sessionId}`);
            console.log(`📊 Total de tiles gerados: ${streamingEvent.workspace.tiles.length}`);
            eventSource.close();
            break;

          case 'error':
            console.error(`❌ Erro no streaming: ${streamingEvent.error}`);
            eventSource.close();
            break;
        }
      } catch (parseError) {
        console.error('❌ Erro ao parsear evento:', parseError);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Erro na conexão SSE:', error);
      eventSource.close();
    };

    // Timeout de segurança
    setTimeout(() => {
      console.log('\n⏰ Timeout de 30s atingido. Fechando conexão...');
      eventSource.close();
    }, 30000);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

testStreaming();
