import {StonApiClient} from '@ston-fi/api';
import {dexFactory} from '@ston-fi/sdk';
import {toncenterClient} from '../ton/clients';

export const stonApiClient = new StonApiClient();

export type RouterInfo = NonNullable<
  Awaited<ReturnType<typeof stonApiClient.simulateSwap>>['router']
>;

export const getRouterContracts = (routerInfo: RouterInfo) => {
  const dexContracts = dexFactory(routerInfo);

  return {
    dexContracts,
    router: toncenterClient.open(
      dexContracts.Router.create(routerInfo.address),
    ),
    proxyTon: dexContracts.pTON.create(routerInfo.ptonMasterAddress),
  };
};
