import http from 'http';

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: b });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const payload = {
    supplyType: 'O',
    subSupplyType: '1',
    docType: 'INV',
    docNo: 'INV-FIX-' + Date.now(),
    docDate: '2026-10-24',
    fromGstin: '07AAAAA0000A1Z5',
    fromTrdName: 'Sharma Traders',
    fromAddr1: 'Commercial Market',
    fromPlace: 'Delhi',
    fromPincode: 110006,
    fromStateCode: 7,
    toGstin: '07BBBBA1111B1Z2',
    toTrdName: 'Gupta Hardware Store',
    toAddr1: 'Connaught Place',
    toPlace: 'Delhi',
    toPincode: 110001,
    toStateCode: 7,
    totalValue: 41000,
    totInvValue: 50000,
    cgstValue: 4500,
    sgstValue: 4500,
    igstValue: 0,
    cessValue: 0,
    transDistance: 25,
    transMode: '1',
    vehicleNo: 'DL01AB1234',
    vehicleType: 'R',
    itemList: [
      {
        itemNo: 1,
        productName: 'Commercial Goods Cargo',
        productDesc: 'Hardware / Electrical Items',
        hsnCode: 8539,
        quantity: 10,
        qtyUnit: 'PCS',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        cessRate: 0,
        taxableAmount: 41000
      }
    ]
  };

  console.log('1. Testing /api/v1/eway/validate WITHOUT auth header...');
  const valRes = await post('/api/v1/eway/validate', payload);
  console.log('Validate status:', valRes.status, 'Valid:', valRes.body?.valid);
  if (!valRes.body?.valid) {
    console.error('Validation failed:', valRes.body);
    process.exit(1);
  }

  console.log('2. Testing /api/v1/eway/generate WITHOUT auth header...');
  const genRes = await post('/api/v1/eway/generate', payload);
  console.log('Generate status:', genRes.status, 'Success:', genRes.body?.success, 'EWB:', genRes.body?.ewayBillNo);
  if (!genRes.body?.success || !genRes.body?.ewayBillNo) {
    console.error('Generation failed:', genRes.body);
    process.exit(1);
  }

  console.log('3. Testing /api/v1/eway distance calculation without auth header...');
  const distRes = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:3000/api/v1/eway/distance?from=110006&to=110001', res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
  console.log('Distance calculation result:', distRes);

  console.log('\n=============================================');
  console.log('>>> ALL VERIFICATION TESTS PASSED CLEANLY <<<');
  console.log('=============================================');
}

run().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
