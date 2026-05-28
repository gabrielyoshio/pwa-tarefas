// ============================================================
// SERVICE WORKER — sw.js
// Esse arquivo roda em segundo plano, separado da página.
// Ele tem 3 fases (lifecycle): Install → Activate → Fetch
// ============================================================

// Nome do cache — se mudar a versão aqui, o cache antigo é apagado
const CACHE_NAME = 'taskflow-v1';

// Lista de arquivos que serão salvos no cache na primeira visita
const ASSETS_TO_CACHE = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// ============================================================
// FASE 1: INSTALL
// Roda uma vez quando o SW é registrado pela primeira vez.
// Aqui salvamos todos os arquivos do app no cache do navegador.
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Install — salvando arquivos no cache...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto, adicionando arquivos...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Todos os arquivos foram cacheados!');
        // Força o SW a ativar imediatamente sem esperar fechar abas
        return self.skipWaiting();
      })
  );
});

// ============================================================
// FASE 2: ACTIVATE
// Roda depois do Install quando o SW assume o controle.
// Aqui apagamos caches de versões antigas do app.
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate — limpando caches antigos...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            // Filtra apenas os caches que NÃO são o atual
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deletando cache antigo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Ativado! Controlando todas as abas.');
        // Assume controle de todas as abas abertas imediatamente
        return self.clients.claim();
      })
  );
});

// ============================================================
// FASE 3: FETCH
// Roda toda vez que o app faz uma requisição (carregar arquivo,
// imagem, etc). Aqui decidimos: usa o cache ou vai à rede?
//
// Estratégia usada: Cache First
// 1. Verifica se o arquivo já está no cache
// 2. Se sim → retorna do cache (funciona offline!)
// 3. Se não → busca na rede e salva no cache pra próxima vez
// ============================================================
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {

        // ✅ Encontrou no cache — retorna sem precisar de internet
        if (cachedResponse) {
          console.log('[SW] Servindo do cache:', event.request.url);
          return cachedResponse;
        }

        // ❌ Não está no cache — vai buscar na rede
        console.log('[SW] Buscando na rede:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Resposta inválida — retorna sem cachear
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clona a resposta pois ela só pode ser lida uma vez
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));

            return networkResponse;
          })
          .catch(() => {
            // Sem internet e sem cache — retorna a página principal
            console.log('[SW] Offline! Retornando index.html do cache.');
            return caches.match('./index.html');
          });
      })
  );
});