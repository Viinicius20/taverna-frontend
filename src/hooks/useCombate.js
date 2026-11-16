import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useCombate({ atalhos = true } = {}) {
  const [combatentes, setCombatentes] = useState([]);
  const [turnoAtual, setTurnoAtual] = useState(0);
  const [combateAtivo, setCombateAtivo] = useState(false);

  const proximoTurno = useCallback(() => {
    setTurnoAtual(prev => (combatentes.length ? (prev + 1) % combatentes.length : 0));
  }, [combatentes.length]);

  const adicionarMonstros = useCallback(({ nome, hp, qtd = 1, dex = null }) => {
    const base = Date.now();
    const novos = Array.from({ length: qtd }, (_, i) => ({
      id: base + i,
      nome: qtd > 1 ? `${nome} ${i + 1}` : nome,
      tipo: 'monstro',
      hpMax: Number(hp),
      hpAtual: Number(hp),
      iniciativa: dex == null
        ? 0
        : Math.floor(Math.random() * 20) + 1 + Math.floor((dex - 10) / 2),
    }));
    setCombatentes(prev => [...prev, ...novos]);
  }, []);

  function adicionarPersonagem(npc) {
    const d = npc.data || {};
    const hp = d.combat?.hp_max || d.combat?.hp || 10;
    setCombatentes(prev => {
      if (prev.some(c => c.id === npc.id)) return prev;
      return [...prev, {
        id: npc.id,
        nome: npc.name,
        tipo: npc.user_id ? 'jogador' : 'npc',
        hpMax: hp,
        hpAtual: hp,
        iniciativa: d.combat?.initiative || 0,
        avatar_url: npc.avatar_url || null,
      }];
    });
  }

  function ordenarIniciativa() {
    setCombatentes(prev => [...prev].sort((a, b) => b.iniciativa - a.iniciativa));
    setTurnoAtual(0);
  }

  function atualizarCombatente(id, campo, valor) {
    setCombatentes(prev => prev.map(c => (c.id === id ? { ...c, [campo]: valor } : c)));
  }

  function removerCombatente(id) {
    const idx = combatentes.findIndex(c => c.id === id);
    if (idx === -1) return;
    const restantes = combatentes.length - 1;
    setCombatentes(prev => prev.filter(c => c.id !== id));
    // quem sai antes do turno atual desloca o índice; se saiu o último, volta pro fim da lista
    setTurnoAtual(t => (idx < t ? t - 1 : Math.min(t, Math.max(restantes - 1, 0))));
  }

  function resetarCombate() {
    if (!window.confirm('Resetar o combate?')) return;
    setCombatentes([]);
    setTurnoAtual(0);
    setCombateAtivo(false);
  }

  function toggleCondicao(combatenteId, condicao) {
    setCombatentes(prev => prev.map(c => {
      if (c.id !== combatenteId) return c;
      const atual = c.condicoes || [];
      const novo = atual.includes(condicao)
        ? atual.filter(x => x !== condicao)
        : [...atual, condicao];
      return { ...c, condicoes: novo };
    }));
  }

  useEffect(() => {
    if (!atalhos) return;

    function onKeyDown(e) {
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;

      if (e.key === 'Enter' && combateAtivo) {
        e.preventDefault();
        proximoTurno();
      }
      if (e.code === 'Space' && combatentes.length > 0) {
        e.preventDefault();
        if (combateAtivo) proximoTurno();
        else setCombateAtivo(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [atalhos, combateAtivo, combatentes.length, proximoTurno]);

  useEffect(() => {
    if (!campanhaId) return;
    const t = setTimeout(() => {
      api.put(`/combat/${campanhaId}`, {
        combatentes,
        turno_atual: turnoAtual,
        combate_ativo: combateAtivo,
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [campanhaId, combatentes, turnoAtual, combateAtivo]);

  return {
    combatentes, setCombatentes,
    turnoAtual, setTurnoAtual,
    combateAtivo, setCombateAtivo,
    proximoTurno, adicionarPersonagem, ordenarIniciativa,
    atualizarCombatente, removerCombatente, resetarCombate, toggleCondicao,
    adicionarMonstros,
  };
}