import { createContext, useContext, useReducer } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'guest' | 'admin'
}

interface AppState {
  user: User | null
  isAuthenticated: boolean
}

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true }
    case 'LOGOUT':
      return { ...initialState }
    default:
      return state
  }
}

const StoreContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
