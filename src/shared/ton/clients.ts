import {Client} from '@ston-fi/sdk';
import {TonClient4} from '@ton/ton';
import {TON_LITE_ENDPOINT, TONCENTER_RPC_ENDPOINT} from './constants';

// Shared TON clients:
// - tonLiteClient talks to lite-servers (fast seqno, reliable reads)
// - toncenterClient is a JSON-RPC instance used by STON.fi SDK helpers
export const tonLiteClient = new TonClient4({ endpoint: TON_LITE_ENDPOINT });
export const toncenterClient = new Client({ endpoint: TONCENTER_RPC_ENDPOINT });
