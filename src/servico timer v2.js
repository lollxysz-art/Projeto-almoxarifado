// ============================================
// Rotas do cronômetro — v2 com linha do tempo
// ============================================
// Substitui o src/servicos-timer.js anterior.
// As rotas mudaram de nome para combinar com o front-end novo:
//   /api/servicos/:id/iniciar   (era /api/iniciar-servico)
//   /api/servicos/:id/pausar    (era /api/pausar-servico)
//   /api/finalizar-servico      (mesma rota, mantida)
//
// Se você ainda tem a rota /api/finalizar-servico no server.js,
// REMOVA ou comente antes de registrar este arquivo.

const express = require('express');
const router = express.Router();

// AJUSTE: mesmo que antes — confirme como o database.js exporta.
const pool = require('./database');

function pegarUsuarioLogado(req) {
  return req.session.usuario || req.session.user;
}

function podeMexer(usuario, servico) {
  return !!usuario && (usuario.isAdmin || usuario.nome === servico.funcionario);
}

function novaEntradaLog(tipo, extras = {}) {
  return JSON.stringify({ tipo, hora: new Date().toISOString(), ...extras });
}

// ── Inicia ou retoma o cronômetro ──────────────────────────────────────────
router.post('/api/servicos/:id/iniciar', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuario = pegarUsuarioLogado(req);

    const busca = await pool.query('SELECT * FROM servicos WHERE id = $1', [id]);
    const servico = busca.rows[0];
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    if (!podeMexer(usuario, servico)) return res.status(403).json({ erro: 'Sem permissão' });

    // Primeira vez → "iniciado", já estava pausado → "retomado"
    const logsExistentes = servico.logs || [];
    const tipo = logsExistentes.length === 0 ? 'iniciado' : 'retomado';
    const entrada = novaEntradaLog(tipo);

    const resultado = await pool.query(
      `UPDATE servicos
       SET is_running  = true,
           started_at  = NOW(),
           motivo_pausa = NULL,
           logs        = logs || $2::jsonb
       WHERE id = $1
       RETURNING *`,
      [id, `[${entrada}]`]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao iniciar serviço:', erro);
    res.status(500).json({ erro: 'Erro ao iniciar serviço' });
  }
});

// ── Pausa o cronômetro ─────────────────────────────────────────────────────
router.post('/api/servicos/:id/pausar', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    const usuario = pegarUsuarioLogado(req);

    const busca = await pool.query('SELECT * FROM servicos WHERE id = $1', [id]);
    const servico = busca.rows[0];
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    if (!podeMexer(usuario, servico)) return res.status(403).json({ erro: 'Sem permissão' });

    const motivoFinal = (motivo || '').trim() || 'Pausa não justificada';
    const entrada = novaEntradaLog('pausado', { motivo: motivoFinal });

    const resultado = await pool.query(
      `UPDATE servicos
       SET elapsed_seconds = elapsed_seconds +
             CASE WHEN is_running
               THEN GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER)
               ELSE 0 END,
           is_running   = false,
           started_at   = NULL,
           motivo_pausa = $2,
           logs         = logs || $3::jsonb
       WHERE id = $1
       RETURNING *`,
      [id, motivoFinal, `[${entrada}]`]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao pausar serviço:', erro);
    res.status(500).json({ erro: 'Erro ao pausar serviço' });
  }
});

// ── Finaliza o serviço ─────────────────────────────────────────────────────
router.post('/api/finalizar-servico', async (req, res) => {
  try {
    const { id, pendencia } = req.body;
    const usuario = pegarUsuarioLogado(req);

    const busca = await pool.query('SELECT * FROM servicos WHERE id = $1', [id]);
    const servico = busca.rows[0];
    if (!servico) return res.status(404).json({ erro: 'Serviço não encontrado' });
    if (!podeMexer(usuario, servico)) return res.status(403).json({ erro: 'Sem permissão' });

    const pendenciaFinal = (pendencia || '').trim();
    const entrada = novaEntradaLog('finalizado', pendenciaFinal ? { pendencia: pendenciaFinal } : {});

    const resultado = await pool.query(
      `UPDATE servicos
       SET elapsed_seconds = elapsed_seconds +
             CASE WHEN is_running
               THEN GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER)
               ELSE 0 END,
           is_running  = false,
           started_at  = NULL,
           status      = 'Finalizado',
           pendencia   = NULLIF($2, ''),
           logs        = logs || $3::jsonb
       WHERE id = $1
       RETURNING *`,
      [id, pendenciaFinal, `[${entrada}]`]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error('Erro ao finalizar serviço:', erro);
    res.status(500).json({ erro: 'Erro ao finalizar serviço' });
  }
});

module.exports = router;