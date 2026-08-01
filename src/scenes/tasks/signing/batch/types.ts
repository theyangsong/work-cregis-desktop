export type BatchIneligibleReason =
  | 'wallet-shard-missing'
  | 'non-whitelist'
  | 'blacklist'
  | 'insufficient-balance'
  | 'insufficient-miner-fee';

export type BatchAddressDisplay = {
  alias: string;
  address: string;
  tags: string[];
  /** 展示用单行文案 */
  displayLine: string;
};

export type SigningBatchRowModel = {
  rowIndex: number;
  signingId: string;
  currencyKey: string;
  symbol: string;
  networkLabel: string;
  currencyLabel: string;
  cryptoName: string;
  showNetwork: boolean;
  walletName: string;
  sender: BatchAddressDisplay;
  receiver: BatchAddressDisplay;
  businessType: string;
  amountCrypto: string;
  amountFiat: string;
  amountFull: string;
  isSingleSign: boolean;
};

export type BatchEligibilityResult = {
  signable: SigningBatchRowModel[];
  ineligible: Array<{ row: SigningBatchRowModel; reason: BatchIneligibleReason }>;
};

/** 矿工费四套网络类（与 MinerFeeProfile / EVM shell variant 对齐）。 */
export type BatchNetworkGroupKey = 'evm' | 'btc' | 'ton-xrp' | 'tron';

/** 批处理币种选择：按「币种 + 网络」分组（单签待签名）。 */
export type BatchCurrencyGroup = {
  currencyKey: string;
  currencyLabel: string;
  symbol: string;
  networkLabel: string;
  /** EgCrypto name（与列表币种列一致）。 */
  cryptoName: string;
  showNetwork: boolean;
  /** 该币种下待签名单签条数。 */
  count: number;
  rowIndexes: number[];
};

export type BatchSigningTaskStatus = 'running' | 'ended' | 'stopped' | 'abnormal';

export type BatchSigningRowStatus =
  | 'pending'
  | 'signing'
  | 'broadcasting'
  | 'success'
  | 'failed';

export type BatchSigningFailReason =
  | 'already-processed'
  | 'quota-insufficient'
  | 'balance-insufficient'
  | 'miner-fee-insufficient'
  | 'sign-failed'
  | 'broadcast-failed'
  | 'mpc-network-error'
  | 'data-error';

export type BatchSigningTaskRow = {
  signingId: string;
  rowIndex: number;
  status: BatchSigningRowStatus;
  failReason?: BatchSigningFailReason;
  txHash?: string;
  minerFeeDisplay?: string;
  updatedAt: number;
};

export type BatchSigningTask = {
  id: string;
  currencyKey: string;
  currencyLabel: string;
  status: BatchSigningTaskStatus;
  startedAt: number;
  endedAt?: number;
  remark: string;
  minerFeeDisplay: string | null;
  /** 演示：进度页逐笔提交时使用 */
  verifyPassword?: string;
  rows: BatchSigningTaskRow[];
};

export type BatchSummaryBreakdown = {
  businessTypes: Array<{ label: string; count: number }>;
  wallets: Array<{ label: string; count: number }>;
  totalCrypto: string;
  totalFiat: string;
};
