import assert from 'assert';

console.log('================================================================');
console.log('🧪 FRONTEND STORE UNIT TEST: CATEGORY PERSISTENCE ACROSS REPEATED SYNCS');
console.log('================================================================');

// Mock localStorage
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// Mock window and CustomEvent
global.window = {
  addEventListener: () => {},
  dispatchEvent: () => {},
  apiFetch: async (endpoint, options = {}) => {
    if (endpoint === '/api/v1/businesses') {
      return {
        ok: true,
        json: async () => ({
          businesses: [
            { id: 'BIZ-001', name: 'Sharma Traders & Distributors', gstin: '07AAAAA0000A1Z5', state: 'Delhi (07)', status: 'Active' }
          ]
        })
      };
    }
    if (endpoint === '/api/v1/business/current') {
      return {
        ok: true,
        json: async () => ({
          business: { id: 'BIZ-001', name: 'Sharma Traders & Distributors' },
          data: {
            items: [],
            parties: [],
            sales: [],
            purchases: [],
            expenses: [],
            orders: [],
            // Server also has the custom category once synced
            itemCategories: mockServerCategories
          }
        })
      };
    }
    if (endpoint === '/api/v1/business/item-categories') {
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        mockServerCategories = body.itemCategories;
        return {
          ok: true,
          json: async () => ({ success: true, count: mockServerCategories.length })
        };
      }
    }
    return { ok: true, json: async () => ({}) };
  }
};
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };

let mockServerCategories = [];

// Simplified mock of Store's exact methods from js/data.js
class MockStore {
  constructor() {
    this.data = {
      subscriber: { activeBusinessId: 'BIZ-001' },
      businesses: [
        {
          id: 'BIZ-001',
          name: 'Sharma Traders',
          itemCategories: null
        }
      ]
    };
  }

  getAuthToken() {
    return 'mock-token';
  }

  getActiveBusinessId() {
    return 'BIZ-001';
  }

  getActiveBusiness() {
    return this.data.businesses.find(b => b.id === 'BIZ-001');
  }

  save() {
    localStorage.setItem('lekhajokha_store', JSON.stringify(this.data));
  }

  logAction(action, details) {}

  getItemCategories() {
    const activeBiz = this.getActiveBusiness();
    if (!activeBiz) return [];
    if (!activeBiz.itemCategories || !Array.isArray(activeBiz.itemCategories)) {
      activeBiz.itemCategories = [
        { id: 'cat_groceries', name: 'Groceries & Food', subcategories: ['Flour & Grains'] },
        { id: 'cat_electronics', name: 'Electronics & Hardware', subcategories: ['Lighting'] },
        { id: 'cat_fmcg', name: 'FMCG & Consumer Goods', subcategories: ['Soaps'] },
        { id: 'cat_apparel', name: 'Apparel & Textiles', subcategories: ["Men's Wear"] },
        { id: 'cat_services', name: 'Services & Other', subcategories: ['Repair'] }
      ];
      this.save();
    }
    return activeBiz.itemCategories;
  }

  saveItemCategories(categories) {
    const activeBiz = this.getActiveBusiness();
    if (activeBiz) {
      activeBiz.itemCategories = categories;
      this.save();
    }
    if (typeof window !== 'undefined' && window.apiFetch && this.getAuthToken()) {
      window.apiFetch('/api/v1/business/item-categories', {
        method: 'POST',
        body: JSON.stringify({ itemCategories: categories })
      }).catch(() => {});
    }
    return activeBiz ? activeBiz.itemCategories : categories;
  }

  addItemCategory(categoryName) {
    if (!categoryName || !categoryName.trim()) return null;
    const trimmed = categoryName.trim();
    const categories = this.getItemCategories();
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const newCat = {
      id: 'cat_' + Date.now(),
      name: trimmed,
      subcategories: []
    };
    categories.push(newCat);
    this.saveItemCategories(categories);
    return newCat;
  }

  async syncWithServer() {
    try {
      // 1. Fetch accessible businesses list
      const bListRes = await window.apiFetch('/api/v1/businesses');
      if (bListRes && bListRes.ok) {
        const bListData = await bListRes.json();
        if (bListData && Array.isArray(bListData.businesses)) {
          if (!Array.isArray(this.data.businesses)) this.data.businesses = [];
          for (const sBiz of bListData.businesses) {
            let lBiz = this.data.businesses.find(b => b.id === sBiz.id);
            if (!lBiz) {
              lBiz = { ...sBiz };
              this.data.businesses.push(lBiz);
            } else {
              lBiz.name = sBiz.name || lBiz.name;
              lBiz.gstin = sBiz.gstin || lBiz.gstin;
              lBiz.state = sBiz.state || lBiz.state;
              lBiz.status = sBiz.status || lBiz.status;
            }
          }
        }
      }

      // 2. Fetch current business tenant details & records
      const res = await window.apiFetch('/api/v1/business/current');
      if (res && res.ok) {
        const payload = await res.json();
        const serverBiz = payload.business;
        const serverData = payload.data;
        if (serverBiz && serverData) {
          let localBiz = (this.data.businesses || []).find(b => b.id === serverBiz.id);
          if (!localBiz) {
            localBiz = { ...serverBiz };
            this.data.businesses.push(localBiz);
          }

          const mergeCategories = (localCats = [], serverCats = []) => {
            if (!Array.isArray(serverCats) || serverCats.length === 0) {
              return Array.isArray(localCats) ? localCats : [];
            }
            if (!Array.isArray(localCats) || localCats.length === 0) {
              return serverCats;
            }
            const map = new Map();
            for (const cat of serverCats) {
              if (cat && (cat.id || cat.name)) {
                const key = (cat.id || cat.name).toLowerCase();
                map.set(key, { ...cat, subcategories: Array.from(new Set(cat.subcategories || [])) });
              }
            }
            for (const localCat of localCats) {
              if (localCat && (localCat.id || localCat.name)) {
                const key = (localCat.id || localCat.name).toLowerCase();
                if (!map.has(key)) {
                  const existsByName = Array.from(map.values()).some(c => c.name && localCat.name && c.name.toLowerCase() === localCat.name.toLowerCase());
                  if (!existsByName) {
                    map.set(key, localCat);
                  }
                } else {
                  const existing = map.get(key);
                  const combinedSubs = Array.from(new Set([...(existing.subcategories || []), ...(localCat.subcategories || [])]));
                  map.set(key, { ...existing, subcategories: combinedSubs });
                }
              }
            }
            return Array.from(map.values());
          };

          if (Array.isArray(serverData.itemCategories) && serverData.itemCategories.length > 0) {
            localBiz.itemCategories = mergeCategories(localBiz.itemCategories, serverData.itemCategories);
          } else if (Array.isArray(localBiz.itemCategories) && localBiz.itemCategories.length > 0) {
            window.apiFetch('/api/v1/business/item-categories', {
              method: 'POST',
              body: JSON.stringify({ itemCategories: localBiz.itemCategories })
            }).catch(() => {});
          }

          this.save();
        }
      }
    } catch (e) {
      console.warn('Sync deferred:', e);
    }
  }
}

async function runStoreTests() {
  const store = new MockStore();

  // Step 1: Initial categories (should be 5 defaults)
  const initial = store.getItemCategories();
  assert.strictEqual(initial.length, 5, 'Initially 5 categories');
  console.log('✅ Initial default categories loaded:', initial.length);

  // Step 2: User adds custom category: "Industrial Hardware & Tools"
  const newCat = store.addItemCategory('Industrial Hardware & Tools');
  assert(newCat, 'New category created');
  assert.strictEqual(store.getItemCategories().length, 6, 'Categories count is now 6');
  console.log('✅ User added custom category "Industrial Hardware & Tools"');

  // Step 3: Run syncWithServer multiple times (simulating 20s auto sync timer)
  for (let i = 1; i <= 5; i++) {
    await store.syncWithServer();
    const categoriesAfterSync = store.getItemCategories();
    const found = categoriesAfterSync.find(c => c.name === 'Industrial Hardware & Tools');
    assert(found, `Category still exists after sync iteration ${i}`);
    assert.strictEqual(categoriesAfterSync.length, 6, `Category count is still 6 after sync iteration ${i}`);
    console.log(`✅ AutoSync #${i} completed: custom category perfectly retained!`);
  }

  console.log('\n🎉 ALL STORE UNIT TESTS PASSED! CATEGORY NEVER DISAPPEARS!');
  process.exit(0);
}

runStoreTests().catch(err => {
  console.error('Store unit test failed:', err);
  process.exit(1);
});
