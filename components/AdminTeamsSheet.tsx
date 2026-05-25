'use client';

import { useState, type FormEvent } from 'react';
import type { ThemeColors } from '@/lib/theme';
import type { Team, Player } from '@/lib/types';
import { useTeams, usePlayers, useReloadTeams, useReloadPlayers, useReloadMatches, useToast } from '@/lib/context';
import { Eyebrow } from './primitives';

// ── helpers ────────────────────────────────────────────────

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Erro');
  return data;
}

// ── small form primitives ──────────────────────────────────

function Field({ label, children, T }: { label: string; children: React.ReactNode; T: ThemeColors }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Eyebrow size={9} color={T.mute} T={T}>{label}</Eyebrow>
      <div style={{ marginTop: 5 }}>{children}</div>
    </div>
  );
}

function Input({ T, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { T: ThemeColors }) {
  return (
    <input {...props} style={{
      width: '100%', boxSizing: 'border-box', padding: '10px 12px',
      background: T.surf, color: T.text, border: `1px solid ${T.line2}`,
      borderRadius: 10, outline: 'none', fontSize: 14,
    }} />
  );
}

function Btn({ onClick, children, primary, danger, disabled, T }: {
  onClick?: () => void; children: React.ReactNode;
  primary?: boolean; danger?: boolean; disabled?: boolean; T: ThemeColors;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        padding: '11px 18px', borderRadius: 100, fontWeight: 600, fontSize: 13,
        background: primary ? T.lime : danger ? 'transparent' : T.surf2,
        color: primary ? T.bg : danger ? T.loss : T.text,
        border: primary ? 'none' : `1px solid ${danger ? 'rgba(255,77,90,0.3)' : T.line2}`,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
      }}
    >{children}</button>
  );
}

function Select({ value, onChange, options, T }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; T: ThemeColors;
}) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 12px', boxSizing: 'border-box',
        background: T.surf, color: T.text, border: `1px solid ${T.line2}`,
        borderRadius: 10, outline: 'none', fontSize: 14,
      }}
    >
      <option value="">—</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Team form ──────────────────────────────────────────────

function TeamForm({ initial, isNew, onSave, onCancel, T }: {
  initial?: Team; isNew: boolean;
  onSave: () => void; onCancel: () => void; T: ThemeColors;
}) {
  const showToast = useToast();
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [short, setShort] = useState(initial?.short ?? '');
  const [group, setGroup] = useState<'A' | 'B'>(initial?.group ?? 'A');
  const [color, setColor] = useState(initial?.color ?? '#1a6b3a');
  const [saving, setSaving] = useState(false);

  const valid = code.trim() && name.trim() && short.trim();

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      if (isNew) {
        await api('/api/teams', 'POST', { code: code.toUpperCase(), name, short, group, color });
      } else {
        await api(`/api/teams/${initial!.code}`, 'PATCH', { code: code.toUpperCase(), name, short, group, color });
      }
      showToast(isNew ? 'Equipa adicionada' : 'Equipa guardada');
      onSave();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro ao guardar equipa', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ padding: '16px 0' }}>
      <Field label="Código (4 letras)" T={T}>
        <Input T={T} value={code} onChange={(e) => setCode(e.target.value.slice(0, 4))} placeholder="EX: CRV" autoFocus={isNew} />
      </Field>
      <Field label="Nome completo" T={T}>
        <Input T={T} value={name} onChange={(e) => setName(e.target.value)} placeholder="Os Carvalhos" />
      </Field>
      <Field label="Nome curto" T={T}>
        <Input T={T} value={short} onChange={(e) => setShort(e.target.value)} placeholder="Carvalhos" />
      </Field>
      <Field label="Grupo" T={T}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['A', 'B'] as const).map((g) => (
            <button key={g} type="button" onClick={() => setGroup(g)} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              background: group === g ? T.lime : T.surf,
              color: group === g ? T.bg : T.mute,
              border: `1px solid ${group === g ? T.lime : T.line2}`,
              fontWeight: 600, fontSize: 14,
            }}>Grupo {g}</button>
          ))}
        </div>
      </Field>
      <Field label="Cor" T={T}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${T.line2}`, cursor: 'pointer', background: 'none', padding: 2 }} />
          <Input T={T} value={color} onChange={(e) => setColor(e.target.value)} placeholder="#1a6b3a" style={{ flex: 1 }} />
        </div>
      </Field>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn T={T} onClick={onCancel}>Cancelar</Btn>
        <Btn T={T} primary onClick={() => submit()} disabled={!valid || saving}>
          {saving ? 'A guardar…' : isNew ? 'Adicionar' : 'Guardar'}
        </Btn>
      </div>
    </form>
  );
}

// ── Player form ────────────────────────────────────────────

function PlayerForm({ initial, isNew, onSave, onCancel, T }: {
  initial?: Player; isNew: boolean;
  onSave: () => void; onCancel: () => void; T: ThemeColors;
}) {
  const showToast = useToast();
  const teams = useTeams();
  const [name, setName] = useState(initial?.name ?? '');
  const [team, setTeam] = useState(initial?.team ?? '');
  const [n, setN] = useState(initial?.n ? String(initial.n) : '');
  const [saving, setSaving] = useState(false);

  const valid = name.trim() && team && n;
  const teamOptions = Object.values(teams).map((t) => ({ value: t.code, label: `${t.code} — ${t.name}` }));

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const id = isNew ? 'p_' + Math.random().toString(36).slice(2, 8) : initial!.id;
      if (isNew) {
        await api('/api/players', 'POST', { id, name, team, n: parseInt(n) });
      } else {
        await api(`/api/players/${initial!.id}`, 'PATCH', { name, team, n: parseInt(n) });
      }
      showToast(isNew ? 'Jogador adicionado' : 'Jogador guardado');
      onSave();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro ao guardar jogador', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ padding: '16px 0' }}>
      <Field label="Nome" T={T}>
        <Input T={T} value={name} onChange={(e) => setName(e.target.value)} placeholder="João Pereira" autoFocus />
      </Field>
      <Field label="Equipa" T={T}>
        <Select value={team} onChange={setTeam} options={teamOptions} T={T} />
      </Field>
      <Field label="Número de camisola" T={T}>
        <Input T={T} type="number" min="1" max="99" value={n} onChange={(e) => setN(e.target.value)} placeholder="10" />
      </Field>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn T={T} onClick={onCancel}>Cancelar</Btn>
        <Btn T={T} primary onClick={() => submit()} disabled={!valid || saving}>
          {saving ? 'A guardar…' : isNew ? 'Adicionar' : 'Guardar'}
        </Btn>
      </div>
    </form>
  );
}

// ── Main admin teams page ──────────────────────────────────

export function AdminTeamsPage({ onClose, T }: { onClose: () => void; T: ThemeColors }) {
  const showToast = useToast();
  const teams = useTeams();
  const players = usePlayers();
  const reloadTeams = useReloadTeams();
  const reloadPlayers = useReloadPlayers();
  const reloadMatches = useReloadMatches();

  const [tab, setTab] = useState<'teams' | 'players'>('teams');
  const [editingTeam, setEditingTeam] = useState<Team | 'new' | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | 'new' | null>(null);

  async function deleteTeam(code: string) {
    try {
      await api(`/api/teams/${code}`, 'DELETE');
      reloadTeams();
      showToast('Equipa eliminada');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro ao eliminar equipa', 'error');
    }
  }

  async function deletePlayer(id: string) {
    try {
      await api(`/api/players/${id}`, 'DELETE');
      reloadPlayers();
      showToast('Jogador eliminado');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Erro ao eliminar jogador', 'error');
    }
  }

  const teamList = Object.values(teams).sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  const playerList = Object.values(players).sort((a, b) => a.team.localeCompare(b.team) || a.n - b.n);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: T.bg, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: `1px solid ${T.line}`, background: T.bg2 }}>
        <div>
          <Eyebrow size={9} color={T.lime} T={T}>Admin</Eyebrow>
          <div style={{ fontWeight: 700, fontSize: 20, color: T.text, marginTop: 4, letterSpacing: -0.5 }}>Gerir Equipas</div>
        </div>
        <button onClick={onClose} style={{ background: T.surf, border: `1px solid ${T.line2}`, width: 34, height: 34, borderRadius: 100, color: T.mute, fontSize: 14 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '10px 16px', gap: 6, background: T.bg2, borderBottom: `1px solid ${T.line}` }}>
        {([{ id: 'teams', label: 'Equipas' }, { id: 'players', label: 'Jogadores' }] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 100, fontWeight: 600, fontSize: 13,
            background: tab === t.id ? T.lime : T.surf,
            color: tab === t.id ? T.bg : T.mute,
            border: `1px solid ${tab === t.id ? T.lime : T.line2}`,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }} className="scroll-hide">

        {/* ── Teams tab ──────────────────────────── */}
        {tab === 'teams' && (
          <>
            {editingTeam ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 4 }}>
                  {editingTeam === 'new' ? 'Nova equipa' : `Editar — ${(editingTeam as Team).name}`}
                </div>
                <TeamForm
                  initial={editingTeam === 'new' ? undefined : editingTeam as Team}
                  isNew={editingTeam === 'new'}
                  onSave={() => { reloadTeams(); reloadMatches(); setEditingTeam(null); }}
                  onCancel={() => setEditingTeam(null)}
                  T={T}
                />
              </>
            ) : (
              <>
                {teamList.map((team) => (
                  <div key={team.code} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', marginBottom: 8,
                    background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12,
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: team.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{team.name}</div>
                      <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>
                        <span className="mono">{team.code}</span> · Grupo {team.group} · {team.short}
                      </div>
                    </div>
                    <button onClick={() => setEditingTeam(team)} style={{ background: T.surf2, border: `1px solid ${T.line2}`, color: T.mute, padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500 }}>Editar</button>
                    <button onClick={() => deleteTeam(team.code)} style={{ background: 'transparent', border: '1px solid rgba(255,77,90,0.3)', color: T.loss, padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500 }}>Remover</button>
                  </div>
                ))}
                <button onClick={() => setEditingTeam('new')} style={{
                  width: '100%', padding: '13px', marginTop: 4,
                  background: 'transparent', border: `1px dashed ${T.lime}`,
                  color: T.lime, borderRadius: 100, fontWeight: 600, fontSize: 14,
                }}>+ Adicionar equipa</button>
              </>
            )}
          </>
        )}

        {/* ── Players tab ────────────────────────── */}
        {tab === 'players' && (
          <>
            {editingPlayer ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 4 }}>
                  {editingPlayer === 'new' ? 'Novo jogador' : `Editar — ${(editingPlayer as Player).name}`}
                </div>
                <PlayerForm
                  initial={editingPlayer === 'new' ? undefined : editingPlayer as Player}
                  isNew={editingPlayer === 'new'}
                  onSave={() => { reloadPlayers(); setEditingPlayer(null); }}
                  onCancel={() => setEditingPlayer(null)}
                  T={T}
                />
              </>
            ) : (
              <>
                {playerList.map((player) => {
                  const team = teams[player.team];
                  return (
                    <div key={player.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', marginBottom: 6,
                      background: T.surf, border: `1px solid ${T.line}`, borderRadius: 12,
                    }}>
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: team?.color ?? T.mute2, flexShrink: 0 }} />
                      <div className="mono" style={{ fontSize: 11, color: T.mute2, width: 26, textAlign: 'center' }}>#{player.n}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: T.text }}>{player.name}</div>
                        <div style={{ fontSize: 11, color: T.mute, marginTop: 1 }}>{team?.name ?? player.team}</div>
                      </div>
                      <button onClick={() => setEditingPlayer(player)} style={{ background: T.surf2, border: `1px solid ${T.line2}`, color: T.mute, padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500 }}>Editar</button>
                      <button onClick={() => deletePlayer(player.id)} style={{ background: 'transparent', border: '1px solid rgba(255,77,90,0.3)', color: T.loss, padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500 }}>Remover</button>
                    </div>
                  );
                })}
                <button onClick={() => setEditingPlayer('new')} style={{
                  width: '100%', padding: '13px', marginTop: 4,
                  background: 'transparent', border: `1px dashed ${T.lime}`,
                  color: T.lime, borderRadius: 100, fontWeight: 600, fontSize: 14,
                }}>+ Adicionar jogador</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
