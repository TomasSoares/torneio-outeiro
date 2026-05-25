'use client'
import { createContext, useContext } from 'react'
import type { Team, Player } from './types'
import { TEAMS, PLAYERS } from './data'

interface Ctx {
  teams: Record<string, Team>
  players: Record<string, Player>
  reloadTeams: () => void
  reloadPlayers: () => void
  reloadMatches: () => void
}

const defaults: Ctx = {
  teams: TEAMS,
  players: PLAYERS,
  reloadTeams: () => {},
  reloadPlayers: () => {},
  reloadMatches: () => {},
}

export const AppCtx = createContext<Ctx>(defaults)
export const useTeams = () => useContext(AppCtx).teams
export const usePlayers = () => useContext(AppCtx).players
export const useReloadTeams = () => useContext(AppCtx).reloadTeams
export const useReloadPlayers = () => useContext(AppCtx).reloadPlayers
export const useReloadMatches = () => useContext(AppCtx).reloadMatches
