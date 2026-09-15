/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as BookACabRouteImport } from './routes/book-a-cab'
import { Route as CommunityRouteImport } from './routes/community'
import { Route as EmergencyRouteImport } from './routes/emergency'
import { Route as HealthyFoodRouteImport } from './routes/healthy-food'
import { Route as HostEventRouteImport } from './routes/host-event'
import { Route as NearMeRouteImport } from './routes/near-me'
import { Route as EmergencyContactRouteImport } from './routes/emergency.contact'
import { Route as HostEventDetailsRouteImport } from './routes/host-event.details'
import { Route as LoginRouteImport } from './routes/login'
import { Route as SignupRouteImport } from './routes/signup'
import { Route as SetupRouteImport } from './routes/setup'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const BookACabRoute = BookACabRouteImport.update({ id: '/book-a-cab', path: '/book-a-cab', getParentRoute: () => rootRouteImport } as any)
const CommunityRoute = CommunityRouteImport.update({ id: '/community', path: '/community', getParentRoute: () => rootRouteImport } as any)
const EmergencyRoute = EmergencyRouteImport.update({ id: '/emergency', path: '/emergency', getParentRoute: () => rootRouteImport } as any)
const HealthyFoodRoute = HealthyFoodRouteImport.update({ id: '/healthy-food', path: '/healthy-food', getParentRoute: () => rootRouteImport } as any)
const HostEventRoute = HostEventRouteImport.update({ id: '/host-event', path: '/host-event', getParentRoute: () => rootRouteImport } as any)
const NearMeRoute = NearMeRouteImport.update({ id: '/near-me', path: '/near-me', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
const SignupRoute = SignupRouteImport.update({ id: '/signup', path: '/signup', getParentRoute: () => rootRouteImport } as any)
const SetupRoute = SetupRouteImport.update({ id: '/setup', path: '/setup', getParentRoute: () => rootRouteImport } as any)
const ResetPasswordRoute = ResetPasswordRouteImport.update({ id: '/reset-password', path: '/reset-password', getParentRoute: () => rootRouteImport } as any)
const EmergencyContactRoute = EmergencyContactRouteImport.update({ id: '/contact', path: '/contact', getParentRoute: () => EmergencyRoute } as any)
const HostEventDetailsRoute = HostEventDetailsRouteImport.update({ id: '/details', path: '/details', getParentRoute: () => HostEventRoute } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/book-a-cab': typeof BookACabRoute
  '/community': typeof CommunityRoute
  '/emergency': typeof EmergencyRouteWithChildren
  '/healthy-food': typeof HealthyFoodRoute
  '/host-event': typeof HostEventRouteWithChildren
  '/near-me': typeof NearMeRoute
  '/login': typeof LoginRoute
  '/signup': typeof SignupRoute
  '/setup': typeof SetupRoute
  '/reset-password': typeof ResetPasswordRoute
  '/emergency/contact': typeof EmergencyContactRoute
  '/host-event/details': typeof HostEventDetailsRoute
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById extends FileRoutesByFullPath { __root__: typeof rootRouteImport }
export interface FileRouteTypes { fileRoutesByFullPath: FileRoutesByFullPath; fullPaths: keyof FileRoutesByFullPath; fileRoutesByTo: FileRoutesByTo; to: keyof FileRoutesByFullPath; id: keyof FileRouteTypes['fileRoutesById']; fileRoutesById: FileRoutesById }

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/book-a-cab': { id: '/book-a-cab'; path: '/book-a-cab'; fullPath: '/book-a-cab'; preLoaderRoute: typeof BookACabRouteImport; parentRoute: typeof rootRouteImport }
    '/community': { id: '/community'; path: '/community'; fullPath: '/community'; preLoaderRoute: typeof CommunityRouteImport; parentRoute: typeof rootRouteImport }
    '/emergency': { id: '/emergency'; path: '/emergency'; fullPath: '/emergency'; preLoaderRoute: typeof EmergencyRouteImport; parentRoute: typeof rootRouteImport }
    '/healthy-food': { id: '/healthy-food'; path: '/healthy-food'; fullPath: '/healthy-food'; preLoaderRoute: typeof HealthyFoodRouteImport; parentRoute: typeof rootRouteImport }
    '/host-event': { id: '/host-event'; path: '/host-event'; fullPath: '/host-event'; preLoaderRoute: typeof HostEventRouteImport; parentRoute: typeof rootRouteImport }
    '/near-me': { id: '/near-me'; path: '/near-me'; fullPath: '/near-me'; preLoaderRoute: typeof NearMeRouteImport; parentRoute: typeof rootRouteImport }
    '/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }
    '/signup': { id: '/signup'; path: '/signup'; fullPath: '/signup'; preLoaderRoute: typeof SignupRouteImport; parentRoute: typeof rootRouteImport }
    '/setup': { id: '/setup'; path: '/setup'; fullPath: '/setup'; preLoaderRoute: typeof SetupRouteImport; parentRoute: typeof rootRouteImport }
    '/reset-password': { id: '/reset-password'; path: '/reset-password'; fullPath: '/reset-password'; preLoaderRoute: typeof ResetPasswordRouteImport; parentRoute: typeof rootRouteImport }
    '/emergency/contact': { id: '/emergency/contact'; path: '/contact'; fullPath: '/emergency/contact'; preLoaderRoute: typeof EmergencyContactRouteImport; parentRoute: typeof EmergencyRoute }
    '/host-event/details': { id: '/host-event/details'; path: '/details'; fullPath: '/host-event/details'; preLoaderRoute: typeof HostEventDetailsRouteImport; parentRoute: typeof HostEventRoute }
  }
}
interface EmergencyRouteChildren { EmergencyContactRoute: typeof EmergencyContactRoute }
const EmergencyRouteWithChildren = EmergencyRoute._addFileChildren({ EmergencyContactRoute })
interface HostEventRouteChildren { HostEventDetailsRoute: typeof HostEventDetailsRoute }
const HostEventRouteWithChildren = HostEventRoute._addFileChildren({ HostEventDetailsRoute })
const rootRouteChildren = { IndexRoute, BookACabRoute, CommunityRoute, EmergencyRoute: EmergencyRouteWithChildren, HealthyFoodRoute, HostEventRoute: HostEventRouteWithChildren, NearMeRoute, LoginRoute, SignupRoute, SetupRoute, ResetPasswordRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>>; config: Awaited<ReturnType<typeof startInstance.getOptions>> } }