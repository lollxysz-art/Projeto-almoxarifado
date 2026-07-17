function calcularTempoDecorrido({ elapsedSeconds = 0, isRunning = false, startedAt = null, horarioInicio = null, now = new Date() }) {
  if (!isRunning) return elapsedSeconds;

  const inicio = startedAt || horarioInicio;
  if (!inicio) return elapsedSeconds;

  const diffSeconds = Math.floor((new Date(now).getTime() - new Date(inicio).getTime()) / 1000);
  return elapsedSeconds + Math.max(0, diffSeconds);
}

module.exports = {
  calcularTempoDecorrido
};
