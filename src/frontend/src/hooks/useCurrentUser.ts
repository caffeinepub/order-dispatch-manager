import {
  type ReactNode,
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppUser } from "../backend.d";
import { UserRole } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export interface CurrentUserContextValue {
  currentUser: AppUser | null;
  isLoadingUser: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(
  undefined,
);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    if (!identity || !actor || isFetching) {
      setCurrentUser(null);
      return;
    }

    let cancelled = false;
    setIsLoadingUser(true);

    const principalText = identity.getPrincipal().toString();
    void actor
      .getUserByPrincipal(principalText)
      .then((user) => {
        if (!cancelled) {
          setCurrentUser(user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingUser(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [identity, actor, isFetching]);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      currentUser,
      isLoadingUser,
      isAdmin: currentUser?.role === UserRole.admin,
      isStaff: currentUser?.role === UserRole.staff,
    }),
    [currentUser, isLoadingUser],
  );

  return createElement(CurrentUserContext.Provider, { value, children });
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  }
  return context;
}
