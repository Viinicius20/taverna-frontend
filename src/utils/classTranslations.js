export const CLASSE_PT_PARA_EN = {
  'guerreiro': 'Fighter',
  'mago': 'Wizard',
  'ladino': 'Rogue',
  'clérigo': 'Cleric',
  'clerigo': 'Cleric',
  'bardo': 'Bard',
  'bruxo': 'Warlock',
  'paladino': 'Paladin',
  'druida': 'Druid',
  'patrulheiro': 'Ranger',
  'caçador': 'Ranger',
  'cacador': 'Ranger',
  'feiticeiro': 'Sorcerer',
  'bárbaro': 'Barbarian',
  'barbaro': 'Barbarian',
  'monge': 'Monk',
};

export const CLASSE_EN_PARA_PT = {
  'Fighter': 'Guerreiro',
  'Wizard': 'Mago',
  'Rogue': 'Ladino',
  'Cleric': 'Clérigo',
  'Bard': 'Bardo',
  'Warlock': 'Bruxo',
  'Paladin': 'Paladino',
  'Druid': 'Druida',
  'Ranger': 'Patrulheiro',
  'Sorcerer': 'Feiticeiro',
  'Barbarian': 'Bárbaro',
  'Monk': 'Monge',
};

export function normalizarClasseParaEN(nome) {
  if (!nome) return nome;
  const chave = nome.trim().toLowerCase();
  return CLASSE_PT_PARA_EN[chave] || nome;
}


export function traduzirClasseParaExibicao(nome) {
  if (!nome) return nome;
  return CLASSE_EN_PARA_PT[nome] || nome;
}