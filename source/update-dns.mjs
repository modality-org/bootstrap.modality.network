import { Route53Client, ChangeResourceRecordSetsCommand, ListHostedZonesCommand } from '@aws-sdk/client-route-53';

const HOSTED_ZONE = 'Z05376073QDH3S1XSX7X7';
const BASE_DOMAIN = 'modality.network';

import devnet1 from '../networks/devnet1/info.json' with { type: "json" };
import devnet3 from '../networks/devnet3/info.json' with { type: "json" };
import devnet5 from '../networks/devnet5/info.json' with { type: "json" };
import testnet from '../networks/testnet/info.json' with { type: "json" };
import mainnet from '../networks/mainnet/info.json' with { type: "json" };

async function setMultiTXTRecord({ 
  hostedZoneId, 
  recordName, 
  txtValues, // Array of values
  ttl = 300 
}) {
  const route53 = new Route53Client({ region: 'us-east-1' });

  const params = {
    HostedZoneId: hostedZoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: recordName,
            Type: 'TXT',
            TTL: ttl,
            ResourceRecords: txtValues.map(value => ({
              // Each value needs to be wrapped in quotes
              Value: `"${value}"`
            }))
          }
        }
      ]
    }
  };

  try {
    const command = new ChangeResourceRecordSetsCommand(params);
    const response = await route53.send(command);
    return response;
  } catch (error) {
    console.error('Error setting TXT records:', error);
    throw error;
  }
}

// Example usage:
async function setRecordsFor(network) {
  // Set an A record
  await setMultiTXTRecord({
    hostedZoneId: HOSTED_ZONE,
    recordName: `_dnsaddr.${network.name}.${BASE_DOMAIN}`,
    txtValues: network.bootstrappers.map(v => `dnsaddr=${v}`)
  });
}



/// create DNS records
/// https://github.com/multiformats/multiaddr/blob/master/protocols/DNSADDR.md 
async function main() {
  const networks = [devnet1, devnet3, devnet5, testnet];
  for (const network of networks) {
    console.log(`Setting record for ${network.name}`);
    await setRecordsFor(network);
  }
}

await main();