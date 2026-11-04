// components/LogoutButton.tsx

import { Icon } from '@iconify/react';
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";

const secondaryButtonClass =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2'

const LogoutButton = () => {
  const auth = useAuth()
  const { t } = useTranslation()
  return (
    <button className={secondaryButtonClass} onClick={() => auth.logout()}>
      <Icon icon="mdi:logout" fontSize={18} />
      {t('Logout')} {auth.user?.email}
    </button>
  )
}
export default LogoutButton 



