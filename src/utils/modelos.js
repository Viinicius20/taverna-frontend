export const MODELOS = {
  npc: [
    { id: 'comerciante', emoji: '🛒', label: 'Comerciante',
      descricao: 'Comerciante com personalidade negociadora, um segredo sobre a origem de uma mercadoria, 3 itens à venda com preço em PO (um deles incomum) e um gancho de missão que ele pode oferecer ao grupo.' },
    { id: 'vilao', emoji: '😈', label: 'Vilão',
      descricao: 'Vilão com motivação compreensível (evite "dominar o mundo"), método de operação, uma fraqueza ou ponto cego, um capanga leal e uma forma de o grupo achar pistas dele antes do confronto.' },
  ],
  encontro: [
    { id: 'emboscada', emoji: '🗡️', label: 'Emboscada', bioma: 'Floresta',
      contexto: 'Emboscada em terreno que favorece os inimigos (cobertura, altura), com inimigos escondidos detectáveis por teste de Percepção, um gatilho que revela a armadilha e uma saída tática para o grupo.' },
  ],
  local: [
    { id: 'taverna', emoji: '🍺', label: 'Taverna', tipo: 'taverna',
      descricao: 'Taverna com nome memorável, dono(a) e dois frequentadores com ganchos de história, cardápio com 3 pratos e preços, um boato local e um problema em andamento (briga, dívida, hóspede suspeito).' },
    { id: 'masmorra', emoji: '🏚️', label: 'Masmorra', tipo: 'masmorra',
      descricao: 'Masmorra de 5 a 7 salas com um tema, um desafio de cada tipo (combate, armadilha, enigma), um chefe, tesouro e uma pista de lore sobre quem a construiu.' },
  ],
  quest: [
    { id: 'investigacao', emoji: '🔍', label: 'Quest de investigação',
      descricao: 'Mistério com um crime ou desaparecimento, 3 suspeitos com motivo e álibi, 4 pistas em locais diferentes, uma pista falsa e a verdade por trás de tudo, com o que acontece se o grupo errar a conclusão.' },
  ],
};