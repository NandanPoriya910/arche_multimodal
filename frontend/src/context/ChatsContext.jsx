import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const ChatsContext = createContext(null);
export const useChats = () => useContext(ChatsContext);

export function ChatsProvider({ children }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api.listChats();
      setChats(r.chats);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
    else {
      setChats([]);
      setLoaded(false);
    }
  }, [user, refresh]);

  const value = useMemo(
    () => ({
      chats,
      loaded,
      refresh,
      async remove(id) {
        await api.deleteChat(id);
        setChats((c) => c.filter((x) => x.id !== id));
      },
      async rename(id, title) {
        const r = await api.renameChat(id, title);
        setChats((c) => c.map((x) => (x.id === id ? r.chat : x)));
      },
    }),
    [chats, loaded, refresh]
  );
  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}
