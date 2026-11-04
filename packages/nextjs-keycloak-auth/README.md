
Example:

### __app.tsx:

```
import Home from 'src/components/Home'

// import { AuthProvider } from 'src/context/AuthContext'
import { AuthProvider } from '@galicea/nextjs-keycloak-auth'

type ExtendedAppProps = AppProps & {
  Component: NextPage
}


const App = (props: ExtendedAppProps) => {

  return (
<AuthProvider
  keycloak={{
    url: process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
  }}
>
....
    <Home />
</AuthProvider>  )
}

export default App
```

### pages/login/index.tsx

```
import { LoginPage } from '@galicea/nextjs-keycloak-auth';

const Login = () => {
  return <LoginPage />;

}

export default Login
```

### package.json:

```
"dependencies": {
    "@galicea/nextjs-keycloak-auth": "^0.1.5",
...
```

<!-- 2026-10-28: dokumentacja powrotu po logowaniu i stylów Tailwinda -->
### Powrót po logowaniu (`returnTo`)

Stronę logowania wywołuj z miejscem powrotu, np. `/login?returnTo=%2Ftasks`
(helper: `buildLoginHref(router.asPath)`). Po udanym logowaniu `LoginPage`
przechodzi pod `returnTo`, a gdy go brak - na `/`. Przy błędzie zostaje na
ekranie logowania z komunikatem. Przyjmowane są tylko ścieżki względne
(`/...`), więc parametru nie da się użyć do przekierowania na obcą domenę.

### Tailwind

Komponenty używają klas Tailwinda - dodaj dist biblioteki do `content`
w `tailwind.config.js` aplikacji:

```
'./node_modules/@galicea-lab/nextjs-keycloak-auth/dist/**/*.{js,mjs}'
```
