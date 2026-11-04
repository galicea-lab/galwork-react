import { TAuthToken } from "../configs/auth"

export type ErrCallbackType = (err: { [key: string]: string }) => void

export type LoginParams = {
  email: string
  password: string
  rememberMe?: boolean
}

export type RegisterParams = {
  email: string
  username: string
  password: string
}

export type UserDataType = {
  username: string
  email: string
  roles: string[]
  // accessToken nie powinien być tu bezpośrednio przechowywany,
  // bo jest częścią authToken. Lepiej pobierać z authToken w razie potrzeby.
  groups: string[],
  id?: number // obsolete
  role?: string // obsolete
  idToken?: string // obsolete
  userIdent? : string // obsolete
}

export type AuthValuesType = {
  loading: boolean
  logout: () => void
  authToken: TAuthToken | null
  user: UserDataType | null
  setLoading: (value: boolean) => void
  setUser: (value: UserDataType | null) => void
  setAuthToken: (token: TAuthToken | null) => void // Może być null po wylogowaniu
 }


