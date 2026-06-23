export enum UserRole {
  ADMIN = "ADMIN",
  ARTIST = "ARTIST",
  FAN = "FAN",
  ORGANIZER = "ORGANIZER",
  PRODUCTION_HOUSE = "PRODUCTION_HOUSE",
}

export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.ORGANIZER]: 80,
  [UserRole.ARTIST]: 60,
  [UserRole.PRODUCTION_HOUSE]: 40,
  [UserRole.FAN]: 20,
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrator",
  [UserRole.ARTIST]: "Artist",
  [UserRole.FAN]: "Fan",
  [UserRole.ORGANIZER]: "Event Organizer",
  [UserRole.PRODUCTION_HOUSE]: "Production House",
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Full platform access and user management",
  [UserRole.ARTIST]: "Create events, upload songs, mint NFTs",
  [UserRole.FAN]: "Buy tickets, collect NFTs, vote for artists",
  [UserRole.ORGANIZER]: "Create and manage events, sell tickets",
  [UserRole.PRODUCTION_HOUSE]: "Manage event production and logistics",
}

export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
  TICKET_PURCHASE = "TICKET_PURCHASE",
  ROYALTY_PAYMENT = "ROYALTY_PAYMENT",
}

export interface IUser {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type IUserPublic = Omit<IUser, "password">

export interface IWallet {
  id: string
  userId: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface IEvent {
  id: string
  artistId: string
  title: string
  description: string
  venue: string
  date: Date
  ticketPrice: number
  status: EventStatus
  createdAt: Date
  updatedAt: Date
}

export interface ITicket {
  id: string
  eventId: string
  userId: string
  seatNumber: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ISong {
  id: string
  artistId: string
  title: string
  description: string
  createdAt: Date
  updatedAt: Date
}

export interface INFT {
  id: string
  songId: string
  ownerId: string
  price: number
  createdAt: Date
  updatedAt: Date
}

export interface IRoyalty {
  id: string
  nftId: string
  artistId: string
  amount: number
  createdAt: Date
  updatedAt: Date
}

export interface IVote {
  id: string
  artistId: string
  fanId: string
  weight: number
  createdAt: Date
  updatedAt: Date
}

export interface ITransaction {
  id: string
  senderId: string
  receiverId: string
  amount: number
  type: TransactionType
  createdAt: Date
  updatedAt: Date
}

export interface IUserWithRelations extends IUser {
  wallet: IWallet | null
  events: IEvent[]
  tickets: ITicket[]
  songs: ISong[]
  nftsOwned: INFT[]
  votesGiven: IVote[]
  votesReceived: IVote[]
}

export interface IEventWithRelations extends IEvent {
  artist: IUser
  tickets: ITicket[]
}

export interface INFTWithRelations extends INFT {
  song: ISong
  owner: IUser
  royalties: IRoyalty[]
}
