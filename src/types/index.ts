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
  phone: string | null
  password: string
  role: UserRole
  walletAddress: string | null
  isVerified: boolean
  isApproved: boolean
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
  organizerId: string
  title: string
  description: string
  venue: string
  city: string | null
  country: string | null
  eventDate: Date
  capacity: number | null
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
  nftTokenId: string | null
  qrCode: string | null
  status: string
  purchaseDate: Date
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
  creatorId: string | null
  ownerId: string
  songId: string
  tokenId: string | null
  contractAddress: string | null
  metadataUrl: string | null
  price: number
  royaltyPercentage: number
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface IRoyalty {
  id: string
  nftId: string
  artistId: string
  percentage: number | null
  amount: number
  transactionHash: string | null
  paidAt: Date | null
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
  userId: string | null
  senderId: string
  receiverId: string
  amount: number
  currency: string
  type: TransactionType
  status: string
  blockchainHash: string | null
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
  organizer: IUser
  tickets: ITicket[]
}

export interface IWalletWithTransactions extends IWallet {
  sentTransactions: ITransaction[]
  receivedTransactions: ITransaction[]
}

export interface ICreateEventInput {
  title: string
  description: string
  venue: string
  eventDate: string
  ticketPrice: number
  capacity?: number
  artists?: string[]
  sponsors?: string[]
}

export interface IUpdateEventInput {
  title?: string
  description?: string
  venue?: string
  eventDate?: string
  ticketPrice?: number
  capacity?: number
  artists?: string[]
  sponsors?: string[]
}

export interface ITransferInput {
  receiverEmail: string
  amount: number
}

export interface ITicketWithEvent extends ITicket {
  event: IEvent & { organizer: { id: string; name: string } }
}

export interface INftPurchaseRequest {
  nftId: string
}

export interface IMintNftInput {
  title: string
  description: string
  price: number
  royaltyPercentage: number
}

export interface INFTWithRelations extends INFT {
  song: ISong
  owner: IUser
  royalties: IRoyalty[]
}

export interface IProductionContract {
  id: string
  productionHouseId: string
  artistId: string
  revenueSplit: number
  royaltySplit: number
  createdAt: string
  updatedAt: string
}

export interface ISmartContractSplit {
  id: string
  contractName: string
  totalRevenue: number
  artistId: string
  artistPercentage: number
  producerId: string | null
  producerPercentage: number
  labelId: string | null
  labelPercentage: number
  productionHouseId: string | null
  productionHousePercentage: number
  organizerId: string | null
  organizerPercentage: number
  createdAt: string
  updatedAt: string
}

export interface IPHDashboard {
  totalContracts: number
  activeContracts: number
  totalRevenue: number
  pendingRoyalties: number
  stakeholders: number
  recentContracts: IProductionContract[]
}

export interface IPHAnalytics {
  totalRevenue: number
  revenueGrowth: number
  activeContracts: number
  totalArtists: number
  averageRoyaltySplit: number
  monthlyRevenue: { month: string; amount: number }[]
  revenueByContract: { name: string; revenue: number }[]
}

export interface IPHStakeholder {
  id: string
  artistId: string
  artist: { id: string; name: string; email: string } | null
  contractName: string
  totalRevenue: number
  artistPercentage: number
  producerPercentage: number
  labelPercentage: number
  productionHousePercentage: number
  organizerPercentage: number
  createdAt: string
}
