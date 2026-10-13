import { parseRolagem, rolar } from './rolagem';

test('lê expressões válidas', () => {
  expect(parseRolagem('1d20+5')).toEqual({ qtd: 1, lados: 20, mod: 5 });
  expect(parseRolagem('d20')).toEqual({ qtd: 1, lados: 20, mod: 0 });
  expect(parseRolagem(' 2D6 - 3 ')).toEqual({ qtd: 2, lados: 6, mod: -3 });
});

test('rejeita o que não é rolagem', () => {
  ['', 'abc', '1d', 'd', '1d1', '0d6', '101d6', '1d20+', '1d20*2', 'alert(1)', '1d20+5+3']
    .forEach(t => expect(parseRolagem(t)).toBeNull());
});

test('o resultado fica dentro dos limites', () => {
  for (let i = 0; i < 200; i++) {
    const r = rolar('2d6+3');
    expect(r.total).toBeGreaterThanOrEqual(5);
    expect(r.total).toBeLessThanOrEqual(15);
  }
});

test('usa a fonte de aleatoriedade recebida', () => {
  expect(rolar('1d20', () => 0).total).toBe(1);
  expect(rolar('1d20', () => 0.999).total).toBe(20);
});