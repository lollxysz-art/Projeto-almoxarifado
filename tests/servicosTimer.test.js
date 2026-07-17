    const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularTempoDecorrido } = require('../src/timerUtils');

test('retorna o tempo acumulado sem cronômetro rodando', () => {
  const result = calcularTempoDecorrido({
    elapsedSeconds: 90,
    isRunning: false,
    startedAt: null,
    now: new Date('2026-07-17T10:00:00Z')
  });

  assert.equal(result, 90);
});

test('acrescenta o tempo corrido quando o cronômetro está rodando', () => {
  const result = calcularTempoDecorrido({
    elapsedSeconds: 120,
    isRunning: true,
    startedAt: new Date('2026-07-17T09:58:00Z'),
    now: new Date('2026-07-17T10:00:00Z')
  });

  assert.equal(result, 240);
});

test('aceita o campo horario_inicio como alternativa ao started_at', () => {
  const result = calcularTempoDecorrido({
    elapsedSeconds: 30,
    isRunning: true,
    horarioInicio: new Date('2026-07-17T09:59:00Z'),
    now: new Date('2026-07-17T10:01:00Z')
  });

  assert.equal(result, 150);
});
